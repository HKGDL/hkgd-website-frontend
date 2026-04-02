import type { ChangelogEntry } from '@/types';
import { 
  History, 
  Plus, 
  Minus,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChangelogProps {
  entries: ChangelogEntry[];
}

export function Changelog({ entries }: ChangelogProps) {
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => {
    // Parse date format: YY/MM/DD
    const parseDate = (dateStr: string) => {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        return new Date(2000 + year, month - 1, day).getTime();
      }
      // Fallback for other date formats
      return new Date(dateStr).getTime();
    };
    return parseDate(b.date) - parseDate(a.date);
  });

  const getChangeIcon = (change: ChangelogEntry['change']) => {
    switch (change) {
      case 'added':
        return <Plus className="w-4 h-4 text-emerald-400" />;
      case 'removed':
        return <Minus className="w-4 h-4 text-red-400" />;
      case 'moved_up':
        return <TrendingUp className="w-4 h-4 text-indigo-400" />;
      case 'moved_down':
        return <TrendingDown className="w-4 h-4 text-amber-400" />;
      default:
        return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getChangeText = (entry: ChangelogEntry) => {
    switch (entry.change) {
      case 'added':
        return (
          <>
            <span className="font-semibold text-foreground">{entry.levelName}</span>
            <span className="text-muted-foreground"> was added at rank </span>
            <span className="font-semibold text-indigo-400">#{entry.newRank}</span>
          </>
        );
      case 'removed':
        return (
          <>
            <span className="font-semibold text-foreground">{entry.levelName}</span>
            <span className="text-muted-foreground"> was removed from the list</span>
          </>
        );
      case 'moved_up':
        return (
          <>
            <span className="font-semibold text-foreground">{entry.levelName}</span>
            <span className="text-muted-foreground"> was raised from </span>
            <span className="font-semibold text-amber-400">#{entry.oldRank}</span>
            <span className="text-muted-foreground"> to </span>
            <span className="font-semibold text-emerald-400">#{entry.newRank}</span>
          </>
        );
      case 'moved_down':
        return (
          <>
            <span className="font-semibold text-foreground">{entry.levelName}</span>
            <span className="text-muted-foreground"> was lowered from </span>
            <span className="font-semibold text-emerald-400">#{entry.oldRank}</span>
            <span className="text-muted-foreground"> to </span>
            <span className="font-semibold text-amber-400">#{entry.newRank}</span>
          </>
        );
      default:
        return null;
    }
  };

  const getChangeColor = (change: ChangelogEntry['change']) => {
    switch (change) {
      case 'added':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'removed':
        return 'border-red-500/30 bg-red-500/5';
      case 'moved_up':
        return 'border-indigo-500/30 bg-indigo-500/5';
      case 'moved_down':
        return 'border-amber-500/30 bg-amber-500/5';
      default:
        return 'border-border/50 bg-muted/30';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <History className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Changelog</h2>
          <p className="text-sm text-muted-foreground">Recent ranking updates</p>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {sortedEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={`p-4 rounded-xl border ${getChangeColor(entry.change)} animate-slideIn`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getChangeIcon(entry.change)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {entry.date}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {getChangeText(entry)}
                  </p>
                  {entry.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {entry.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
