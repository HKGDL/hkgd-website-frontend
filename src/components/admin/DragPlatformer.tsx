import { useState, useEffect, useRef } from 'react';
import { X, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { Level } from '@/types';

export function DragPlatformer() {
  const [platformerLevels, setPlatformerLevels] = useState<Level[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragItemRef = useRef<Level | null>(null);

  useEffect(() => {
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
  }, []);

  const filteredLevels = searchQuery
    ? platformerLevels.filter(l => 
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.creator?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : platformerLevels;

  // Button move
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= platformerLevels.length) return;
    
    const newItems = [...platformerLevels];
    const [item] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, item);
    setPlatformerLevels(newItems);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, level: Level, index: number) => {
    dragItemRef.current = level;
    setDragIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;
    
    const newItems = [...platformerLevels];
    const dragItem = dragItemRef.current;
    if (!dragItem) return;
    
    const oldIdx = newItems.findIndex(l => l.id === dragItem.id);
    if (oldIdx === -1) return;
    
    const [item] = newItems.splice(oldIdx, 1);
    newItems.splice(index, 0, item);
    setPlatformerLevels(newItems);
    setDragIdx(index);
  };

  const handleDragEnd = () => {
    dragItemRef.current = null;
    setDragIdx(null);
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

        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="mb-4 bg-card"
        />

        <div className="space-y-2 mb-8">
          {filteredLevels.map((level, index) => (
            <div
              key={level.id}
              draggable
              onDragStart={(e) => handleDragStart(e, level, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50 cursor-move ${
                dragIdx === index ? 'opacity-50' : ''
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveItem(index, 'down')}
                disabled={index === filteredLevels.length - 1}
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
              
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <span className="font-bold text-white text-sm">{index + 1}</span>
              </div>
              
              <div className="flex-1">
                <div className="font-medium">{level.name}</div>
                <div className="text-xs text-muted-foreground">by {level.creator}</div>
              </div>
            </div>
          ))}
        </div>

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