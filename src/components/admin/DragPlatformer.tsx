import { useState, useEffect } from 'react';
import { X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { css } from '@emotion/css';
import { api } from '@/lib/api';
import type { Level } from '@/types';

export function DragPlatformer() {
  const [platformerLevels, setPlatformerLevels] = useState<Level[]>([]);
  const [draggedItem, setDraggedItem] = useState<Level | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, level: Level) => {
    setDraggedItem(level);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', level.id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const newItems = [...platformerLevels];
    const draggedIndex = newItems.findIndex(item => item.id === draggedItem.id);

    // Remove and reinsert at new position
    const [removedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, removedItem);

    setPlatformerLevels(newItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
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

        <div className="space-y-3 mb-8">
          {platformerLevels.map((level, index) => (
            <div
              key={level.id}
              draggable
              onDragStart={(e) => handleDragStart(e, level)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={css`
                flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50 
                hover:bg-muted/30 transition-colors group
                ${dragOverIndex === index ? 'border-purple-500 bg-purple-500/10' : ''}
                ${draggedItem?.id === level.id ? 'opacity-80' : ''}
              `}
            >
              <div
                className={css`
                  cursor-grab
                  touch-action: none
                  user-select: none
                  active:cursor-grabbing
                `}
              >
                <GripVertical className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
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