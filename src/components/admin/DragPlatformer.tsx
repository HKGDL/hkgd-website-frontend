import { useState, useEffect, useCallback } from 'react';
import { X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import type { Level } from '@/types';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';

interface DragPlatformerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export function DragPlatformerModal({ open, onOpenChange, onSave }: DragPlatformerModalProps) {
  const [platformerLevels, setPlatformerLevels] = useState<Level[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadLevels = useCallback(async () => {
    setIsLoading(true);
    try {
      const levels = await api.getPlatformerLevels();
      const sorted = [...levels].sort((a, b) => (a.hkgdRank || 0) - (b.hkgdRank || 0));
      setPlatformerLevels(sorted);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadLevels();
    }
  }, [open, loadLevels]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(platformerLevels);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPlatformerLevels(items);
  };

  const filteredLevels = searchQuery
    ? platformerLevels.filter(l => 
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.creator?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : platformerLevels;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updates = filteredLevels.map((level, index) => {
        const newRank = index + 1;
        return api.updatePlatformerLevel(level.id, { ...level, hkgdRank: newRank });
      });
      await Promise.all(updates);
      onSave?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] sm:max-h-[80vh] p-3 sm:p-6">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <GripVertical className="w-5 h-5" />
            <span className="hidden sm:inline">Reorder Platformer Difficulty</span>
            <span className="sm:hidden">Reorder Difficulty</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="h-10 text-sm"
          />

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredLevels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No platformer levels found</div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="platformer-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto -mx-2 px-2"
                  >
                    {filteredLevels.map((level, index) => (
                      <Draggable key={level.id} draggableId={level.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-colors touch-manipulation ${
                              snapshot.isDragging
                                ? 'bg-purple-500/30 border-purple-500 shadow-xl scale-[1.02]'
                                : 'bg-card border-border hover:border-border/80'
                            }`}
                          >
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
                              <span className="font-bold text-white text-xs sm:text-sm">{index + 1}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm sm:text-base truncate">{level.name}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                by {level.creator}
                              </div>
                            </div>

                            <div className="shrink-0 text-[10px] sm:text-xs text-muted-foreground hidden xs:inline">
                              #{level.hkgdRank}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 pt-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 text-sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex-1 h-10 text-sm"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DragPlatformer() {
  const [platformerLevels, setPlatformerLevels] = useState<Level[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (window.location.pathname === '/admin/drag-platformer') {
      const loadLevels = async () => {
        try {
          const levels = await api.getPlatformerLevels();
          const sorted = [...levels].sort((a, b) => (b.hkgdRank || 0) - (a.hkgdRank || 0));
          setPlatformerLevels(sorted);
        } catch (error) {
          console.error('Failed to load:', error);
        }
      };
      loadLevels();
    }
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(platformerLevels);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPlatformerLevels(items);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updates = platformerLevels.map((level, index) => {
        const newRank = platformerLevels.length - index;
        return api.updatePlatformerLevel(level.id, { ...level, hkgdRank: newRank });
      });
      await Promise.all(updates);
      alert('Saved!');
      setTimeout(() => window.close(), 1000);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Platformer Ranking</h1>
          <Button variant="outline" size="icon" onClick={() => window.close()}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="platformer-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 mb-8"
              >
                {platformerLevels.map((level, index) => (
                  <Draggable key={level.id} draggableId={level.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          snapshot.isDragging
                            ? 'bg-purple-500/20 border-purple-500'
                            : 'bg-card border-border'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                          <span className="font-bold text-white text-sm">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium">{level.name}</div>
                          <div className="text-xs text-muted-foreground">by {level.creator}</div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => window.close()}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-green-600">
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}