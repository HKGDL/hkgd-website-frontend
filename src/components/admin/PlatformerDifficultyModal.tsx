import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PendingSubmission, Level } from '@/types';

interface PlatformerDifficultyModalProps {
  submission: PendingSubmission;
  onClose: () => void;
  onSubmit: (rank: number, levelData?: Partial<Level>) => Promise<void>;
  existingLevels: Level[];
}

export function PlatformerDifficultyModal({
  submission,
  onClose,
  onSubmit,
  existingLevels
}: PlatformerDifficultyModalProps) {
  const [rank, setRank] = useState<number>(() => {
    const existingPlatformerRanks = existingLevels
      .filter(l => l.hkgdRank !== undefined)
      .map(l => l.hkgdRank as number)
      .sort((a, b) => a - b);
    
    if (existingPlatformerRanks.length > 0) {
      const maxRank = Math.max(...existingPlatformerRanks);
      return maxRank + 1;
    }
    return 1;
  });
  const [isNewLevel, setIsNewLevel] = useState<boolean>(submission.isNewLevel || false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const existingPlatformerRanks = existingLevels
    .filter(l => l.hkgdRank !== undefined)
    .map(l => l.hkgdRank as number)
    .sort((a, b) => a - b);
  
  const suggestedRank = existingPlatformerRanks.length > 0
    ? Math.max(...existingPlatformerRanks) + 1
    : 1;
  
  const handleSubmit = async () => {
    if (rank < 1) {
      setError('Rank must be at least 1');
      return;
    }
    
    // Check if rank is already taken
    const rankTaken = existingLevels.some(l => l.hkgdRank === rank);
    if (rankTaken && !isNewLevel) {
      setError(`Rank ${rank} is already taken by another level`);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create level data if it's a new level
      const levelData = isNewLevel ? {
        name: submission.levelName || `Unknown Level ${submission.levelId}`,
        levelId: submission.levelId,
        hkgdRank: rank,
        creator: 'Unknown',
        verifier: 'Unknown',
        isPlatformer: true
      } : undefined;
      
      await onSubmit(rank, levelData);
      onClose();
    } catch (err) {
      setError('Failed to set difficulty: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>👑 Set Platformer Difficulty</DialogTitle>
          <DialogDescription>
            This submission requires admin to set the HKGD platformer rank.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="levelName" className="text-right">
              Level
            </Label>
            <div className="col-span-3 font-medium">
              {submission.levelName || submission.levelId}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="player" className="text-right">
              Player
            </Label>
            <div className="col-span-3 font-medium">
              {submission.record.player}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rank" className="text-right">
              HKGD Rank
            </Label>
            <div className="col-span-3">
              <Input
                id="rank"
                type="number"
                value={rank}
                onChange={(e) => setRank(parseInt(e.target.value) || 1)}
                min={1}
                placeholder="Enter rank"
                className="col-span-3"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Suggested: {suggestedRank} (next available)
              </p>
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
          </div>
          
          {submission.isNewLevel && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isNewLevel" className="text-right">
                Level Status
              </Label>
              <Select value={isNewLevel ? 'new' : 'existing'} onValueChange={(val) => setIsNewLevel(val === 'new')}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Existing Level</SelectItem>
                  <SelectItem value="new">New Level (Create)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Setting Difficulty...' : 'Set Difficulty & Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
