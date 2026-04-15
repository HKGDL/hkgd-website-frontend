import { useState } from 'react';
import { FileText, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ChangelogEntry } from '@/types';

// Helper function to format date as YY/MM/DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

interface ChangelogManagementProps {
  changelog: ChangelogEntry[];
  onAddEntry: (entry: ChangelogEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onClearAll: () => void;
}

type ListType = 'all' | 'classic' | 'platformer';

export function ChangelogManagement({ 
  changelog, 
  onAddEntry, 
  onDeleteEntry,
  onClearAll
}: ChangelogManagementProps) {
  const [filter, setFilter] = useState<ListType>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: 'level' as 'level' | 'message',
    listType: 'classic' as 'classic' | 'platformer',
    levelName: '',
    levelId: '',
    change: 'added' as ChangelogEntry['change'],
    oldRank: '',
    newRank: '',
    description: ''
  });

  const filteredChangelog = changelog.filter(entry => {
    // Hide AREDL sync entries
    if (entry.change === 'sync') return false;
    if (filter === 'all') return true;
    return entry.listType === filter;
  });

  const handleSubmit = async () => {
    if (!newEntry.description.trim()) {
      alert('Description is required');
      return;
    }

    const entry: ChangelogEntry = {
      id: Date.now().toString(),
      date: formatDate(new Date()),
      levelName: newEntry.levelName || 'System',
      levelId: newEntry.levelId || 'system',
      change: newEntry.change,
      oldRank: newEntry.oldRank ? parseInt(newEntry.oldRank) : null,
      newRank: newEntry.newRank ? parseInt(newEntry.newRank) : null,
      description: newEntry.description,
      listType: newEntry.listType
    };

    await onAddEntry(entry);
    setNewEntry({
      type: 'level',
      listType: 'classic',
      levelName: '',
      levelId: '',
      change: 'added',
      oldRank: '',
      newRank: '',
      description: ''
    });
    setIsAdding(false);
  };

  const getChangeBadgeColor = (change: ChangelogEntry['change']) => {
    switch (change) {
      case 'added': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'removed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'moved_up': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'moved_down': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getChangeLabel = (change: ChangelogEntry['change']) => {
    switch (change) {
      case 'added': return 'Added';
      case 'removed': return 'Removed';
      case 'moved_up': return 'Moved Up';
      case 'moved_down': return 'Moved Down';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Changelog
        </h3>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lists</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="platformer">Platformer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isAdding ? 'Cancel' : 'Add Entry'}
          </Button>
          {changelog.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to clear all changelog entries?')) {
                  onClearAll();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={newEntry.type} onValueChange={(v: any) => setNewEntry({ ...newEntry, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="level">Level Change</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>List Type</Label>
              <Select value={newEntry.listType} onValueChange={(v: any) => setNewEntry({ ...newEntry, listType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="platformer">Platformer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {newEntry.type === 'level' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Level Name</Label>
                  <Input
                    value={newEntry.levelName}
                    onChange={(e) => setNewEntry({ ...newEntry, levelName: e.target.value })}
                    placeholder="Level name"
                  />
                </div>
                <div>
                  <Label>Level ID</Label>
                  <Input
                    value={newEntry.levelId}
                    onChange={(e) => setNewEntry({ ...newEntry, levelId: e.target.value })}
                    placeholder="Level ID"
                  />
                </div>
              </div>

              <div>
                <Label>Change Type</Label>
                <Select value={newEntry.change} onValueChange={(v: any) => setNewEntry({ ...newEntry, change: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="added">Added</SelectItem>
                    <SelectItem value="removed">Removed</SelectItem>
                    <SelectItem value="moved_up">Moved Up</SelectItem>
                    <SelectItem value="moved_down">Moved Down</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(newEntry.change === 'moved_up' || newEntry.change === 'moved_down') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Old Rank</Label>
                    <Input
                      type="number"
                      value={newEntry.oldRank}
                      onChange={(e) => setNewEntry({ ...newEntry, oldRank: e.target.value })}
                      placeholder="Old rank"
                    />
                  </div>
                  <div>
                    <Label>New Rank</Label>
                    <Input
                      type="number"
                      value={newEntry.newRank}
                      onChange={(e) => setNewEntry({ ...newEntry, newRank: e.target.value })}
                      placeholder="New rank"
                    />
                  </div>
                </div>
              )}

              {newEntry.change === 'added' && (
                <div>
                  <Label>New Rank</Label>
                  <Input
                    type="number"
                    value={newEntry.newRank}
                    onChange={(e) => setNewEntry({ ...newEntry, newRank: e.target.value })}
                    placeholder="New rank"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <Label>Description *</Label>
            <Textarea
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              placeholder="Enter description..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="bg-indigo-500 hover:bg-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="max-h-[500px] rounded-xl border border-border/50 bg-muted/30">
        <div className="p-4 space-y-3">
          {filteredChangelog.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No changelog entries</p>
            </div>
          ) : (
            filteredChangelog.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-lg bg-card border border-border/50 hover:border-border/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">{entry.date}</span>
                      <Badge className={getChangeBadgeColor(entry.change)}>
                        {getChangeLabel(entry.change)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {entry.listType === 'classic' ? 'Classic' : 'Platformer'}
                      </Badge>
                    </div>
                    {entry.levelName && (
                      <h4 className="font-semibold text-foreground mb-1">
                        {entry.levelName}
                      </h4>
                    )}
                    {(entry.oldRank !== undefined || entry.newRank !== undefined) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {entry.oldRank !== undefined && (
                          <span>#{entry.oldRank}</span>
                        )}
                        {entry.oldRank !== undefined && entry.newRank !== undefined && (
                          <span>→</span>
                        )}
                        {entry.newRank !== undefined && (
                          <span>#{entry.newRank}</span>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this entry?')) {
                        onDeleteEntry(entry.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}