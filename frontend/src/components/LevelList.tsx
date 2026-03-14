import { useState, useMemo } from 'react';
import type { Level, WebsiteContent, ChangelogEntry } from '@/types';
import { LevelCard } from './LevelCard';
import { LevelDetail } from './LevelDetail';
import { Changelog } from './Changelog';
import { Search, Filter, List, Grid3X3, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface LevelListProps {
  levels: Level[];
  listPage: WebsiteContent['listPage'];
  changelog: ChangelogEntry[];
}

type ViewMode = 'grid' | 'list';

export function LevelList({ levels, listPage, changelog }: LevelListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  const filteredLevels = useMemo(() => {
    return levels
      .filter((level) => {
        // Only show classic extreme demons (exclude platformer levels)
        if (level.tags.some(tag => tag.toLowerCase() === 'platformer')) {
          return false;
        }
        
        const query = searchQuery.toLowerCase();
        return (
          level.name.toLowerCase().includes(query) ||
          level.creator.toLowerCase().includes(query) ||
          level.verifier.toLowerCase().includes(query) ||
          level.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        // Sort by sequential HKGD rank (based on AREDL ranking)
        const levelsWithAredl = [a, b].filter(l => l.aredlRank !== null);
        const sortedByAredl = levelsWithAredl.sort((x, y) => (x.aredlRank || 9999) - (y.aredlRank || 9999));
        const rankA = sortedByAredl.findIndex(l => l.id === a.id) + 1;
        const rankB = sortedByAredl.findIndex(l => l.id === b.id) + 1;
        return rankA - rankB;
      });
  }, [levels, searchQuery]);

  return (
    <div className="min-h-screen pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-3 sm:mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-xs sm:text-sm text-indigo-300">Ranked by AREDL Difficulty</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {listPage.title}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {listPage.description}
              </p>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={listPage.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64 bg-muted/50 border-border/50"
                />
              </div>

              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => value && setViewMode(value as ViewMode)}
                className="border border-border/50 rounded-lg p-1 bg-muted/50 self-start"
              >
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <Grid3X3 className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="w-4 h-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Level List */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {filteredLevels.length > 0 ? (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:gap-6'
                  : 'space-y-4'
              }>
                {filteredLevels.map((level, index) => (
                  <div
                    key={level.id}
                    className="animate-fadeIn"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <LevelCard
                      level={level}
                      allLevels={levels}
                      onClick={() => setSelectedLevel(level)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 bg-card rounded-xl border border-border/50">
                <Filter className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  No levels found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search query
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Card */}
              <div className="p-4 sm:p-6 rounded-xl bg-card border border-border/50">
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">
                  List Statistics
                </h3>
                <div className="space-y-4">
                  {/* Classic Demons */}
                  <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <div className="text-xs text-indigo-400 uppercase tracking-wider mb-2">Classic Demons</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total Levels</span>
                        <span className="text-sm font-semibold text-foreground">
                          {levels.filter(l => !l.tags.some(tag => tag.toLowerCase() === 'platformer')).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Hardest Level</span>
                        <span className="text-xs font-semibold text-indigo-400 truncate max-w-[100px]">
                          {(() => {
                            const classicLevels = levels.filter(l => !l.tags.some(tag => tag.toLowerCase() === 'platformer'));
                            const levelsWithAredl = classicLevels.filter(l => l.aredlRank !== null);
                            const sortedByAredl = levelsWithAredl.sort((a, b) => (a.aredlRank || 9999) - (b.aredlRank || 9999));
                            return sortedByAredl[0]?.name || 'N/A';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Platformer Demons */}
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="text-xs text-purple-400 uppercase tracking-wider mb-2">Platformer Demons</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total Levels</span>
                        <span className="text-sm font-semibold text-foreground">
                          {levels.filter(l => l.tags.some(tag => tag.toLowerCase() === 'platformer')).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Hardest Level</span>
                        <span className="text-xs font-semibold text-purple-400 truncate max-w-[100px]">
                          {(() => {
                            const platformerLevels = levels.filter(l => l.tags.some(tag => tag.toLowerCase() === 'platformer'));
                            const levelsWithAredl = platformerLevels.filter(l => l.aredlRank !== null);
                            const sortedByAredl = levelsWithAredl.sort((a, b) => (a.aredlRank || 9999) - (b.aredlRank || 9999));
                            return sortedByAredl[0]?.name || 'N/A';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changelog */}
              <div className="p-4 sm:p-6 rounded-xl bg-card border border-border/50">
                <Changelog entries={changelog} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Level Detail Modal */}
      {selectedLevel && (
        <LevelDetail
          level={selectedLevel}
          allLevels={levels}
          onClose={() => setSelectedLevel(null)}
        />
      )}
    </div>
  );
}
