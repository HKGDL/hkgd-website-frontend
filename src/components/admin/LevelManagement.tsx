import { useState } from 'react';
import { Search, Plus, Edit3, Trash2, Crown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Level } from '@/types';

interface LevelManagementProps {
  levels: Level[];
  onAddLevel: () => void;
  onEditLevel: (level: Level) => void;
  onDeleteLevel: (levelId: string) => void;
  onDeletePlatformerLevel?: (levelId: string) => void;
  listType?: 'classic' | 'platformer';
  onAddPlatformerLevel?: (level: any) => void;
  platformerSearchQuery?: string;
  onPlatformerSearchChange?: (query: string) => void;
  platformerSearchResults?: any[];
  isSearchingPlatformer?: boolean;
  onOpenDragModal?: () => void;
}

export function LevelManagement({
  levels,
  onAddLevel,
  onEditLevel,
  onDeleteLevel,
  onDeletePlatformerLevel,
  listType = 'classic',
  onAddPlatformerLevel,
  platformerSearchQuery = '',
  onPlatformerSearchChange,
  platformerSearchResults = [],
  isSearchingPlatformer = false,
  onOpenDragModal = () => {},
}: LevelManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLevels = levels.filter(level =>
    level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    level.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
    level.levelId.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {listType === 'classic' ? 'Classic Levels' : 'Platformer Levels'}
        </h3>
        <div className="flex items-center gap-2">
          <Button onClick={onAddLevel} size="sm" className={listType === 'classic' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-emerald-500 hover:bg-emerald-600'}>
            <Plus className="w-4 h-4 mr-2" />
            Add Level
          </Button>
          {listType === 'platformer' && (
            <Button
              onClick={() => onOpenDragModal()}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <GripVertical className="w-4 h-4 mr-2" />
              Open Drag Modal
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search levels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Platformer Level Search - Only show for platformer tab */}
      {listType === 'platformer' && onAddPlatformerLevel && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            Add Platformer Level from Pemonlist
          </h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search platformer levels by name or ID..."
              value={platformerSearchQuery}
              onChange={(e) => onPlatformerSearchChange?.(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Platformer Search Results */}
          {platformerSearchQuery && (
            <div className="mt-3 space-y-2">
              <div className="max-h-64 overflow-y-auto border border-border/50 rounded-lg">
                {platformerSearchResults.map((level) => (
                  <button
                    key={level.level_id}
                    onClick={() => onAddPlatformerLevel(level)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted transition-colors border-b border-border/30 last:border-b-0"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{level.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">ID: {level.level_id}</Badge>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                          Pemonlist #{level.position}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                      Add
                    </Button>
                  </button>
                ))}
                {platformerSearchResults.length === 0 && !isSearchingPlatformer && (
                  <div className="p-4 text-center text-muted-foreground">
                    No platformer levels found. Try searching by level ID.
                  </div>
                )}
                {isSearchingPlatformer && (
                  <div className="p-4 text-center text-muted-foreground">
                    Searching...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <ScrollArea className="max-h-[500px] rounded-xl border border-border/50 bg-muted/30">
        <div className="p-4 space-y-3">
          {filteredLevels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No levels found
            </div>
          ) : (
            filteredLevels.map((level) => (
              <div
                key={level.id}
                className="p-4 rounded-lg bg-card border border-border/50 hover:border-border/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {level.hkgdRank && (
                        <Badge variant="default" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                          #{level.hkgdRank}
                        </Badge>
                      )}
                      {level.aredlRank && (
                        <Badge variant="secondary">
                          AREDL #{level.aredlRank}
                        </Badge>
                      )}
                      {level.tags.includes('Platformer') && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          Platformer #{level.hkgdRank}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-foreground text-lg mb-1 truncate">
                      {level.name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>by {level.creator}</span>
                      {level.verifier && (
                        <>• <span>Verified by {level.verifier}</span></>
                      )}
                    </div>
                    {level.records.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {level.records.length} record{level.records.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditLevel(level)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => listType === 'platformer' && onDeletePlatformerLevel ? onDeletePlatformerLevel(level.id) : onDeleteLevel(level.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="text-sm text-muted-foreground">
        Showing {filteredLevels.length} of {levels.length} levels
      </div>
    </div>
  );
}