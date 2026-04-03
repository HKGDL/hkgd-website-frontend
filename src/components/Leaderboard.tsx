import { useState, useMemo } from 'react';
import { X, Trophy, Medal, Crown, TrendingUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
    rank: number;
    points: number;
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

  const leaderboardData = useMemo(() => {
    const playerMap = new Map<string, PlayerStats>();

    levels.forEach(level => {
      level.records.forEach(record => {
        const normalizedName = record.player.toLowerCase().trim();
        const existing = playerMap.get(normalizedName);

        const points = calculatePoints(level.hkgdRank);
        const recordInfo = {
          levelName: level.name,
          rank: level.hkgdRank,
          points: points
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

    // Convert to array and sort
    let players = Array.from(playerMap.values());
    
    if (sortBy === 'points') {
      players.sort((a, b) => b.totalPoints - a.totalPoints);
    } else {
      players.sort((a, b) => b.records.length - a.records.length);
    }

    return players;
  }, [levels, sortBy]);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-yellow-500/10 via-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Leaderboard</h2>
              <p className="text-sm text-muted-foreground">Player rankings based on record points</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
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

        {/* Sort Toggle */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-2">
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

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto">
          {leaderboardData.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No records found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaderboardData.map((player, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={player.normalizedName}
                    className={`flex items-center gap-4 px-6 py-4 border-l-2 transition-colors ${getRankBg(rank)}`}
                    style={{ borderLeftColor: rank <= 3 ? undefined : 'transparent' }}
                  >
                    {/* Rank */}
                    <div className="w-12 flex justify-center">
                      {getRankIcon(rank)}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold truncate">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{player.records.length} records</span>
                        <span>Hardest (AREDL): {player.hardestAredlRank !== null ? `#${player.hardestAredlRank}` : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-400">
                        {player.totalPoints.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {leaderboardData.length} players • {levels.reduce((sum, l) => sum + l.records.length, 0)} total records
            </span>
            <Button
              onClick={onClose}
              size="sm"
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export utility function for use in other components
export { calculatePoints };
