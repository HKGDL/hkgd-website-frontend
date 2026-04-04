import { X, Trophy, Crown, ExternalLink, Play, Monitor, Target, Zap, TrendingUp, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useState, useMemo } from 'react';
import type { Level } from '@/types';

interface PlayerRecord {
  levelName: string;
  levelId: string;
  rank: number;
  points: number;
  date: string;
  videoUrl?: string;
  fps?: string;
  cbf?: boolean;
  attempts?: number;
  aredlRank: number | null;
  creator: string;
}

interface PlayerDetailProps {
  playerName: string;
  records: PlayerRecord[];
  totalPoints: number;
  hardestAredlRank: number | null;
  levels: Level[];
  onClose: () => void;
}

/**
 * Calculate points based on rank
 */
function calculatePoints(rank: number): number {
  if (rank <= 100) {
    return (101 - rank) * 1.5;
  }
  const basePoints = 101 - rank;
  return Math.max(0.5, basePoints * 0.5);
}

export function PlayerDetail({ 
  playerName, 
  records, 
  totalPoints, 
  hardestAredlRank, 
  levels,
  onClose 
}: PlayerDetailProps) {
  const [sortBy, setSortBy] = useState<'rank' | 'points' | 'date'>('rank');
  const [sortAsc, setSortAsc] = useState(false);

  // Enrich records with full level data
  const enrichedRecords = useMemo(() => {
    return records.map(record => {
      // Match by levelId (GD level ID like '107238250') or by name
      const level = levels.find(l => l.levelId === record.levelId || l.name === record.levelName);
      return {
        ...record,
        thumbnail: level?.thumbnail,
        creator: level?.creator || record.creator || 'Unknown',
        aredlRank: level?.aredlRank || record.aredlRank || null,
        levelId: level?.levelId || record.levelId || '',
      };
    });
  }, [records, levels]);

  // Sort records
  const sortedRecords = useMemo(() => {
    const sorted = [...enrichedRecords];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'points':
          comparison = b.points - a.points;
          break;
        case 'date':
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
      }
      return sortAsc ? -comparison : comparison;
    });
    
    return sorted;
  }, [enrichedRecords, sortBy, sortAsc]);

  const toggleSort = (column: 'rank' | 'points' | 'date') => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(false);
    }
  };

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
          {/* Header */}
          <div className="relative bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950 p-6 sm:p-8">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{playerName}</h1>
                  <p className="text-sm text-indigo-300">Player Statistics</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-indigo-300 uppercase tracking-wider">Points</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white">{totalPoints.toFixed(1)}</p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-300 uppercase tracking-wider">Records</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white">{records.length}</p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-300 uppercase tracking-wider">Hardest</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {hardestAredlRank ? `#${hardestAredlRank}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Beaten Demons
              </h2>
              
              <div className="flex items-center gap-1">
                <Button
                  variant={sortBy === 'rank' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => toggleSort('rank')}
                  className={sortBy === 'rank' ? 'bg-indigo-500 hover:bg-indigo-600' : ''}
                >
                  Rank {sortBy === 'rank' && (sortAsc ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />)}
                </Button>
                <Button
                  variant={sortBy === 'points' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => toggleSort('points')}
                  className={sortBy === 'points' ? 'bg-indigo-500 hover:bg-indigo-600' : ''}
                >
                  Points {sortBy === 'points' && (sortAsc ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />)}
                </Button>
                <Button
                  variant={sortBy === 'date' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => toggleSort('date')}
                  className={sortBy === 'date' ? 'bg-indigo-500 hover:bg-indigo-600' : ''}
                >
                  Date {sortBy === 'date' && (sortAsc ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />)}
                </Button>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Records List */}
            {sortedRecords.length > 0 ? (
              <div className="space-y-2">
                {sortedRecords.map((record, index) => (
                  <div
                    key={`${record.levelName}-${index}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      {/* Rank Badge */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        record.rank <= 10 
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30' 
                          : record.rank <= 50 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20'
                            : 'bg-muted'
                      }`}>
                        <span className={`text-sm font-bold ${record.rank <= 50 ? 'text-white' : 'text-muted-foreground'}`}>
                          #{record.rank}
                        </span>
                      </div>

                      {/* Level Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{record.levelName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>by {record.creator}</span>
                          {record.aredlRank && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-400">AREDL #{record.aredlRank}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{record.date}</p>
                      </div>
                    </div>

                    {/* Record Stats & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end pl-14 sm:pl-0">
                      {/* Points */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-sm font-medium text-indigo-300">{record.points.toFixed(1)} pts</span>
                      </div>

                      {/* FPS */}
                      {record.fps && record.fps !== '0' && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50">
                          <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-xs text-foreground">{record.fps}fps</span>
                        </div>
                      )}

                      {/* CBF */}
                      {record.cbf && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300" title="Click Between Frames">
                          <span className="text-xs font-semibold">CBF</span>
                        </div>
                      )}

                      {/* Attempts */}
                      {record.attempts && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50">
                          <Target className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs text-foreground">{record.attempts.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Video */}
                      {record.videoUrl ? (
                        <a
                          href={record.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                            record.videoUrl.toLowerCase().includes('discord')
                              ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">
                            {record.videoUrl.toLowerCase().includes('discord') ? 'View' : 'Watch'}
                          </span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 text-muted-foreground">
                          <Zap className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">No Video</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/20 rounded-xl border border-border/30 border-dashed">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No records found</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pb-4">
              <Button
                variant="outline"
                className="w-full border-border/50"
                onClick={() => window.open(`https://gdbrowser.com/u/${encodeURIComponent(playerName)}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on GDBrowser
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
