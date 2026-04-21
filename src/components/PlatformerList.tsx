import { useState, useMemo } from 'react';
import type { Level, WebsiteContent } from '@/types';
import { Search, List, Grid3X3, Gamepad2, Trophy, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { LevelDetail } from './LevelDetail';
import { DragPlatformerModal } from './admin/DragPlatformer';

interface PlatformerListProps {
  platformerPage: WebsiteContent['platformerPage'];
  levels: Level[];
  onReloadData?: () => Promise<void>;
}

export function PlatformerList({ platformerPage, levels }: PlatformerListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isDragModalOpen, setIsDragModalOpen] = useState(false);

  const platformerLevels = useMemo(() => {
    // Sort: rank 1 (easiest) first, highest rank (hardest) last
    return levels
      .sort((a, b) => a.hkgdRank - b.hkgdRank)
      .map((level, index) => ({
        ...level,
        // Add platformer-specific rank (1 = easiest, higher = harder)
        platformerRank: index + 1
      }));
  }, [levels]);

  // Filter based on search query
  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) {
      return platformerLevels;
    }
    
    const query = searchQuery.toLowerCase();
    return platformerLevels.filter(level =>
      level.name.toLowerCase().includes(query) ||
      level.creator.toLowerCase().includes(query) ||
      level.records.some(r => r.player.toLowerCase().includes(query))
    );
  }, [searchQuery, platformerLevels]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">Platformer Demons</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                {platformerPage.title}
              </h1>
              <p className="text-muted-foreground">
                {platformerPage.description}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Reference: <a href="https://aredl.net/list/118798387?list=platformer" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">AREDL Platformer List</a>
              </p>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search levels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64 bg-muted/50 border-border/50"
                />
              </div>
              
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}
                className="border border-border/50 rounded-lg p-1 bg-muted/50"
              >
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <Grid3X3 className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="w-4 h-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDragModalOpen(true)}
                className="gap-2 border-purple-500/30 hover:border-purple-500/60"
              >
                <GripVertical className="w-4 h-4" />
                <span className="hidden sm:inline">Reorder</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredLevels.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-3'
          }>
            {filteredLevels.map((level, index) => (
              viewMode === 'grid' ? (
                // Grid View - Vertical card
                <div
                  key={level.id}
                  onClick={() => setSelectedLevel(level)}
                  className="group relative bg-card rounded-xl overflow-hidden border border-border/50 cursor-pointer card-hover animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Rank Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <span className="text-xl font-bold text-white">#{index + 1}</span>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    {level.thumbnail ? (
                      <img
                        src={level.thumbnail}
                        alt={level.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-950 to-pink-950 flex items-center justify-center">
                        <Gamepad2 className="w-12 h-12 text-purple-500/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-purple-400 transition-colors">
                      {level.name}
                    </h3>

                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      <div>
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider">Creator</span>
                        <p className="font-medium text-foreground text-xs sm:text-sm">{level.creator}</p>
                      </div>
                    </div>

                    {/* Records */}
                    {level.records.length > 0 && (
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-purple-400" />
                            <div>
                              <span className="text-[10px] text-purple-400 uppercase tracking-wider">
                                {level.records.length} {level.records.length === 1 ? 'Record' : 'Records'}
                              </span>
                              <p className="font-semibold text-foreground text-sm">
                                {level.records.map(r => r.player).join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Level ID */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-muted-foreground">ID: {level.levelId}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {level.records.length} {level.records.length === 1 ? 'time' : 'times'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // List View - Horizontal card
                <div
                  key={level.id}
                  onClick={() => setSelectedLevel(level)}
                  className="group relative bg-card rounded-xl overflow-hidden border border-border/50 cursor-pointer card-hover animate-fadeIn flex flex-row"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Thumbnail - Left side */}
                  <div className="relative w-32 sm:w-48 shrink-0 overflow-hidden">
                    {level.thumbnail ? (
                      <img
                        src={level.thumbnail}
                        alt={level.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-950 to-pink-950 flex items-center justify-center min-h-[120px]">
                        <Gamepad2 className="w-8 h-8 text-purple-500/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
                    {/* Rank Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <span className="text-sm sm:text-base font-bold text-white">#{index + 1}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content - Right side */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-sm sm:text-lg font-bold text-foreground group-hover:text-purple-400 transition-colors line-clamp-1">
                        {level.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="shrink-0">Creator:</span>
                        <p className="font-medium text-foreground truncate">{level.creator}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {/* Record count */}
                      {level.records.length > 0 && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Trophy className="w-3 h-3 text-purple-400" />
                          <span className="text-xs font-medium text-foreground">{level.records.length}</span>
                        </div>
                      )}
                    </div>

                    {/* Extra info on larger screens */}
                    <div className="hidden sm:flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>ID: {level.levelId}</span>
                      <span className="ml-auto">{level.records.map(r => r.player).join(', ')}</span>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Gamepad2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Platformer Demons Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery ? 'No demons match your search query.' : platformerPage.emptyMessage}
            </p>
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50 inline-block">
              <p className="text-sm text-muted-foreground">
                Check the admin panel to add platformer demon levels.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Level Detail Modal */}
      {selectedLevel && (
        <LevelDetail
          level={selectedLevel}
          allLevels={levels}
          onClose={() => setSelectedLevel(null)}
        />
      )}

      {/* Drag and Drop Reorder Modal */}
      <DragPlatformerModal
        open={isDragModalOpen}
        onOpenChange={setIsDragModalOpen}
        onSave={onReloadData}
      />
    </div>
  );
}