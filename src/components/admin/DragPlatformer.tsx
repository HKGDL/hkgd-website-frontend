import { useState, useEffect, useRef, useMemo } from 'react';
import { X, GripVertical, ArrowUp, ArrowDown, SortAsc, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { css } from '@emotion/css';
import { api } from '@/lib/api';
import type { Level } from '@/types';

type SortOption = 'hkgdRank' | 'name' | 'creator';

export function DragPlatformer() {
  const [platformerLevels, setPlatformerLevels] = useState<Level[]>([]);
  const [draggedItem, setDraggedItem] = useState<Level | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('hkgdRank');
  const [searchQuery, setSearchQuery] = useState('');
  const dragItemRef = useRef<{ item: Level; index: number } | null>(null);

  // Load platformer levels on mount
  useEffect(() => {
    const loadLevels = async () => {
      try {
        const levels = await api.getPlatformerLevels();
        setPlatformerLevels([...levels].sort((a, b) => b.hkgdRank - a.hkgdRank));
      } catch (error) {
        console.error('Failed to load platformer levels:', error);
        alert('Failed to load platformer levels. Check console for details.');
      }
    };
    loadLevels();
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, level: Level, index: number) => {
    setDraggedItem(level);
    setIsDragging(true);
    dragItemRef.current = { item: level, index };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', level.id);
    e.dataTransfer.effectAllowed = 'none';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const newItems = [...platformerLevels];
    const draggedIndex = newItems.findIndex(item => item.id === draggedItem.id);

    if (draggedIndex === index) {
      setDraggedItem(null);
      setDragOverIndex(null);
      setIsDragging(false);
      return;
    }

    const [removedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, removedItem);

    setPlatformerLevels(newItems);
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging(false);
    dragItemRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging(false);
    dragItemRef.current = null;
  };

  // Sort and filter levels
  const sortedAndFilteredLevels = useMemo(() => {
    let result = [...platformerLevels];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(level =>
        level.name.toLowerCase().includes(query) ||
        (level.creator && level.creator.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'creator') {
        return (a.creator || '').localeCompare(b.creator || '');
      }
      // Default: hkgdRank
      return (b.hkgdRank || 0) - (a.hkgdRank || 0);
    });

    return result;
  }, [platformerLevels, sortBy, searchQuery]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...platformerLevels];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newItems.length) return;

    const [item] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, item);
    setPlatformerLevels(newItems);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update each level with its new HKGD rank
      const updates = platformerLevels.map((level, index) => {
        const newHKGDRank = platformerLevels.length - index; // Higher rank = harder
        return api.updatePlatformerLevel(level.id, {
          ...level,
          hkgdRank: newHKGDRank
        });
      });

      await Promise.all(updates);

      alert('Platformer ranking saved successfully!');
      
      // Close the window after saving
      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (error) {
      console.error('Failed to save platformer ranking:', error);
      alert('Failed to save platformer ranking. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">🎛️ Drag Platformer Levels</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.close()}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <p className="text-sm text-purple-300">
            📝 Click and drag the grip handles (⠿) to reorder levels. 
            Click "Save Ranking" when finished.
          </p>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or creator..."
              className="pl-10 bg-card"
            />
          </div>
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10 px-3 rounded-md border border-input bg-card text-foreground"
            >
              <option value="hkgdRank">HKGD Rank</option>
              <option value="name">Name</option>
              <option value="creator">Creator</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          {sortedAndFilteredLevels.map((level, index) => (
            <div
              key={level.id}
              draggable
              onDragStart={(e) => handleDragStart(e, level, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={css`
                flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50 
                hover:bg-muted/30 transition-all group
                ${dragOverIndex === index ? 'border-purple-500 bg-purple-500/20 scale-[1.02] shadow-lg shadow-purple-500/20' : ''}
                ${draggedItem?.id === level.id ? 'opacity-50 scale-95' : ''}
                ${isDragging && draggedItem?.id !== level.id ? 'cursor-grabbing' : ''}
              `}
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); moveItem(index, 'up'); }}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); moveItem(index, 'down'); }}
                  disabled={index === platformerLevels.length - 1}
                >
                  <ArrowDown className="w-3 h-3" />
                </Button>
              </div>
              <div
                className={css`
                  cursor-grab
                  touch-action: none
                  user-select: none
                  active:cursor-grabbing
                  p-1 rounded hover:bg-purple-500/20 transition-colors
                `}
              >
                <GripVertical className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
                <span className="font-bold text-white text-sm">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{level.name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  by {level.creator} • ID: {level.levelId}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {level.records.length} record{level.records.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => window.close()}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? 'Saving...' : 'Save Ranking'}
          </Button>
        </div>
      </div>
    </div>
  );
}