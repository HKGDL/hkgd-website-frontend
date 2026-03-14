import type { Level } from '@/types';
import {
  X,
  ExternalLink,
  Trophy,
  Music,
  Hash,
  Calendar,
  User,
  Crown,
  Play,
  Monitor,
  Target,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface LevelDetailProps {
  level: Level;
  allLevels: Level[]; // Add allLevels prop to calculate sequential rank
  onClose: () => void;
}

export function LevelDetail({ level, allLevels, onClose }: LevelDetailProps) {
  // Calculate sequential HKGD rank based on AREDL ranking
  const calculateHkgdRank = (currentLevel: Level): number => {
    const levelsWithAredl = allLevels.filter(l => l.aredlRank !== null);
    const sortedByAredl = levelsWithAredl.sort((a, b) => (a.aredlRank || 9999) - (b.aredlRank || 9999));
    return sortedByAredl.findIndex(l => l.id === currentLevel.id) + 1;
  };

  const hkgdRank = level.aredlRank ? calculateHkgdRank(level) : level.hkgdRank;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-card rounded-t-3xl sm:rounded-2xl border border-border/50 shadow-2xl overflow-hidden animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-3 sm:p-2 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 active:scale-95 transition-all"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <ScrollArea className="h-[95vh] sm:h-[90vh]">
          {/* Header Image */}
          <div className="relative aspect-video">
            {level.thumbnail ? (
              <img
                src={level.thumbnail}
                alt={level.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-purple-950 flex items-center justify-center">
                <Trophy className="w-24 h-24 text-indigo-500/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            
            {/* Rank Badges */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-2xl font-bold text-white">#{hkgdRank}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10">
                <span className="text-sm text-muted-foreground">
                  {level.tags.some(tag => tag.toLowerCase() === 'platformer')
                    ? 'Pemonlist Rank'
                    : 'AREDL Rank'}
                </span>
                <p className="text-xl font-bold text-white">
                  {level.tags.some(tag => tag.toLowerCase() === 'platformer')
                    ? (level.pemonlistRank
                        ? `#${level.pemonlistRank}`
                        : 'N/A')
                    : (level.aredlRank
                        ? `#${level.aredlRank}`
                        : 'N/A')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-8">
            {/* Title */}
            <h1 className="text-xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              {level.name}
            </h1>

            {/* Description - only for Classic levels */}
            {level.description && !level.tags.some(tag => tag.toLowerCase() === 'platformer') && (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-6">
                {level.description}
              </p>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
              <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Creator</span>
                </div>
                <p className="font-semibold text-foreground truncate">{level.creator}</p>
              </div>

              {level.verifier && level.verifier !== 'Unknown' && !level.tags.some(tag => tag.toLowerCase() === 'platformer') && level.aredlRank && level.aredlRank <= 150 && (
                            <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 border border-border/50">
                              <div className="flex items-center gap-2 mb-2">
                                <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Verifier</span>
                              </div>
                              <p className="font-semibold text-foreground truncate">{level.verifier}</p>
                            </div>
                          )}
              <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Level ID</span>
                </div>
                <p className="font-semibold text-foreground truncate">{level.levelId}</p>
              </div>

              <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Added</span>
                </div>
                <p className="font-semibold text-foreground truncate">{level.dateAdded}</p>
              </div>
            </div>

            {/* Tiers */}
            {(level.gddlTier || level.nlwTier) && (
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                {level.gddlTier && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <span className="text-[10px] sm:text-xs text-indigo-400 uppercase tracking-wider">GDDL Tier</span>
                    <p className="text-base sm:text-lg font-bold text-indigo-100">{Math.round(level.gddlTier)}</p>
                  </div>
                )}
                {level.nlwTier && level.nlwTier !== '-' && (
                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] sm:text-xs text-amber-400 uppercase tracking-wider">NLW Tier</span>
                    <p className="text-base sm:text-lg font-bold text-amber-100">{level.nlwTier}</p>
                  </div>
                )}
              </div>
            )}

            {/* Song Info */}
            {level.songId && (
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/30 border border-border/50 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Song</span>
                    <p className="font-medium text-foreground truncate">
                      {level.songName || 'Unknown'}
                      <span className="text-muted-foreground ml-2">({level.songId})</span>
                    </p>
                  </div>
                  <a
                    href={`https://www.newgrounds.com/audio/listen/${level.songId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {level.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-muted hover:bg-muted/80"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="my-4 sm:my-6" />

            {/* Records */}
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  Records ({level.records.length})
                </h3>
              </div>

              {level.records.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {level.records.map((record, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-semibold text-indigo-400">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground truncate">{record.player}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{record.date}</p>
                        </div>
                      </div>

                      {/* Record Stats */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        {record.fps && record.fps !== '0' && (
                          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-muted/50">
                            <Monitor className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
                            <span className="text-xs sm:text-sm text-foreground">{record.fps}fps</span>
                          </div>
                        )}
                        {record.cbf && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300" title="Click Between Frames">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.55.45-1 1-1s1 .45 1 1c0 .95 2.61 3.44 6.5 3.93v-2.02c-2.29-.37-4.22-2.12-4.83-4.23h2.83c.36 1.19 1.45 2.07 2.73 2.07 1.57 0 2.85-1.28 2.85-2.85s-1.28-2.85-2.85-2.85c-1.28 0-2.37.88-2.73 2.07H6.67c.61-2.11 2.54-3.86 4.83-4.23V8.07C6.05 8.56 2 11.51 2 15.93c0 4.08 3.05 7.44 7 7.93V19.93zm4-7.43c1.08 0 1.85.77 1.85 1.85s-.77 1.85-1.85 1.85-1.85-.77-1.85-1.85.77-1.85 1.85-1.85z"/>
                              <path d="M14.5 9c.83 0 1.5-.67 1.5-1.5S15.33 6 14.5 6 13 6.67 13 7.5 13.67 9 14.5 9z"/>
                            </svg>
                            <span className="text-[10px] sm:text-xs font-semibold">CBF</span>
                          </div>
                        )}
                        {record.attempts && (
                          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-muted/50">
                            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                            <span className="text-xs sm:text-sm text-foreground">{record.attempts.toLocaleString()} atts</span>
                          </div>
                        )}
                        {record.videoUrl ? (
                          <a
                            href={record.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-opacity-20 transition-colors ${
                              record.videoUrl.toLowerCase().includes('discord')
                                ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}
                          >
                            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium">
                              {record.videoUrl.toLowerCase().includes('discord') ? 'View' : 'Watch'}
                            </span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-muted/30 text-muted-foreground">
                            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium">No Video</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 bg-muted/20 rounded-lg sm:rounded-xl border border-border/30 border-dashed">
                  <p className="text-xs sm:text-sm text-muted-foreground">No records yet. Be the first to beat this level!</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8 pb-20 sm:pb-0">
              <Button
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 sm:py-2"
                onClick={() => window.open(`https://gdbrowser.com/${level.levelId}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on GDBrowser
              </Button>
              <Button
                variant="outline"
                className="w-full border-border/50 py-3 sm:py-2"
                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(level.name + ' geometry dash')}`, '_blank')}
              >
                <Play className="w-4 h-4 mr-2" />
                Find Videos
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
