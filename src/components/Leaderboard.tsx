import { useState, useMemo } from 'react';
import { X, Trophy, Medal, Crown, TrendingUp, User, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { PlayerDetail } from '@/components/PlayerDetail';
import type { Level } from '@/types';

interface LeaderboardProps {
  levels: Level[];
  onClose: () => void;
}

interface PlayerStats {
  name: string;
  normalizedName: string;
  totalPoints: number;
  records: Array<{
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
  }>;
  hardestAredlRank: number | null;
}

/**
 * Calculate points based on rank
 * Top 100: (101 - rank) * 1.5
 * Rank 101+: max(0.5, 101 - rank) (no multiplier for lower ranks)
 */
function calculatePoints(rank: number): number {
  if (rank <= 100) {
    return (101 - rank) * 1.5;
  }
  // For ranks beyond 100, give 0.5 points minimum, decreasing by 0.5 per rank
  const basePoints = 101 - rank;
  return Math.max(0.5, basePoints * 0.5);
}

export function Leaderboard({ levels, onClose }: LeaderboardProps) {
  const [sortBy, setSortBy] = useState<'points' | 'records'>('points');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);

  const leaderboardData = useMemo(() => {
    const playerMap = new Map<string, PlayerStats>();

    levels.forEach(level => {
      level.records.forEach(record => {
        const normalizedName = record.player.toLowerCase().trim();
        const existing = playerMap.get(normalizedName);

        const points = calculatePoints(level.hkgdRank);
        const recordInfo = {
          levelName: level.name,
          levelId: level.levelId,
          rank: level.hkgdRank,
          points: points,
          date: record.date,
          videoUrl: record.videoUrl,
          fps: record.fps,
          cbf: record.cbf,
          attempts: record.attempts,
          aredlRank: level.aredlRank,
          creator: level.creator
        };

        // Track hardest AREDL rank (lower is harder)
        const aredlRank = level.aredlRank;

        if (existing) {
          existing.totalPoints += points;
          existing.records.push(recordInfo);
          if (aredlRank !== null && (existing.hardestAredlRank === null || aredlRank < existing.hardestAredlRank)) {
            existing.hardestAredlRank = aredlRank;
          }
        } else {
          playerMap.set(normalizedName, {
            name: record.player, // Keep original casing for display
            normalizedName,
            totalPoints: points,
            records: [recordInfo],
            hardestAredlRank: aredlRank
          });
        }
      });
    });

    // Convert to array, filter by search, and sort
    let players = Array.from(playerMap.values());
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      players = players.filter(player => 
        player.name.toLowerCase().includes(query)
      );
    }

    if (sortBy === 'points') {
      players.sort((a, b) => b.totalPoints - a.totalPoints);
    } else {
      players.sort((a, b) => b.records.length - a.records.length);
    }

    return players;
  }, [levels, sortBy, searchQuery]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 via-gray-400/10 to-transparent border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 via-amber-600/10 to-transparent border-amber-600/30';
      default:
        return 'bg-card hover:bg-muted/50';
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-3 sm:mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-xs sm:text-sm text-indigo-300">Player Rankings</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Leaderboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Player rankings based on record points and completions
              </p>
            </div>
            
            {/* Back Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-fit gap-2"
            >
              <X className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
        </div>

        {/* Point System Info */}
        <div className="px-6 py-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span><strong className="text-indigo-400">Top 100:</strong> Points = (101 - rank) × 1.5</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span><strong>Rank 1:</strong> 150 pts</span>
            <span><strong>Rank 100:</strong> 1.5 pts</span>
            <span><strong>Rank 101+:</strong> 0.5 pts min</span>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full bg-muted/50 border-border/50"
              />
            </div>
            
            {/* Sort Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Button
                variant={sortBy === 'points' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('points')}
                className={sortBy === 'points' ? 'bg-indigo-500 hover:bg-indigo-600' : ''}
              >
                Total Points
              </Button>
              <Button
                variant={sortBy === 'records' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('records')}
                className={sortBy === 'records' ? 'bg-indigo-500 hover:bg-indigo-600' : ''}
              >
                Record Count
              </Button>
            </div>
          </div>
        </div>

        {/* Leaderboard List - Demonlist Style */}
        <div className="flex-1 overflow-y-auto">
          {leaderboardData.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No records found</p>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {leaderboardData.map((player, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={player.normalizedName}
                    onClick={() => setSelectedPlayer(player)}
                    className={`relative bg-card rounded-xl overflow-hidden border border-border/50 cursor-pointer card-hover active:scale-[0.98] transition-transform animate-fadeIn hover:bg-muted/50`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Rank Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        {getRankIcon(rank)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 pl-16">
                      <div className="flex items-start gap-3">
                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-base font-bold text-foreground truncate">
                              {player.name}
                            </h3>
                          </div>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span>{player.records.length} {player.records.length === 1 ? 'record' : 'records'}</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>Hardest (AREDL): {player.hardestAredlRank !== null ? `#${player.hardestAredlRank}` : 'N/A'}</span>
                          </div>
                          
                          {/* Records Preview */}
                          {player.records.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-2">
                              <span className="font-medium text-foreground">Top Records In HKGDL:</span>
                              <span className="ml-1">
                                {player.records.slice(0, 3).map((record, idx) => (
                                  <span key={idx}>
                                    {idx > 0 && ', '}
                                    <span className="text-indigo-400">#{record.rank}</span> {record.levelName}
                                  </span>
                                ))}
                                {player.records.length > 3 && <span className="text-indigo-400">, +{player.records.length - 3} more</span>}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Points */}
                        <div className="text-right ml-auto">
                          <div className="text-2xl font-bold text-indigo-400">
                            {player.totalPoints.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            <span>
              {leaderboardData.length} players • {levels.reduce((sum, l) => sum + l.records.length, 0)} total records
            </span>
          </div>
        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetail
          playerName={selectedPlayer.name}
          records={selectedPlayer.records}
          totalPoints={selectedPlayer.totalPoints}
          hardestAredlRank={selectedPlayer.hardestAredlRank}
          levels={levels}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

// Export utility function for use in other components
export { calculatePoints };
