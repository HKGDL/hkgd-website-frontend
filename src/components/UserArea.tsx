import { useState, useEffect } from 'react';
import { X, User, Trophy, Target, Clock, Flame, Star, TrendingUp, Award, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface UserAreaProps {
  onClose: () => void;
}

interface UserStats {
  totalRecords: number;
  hardestRecord: string;
  hardestRank: number;
  joinDate: string;
  streak: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const demoStats: UserStats = {
  totalRecords: 47,
  hardestRecord: "Slaughterhouse",
  hardestRank: 3,
  joinDate: "2024/08/15",
  streak: 12,
  achievements: [
    { id: "1", name: "First Blood", description: "Submit your first record", icon: "🩸", unlocked: true },
    { id: "2", name: "Top 10", description: "Beat a top 10 demon", icon: "🔥", unlocked: true },
    { id: "3", name: "Consistent", description: "7 day submission streak", icon: "⚡", unlocked: true },
    { id: "4", name: "Legend", description: "Beat an Extreme demon", icon: "💀", unlocked: true },
    { id: "5", name: "Collector", description: "Beat 50 demons on the list", icon: "🏆", unlocked: false },
    { id: "6", name: "Insane", description: "Beat a top 3 demon", icon: "👁️", unlocked: false },
  ]
};

const demoRecentActivity = [
  { level: "Slaughterhouse", rank: 3, date: "26/03/26", type: "record" },
  { level: "Acheron", rank: 14, date: "26/03/20", type: "record" },
  { level: "Tartarus", rank: 17, date: "26/03/15", type: "record" },
  { level: "The Golden", rank: 24, date: "26/03/10", type: "record" },
];

export function UserArea({ onClose }: UserAreaProps) {
  const [stats] = useState<UserStats>(demoStats);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activity'>('overview');

  const unlockedCount = stats.achievements.filter(a => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">User Area</h2>
              <p className="text-sm text-muted-foreground">Your personal stats and progress</p>
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

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['overview', 'achievements', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs">Total Records</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-400">{stats.totalRecords}</p>
                </div>
                
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs">Hardest</span>
                  </div>
                  <p className="text-lg font-bold truncate">#{stats.hardestRank}</p>
                  <p className="text-xs text-muted-foreground truncate">{stats.hardestRecord}</p>
                </div>
                
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-xs">Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-500">{stats.streak} days</p>
                </div>
                
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs">Achievements</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-500">{unlockedCount}/{stats.achievements.length}</p>
                </div>
              </div>

              {/* Quick Info */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="text-sm font-medium">Member since</p>
                      <p className="text-xs text-muted-foreground">{stats.joinDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium">Progress</p>
                      <p className="text-xs text-muted-foreground">+12 records this month</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demo Notice */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  This is a demo preview of the User Area. Stats shown are for demonstration purposes.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border transition-all ${
                    achievement.unlocked
                      ? 'bg-card border-indigo-500/30 hover:border-indigo-500/50'
                      : 'bg-card/50 border-border opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className="font-medium text-sm">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                  {achievement.unlocked && (
                    <div className="flex items-center gap-1 mt-2">
                      <Award className="w-3 h-3 text-indigo-400" />
                      <span className="text-xs text-indigo-400">Unlocked</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {demoRecentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-indigo-500/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.level}</p>
                      <p className="text-xs text-muted-foreground">Rank #{activity.rank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                    <p className="text-xs text-indigo-400 capitalize">{activity.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <Button
            onClick={onClose}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
