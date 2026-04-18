import type { Level } from '@/types';
import { ExternalLink, Trophy, Smile, Layers } from 'lucide-react';

interface LevelCardProps {
  level: Level;
  allLevels: Level[]; // Add allLevels prop to calculate sequential rank
  viewMode?: 'grid' | 'list';
  onClick: () => void;
}

export function LevelCard({ level, allLevels, viewMode = 'grid', onClick }: LevelCardProps) {
  // Calculate sequential HKGD rank based on AREDL ranking
  const calculateHkgdRank = (currentLevel: Level): number => {
    const levelsWithAredl = allLevels.filter(l => l.aredlRank !== null);
    const sortedByAredl = levelsWithAredl.sort((a, b) => (a.aredlRank || 9999) - (b.aredlRank || 9999));
    return sortedByAredl.findIndex(l => l.id === currentLevel.id) + 1;
  };

  const hkgdRank = level.aredlRank ? calculateHkgdRank(level) : level.hkgdRank;

  // Get enjoyment color based on rating
  const getEnjoymentColor = (rating: number | null | undefined) => {
    if (!rating || rating === 0) return 'text-muted-foreground';
    if (rating >= 70) return 'text-emerald-400';
    if (rating >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const isPlatformer = level.tags.some(tag => tag.toLowerCase() === 'platformer');

  // List View - Horizontal compact layout
  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="group relative bg-card rounded-xl overflow-hidden border border-border/50 cursor-pointer card-hover active:scale-[0.98] transition-transform flex flex-row"
      >
        {/* Thumbnail - Left side */}
        <div className="relative w-32 sm:w-48 shrink-0 overflow-hidden">
          {level.thumbnail ? (
            <img
              src={level.thumbnail}
              alt={level.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center min-h-[120px]">
              <Trophy className="w-8 h-8 text-indigo-500/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
          {/* Rank Badge */}
          <div className="absolute top-2 left-2 z-10">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-sm sm:text-base font-bold text-white">#{hkgdRank}</span>
            </div>
          </div>
        </div>

        {/* Content - Right side */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-foreground group-hover:text-indigo-400 transition-colors line-clamp-1">
              {level.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span className="shrink-0">Creator:</span>
              <p className="font-medium text-foreground truncate">{level.creator}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {level.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[10px] sm:text-xs rounded bg-muted text-muted-foreground border border-border/50"
                >
                  {tag}
                </span>
              ))}
              {level.tags.length > 2 && (
                <span className="px-1.5 py-0.5 text-[10px] sm:text-xs rounded bg-muted text-muted-foreground border border-border/50">
                  +{level.tags.length - 2}
                </span>
              )}
            </div>

            {/* Record count */}
            {level.records.length > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                <Trophy className={`w-3 h-3 ${isPlatformer ? 'text-purple-400' : 'text-indigo-400'}`} />
                <span className="text-xs font-medium text-foreground">{level.records.length}</span>
              </div>
            )}
          </div>

          {/* Extra info badges */}
          <div className="hidden sm:flex items-center gap-2 mt-2">
            <div className="px-2 py-0.5 rounded bg-muted/50 text-xs text-muted-foreground">
              {isPlatformer
                ? 'HKGD'
                : (level.aredlRank ? `AREDL #${level.aredlRank}` : 'HKGD')}
            </div>
            {level.edelEnjoyment !== null && level.edelEnjoyment !== undefined && level.edelEnjoyment > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/50">
                <Smile className={`w-3 h-3 ${getEnjoymentColor(level.edelEnjoyment)}`} />
                <span className={`text-xs font-medium ${getEnjoymentColor(level.edelEnjoyment)}`}>
                  {level.edelEnjoyment.toFixed(1)}
                </span>
              </div>
            )}
            {level.nlwTier && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/50">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-400">NLW {level.nlwTier}</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span>ID: {level.levelId}</span>
              <ExternalLink className="w-3 h-3 group-hover:text-indigo-400 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View - Original vertical layout
  return (
    <div
      onClick={onClick}
      className="group relative bg-card rounded-xl overflow-hidden border border-border/50 cursor-pointer card-hover active:scale-[0.98] transition-transform"
    >
      {/* Rank Badge - Mobile optimized */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-base sm:text-xl font-bold text-white">#{hkgdRank}</span>
          </div>
          <div className="hidden sm:block px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
            <span className="text-xs text-muted-foreground">
              {isPlatformer
                ? 'HKGD'
                : (level.aredlRank
                    ? `AREDL #${level.aredlRank}`
                    : 'HKGD')}
            </span>
          </div>
          {/* EDEL Enjoyment Rating */}
          {level.edelEnjoyment !== null && level.edelEnjoyment !== undefined && level.edelEnjoyment > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
              <Smile className={`w-3 h-3 ${getEnjoymentColor(level.edelEnjoyment)}`} />
              <span className={`text-xs font-medium ${getEnjoymentColor(level.edelEnjoyment)}`}>
                {level.edelEnjoyment.toFixed(1)}
              </span>
            </div>
          )}
          {/* NLW Tier */}
          {level.nlwTier && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">
                NLW {level.nlwTier}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {level.thumbnail ? (
          <img
            src={level.thumbnail}
            alt={level.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-500/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5">
        <h3 className="text-base sm:text-xl font-bold text-foreground mb-1 sm:mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1 sm:line-clamp-2">
          {level.name}
        </h3>

        {/* Description - only for Classic levels - Hidden on mobile */}
        {level.description && !isPlatformer && (
          <p className="hidden sm:block text-sm text-muted-foreground line-clamp-2 mb-4">
            {level.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 sm:mb-4">
          <span className="shrink-0">Creator:</span>
          <p className="font-medium text-foreground truncate">{level.creator}</p>
        </div>

        {/* Tags - Reduced on mobile */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {level.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-xs rounded-md bg-muted text-muted-foreground border border-border/50"
            >
              {tag}
            </span>
          ))}
          {level.tags.length > 2 && (
            <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-xs rounded-md bg-muted text-muted-foreground border border-border/50">
              +{level.tags.length - 2}
            </span>
          )}
        </div>

        {/* Record Count */}
        {level.records.length > 0 && (
          <div className={`mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg ${isPlatformer ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-indigo-500/10 border border-indigo-500/20'}`}>
            <div className="flex items-center gap-2">
              <Trophy className={`w-3 h-3 sm:w-4 sm:h-4 ${isPlatformer ? 'text-purple-400' : 'text-indigo-400'}`} />
              <div>
                <span className={`text-[10px] uppercase tracking-wider ${isPlatformer ? 'text-purple-400' : 'text-indigo-400'}`}>
                  {level.records.length} {level.records.length === 1 ? 'Record' : 'Records'}
                </span>
                <p className="font-semibold text-foreground text-xs sm:text-sm">
                  {level.records.map(r => r.player).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Level ID - Hidden on mobile */}
        <div className="hidden sm:flex mt-4 pt-4 border-t border-border/50 items-center justify-between">
          <span className="text-xs text-muted-foreground">ID: {level.levelId}</span>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}