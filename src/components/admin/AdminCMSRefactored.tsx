import { useState, useEffect } from 'react';
import { X, Lock, Settings, Trophy, Users, List, RefreshCw, LogOut, History, ChevronDown, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminAuth } from './AdminAuth';
import { PendingSubmissions } from './PendingSubmissions';
import { AREDLSync } from './AREDLSync';
import { LevelManagement } from './LevelManagement';
import { ChangelogManagement } from './ChangelogManagement';
import { SettingsManagement } from './SettingsManagement';
import { EditLevelModal } from './EditLevelModal';
import { AddLevelModal } from './AddLevelModal';
import type { Level, Member, ChangelogEntry, PendingSubmission } from '@/types';
import { api } from '@/lib/api';

interface AdminCMSProps {
  levels: Level[];
  members: Member[];
  changelog: ChangelogEntry[];
  pendingSubmissions: PendingSubmission[];
  onUpdateLevels: (levels: Level[]) => void;
  onUpdateMembers: (members: Member[]) => void;
  onUpdateChangelog: (changelog: ChangelogEntry[]) => void;
  onUpdatePending: (pending: PendingSubmission[]) => void;
  onReloadData: () => Promise<void>;
  onClose: () => void;
}

export function AdminCMSRefactored({ 
  levels, 
  members, 
  changelog, 
  pendingSubmissions,
  onUpdateLevels, 
  onUpdateMembers,
  onUpdateChangelog,
  onUpdatePending,
  onReloadData,
  onClose 
}: AdminCMSProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banRemainingTime, setBanRemainingTime] = useState<number>();
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'classic-levels' | 'platformer-levels' | 'pending' | 'sync' | 'changelog' | 'settings'>(() => {
    const savedTab = localStorage.getItem('admin-active-tab');
    return (savedTab === 'classic-levels' || savedTab === 'platformer-levels' || savedTab === 'pending' || savedTab === 'sync' || savedTab === 'changelog' || savedTab === 'settings')
      ? savedTab
      : 'classic-levels';
  });

  // Platformer level search state
  const [platformerSearchQuery, setPlatformerSearchQuery] = useState('');
  const [platformerSearchResults, setPlatformerSearchResults] = useState<any[]>([]);
  const [isSearchingPlatformer, setIsSearchingPlatformer] = useState(false);

  // Edit level state
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);

  // Add level state
  const [showAddLevel, setShowAddLevel] = useState(false);

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-active-tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    // Check if already authenticated via token
    const checkAuth = async () => {
      try {
        const result = await api.verifyToken();
        if (result.success) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log('Not authenticated');
      }
    };
    checkAuth();
  }, []);

  // Fetch platformer levels for search
  useEffect(() => {
    const fetchPlatformerLevels = async () => {
      if (!platformerSearchQuery.trim()) {
        setPlatformerSearchResults([]);
        return;
      }

      setIsSearchingPlatformer(true);
      try {
        const platformerLevels = await api.getPlatformerDemons();
        const query = platformerSearchQuery.toLowerCase();

        // Filter levels by name or ID
        const filtered = platformerLevels.filter((l: any) =>
          l.name.toLowerCase().includes(query) ||
          l.level_id.toString().includes(query)
        ).slice(0, 20); // Limit to 20 results

        setPlatformerSearchResults(filtered);
      } catch (err) {
        console.error('Failed to fetch platformer levels:', err);
        setPlatformerSearchResults([]);
      } finally {
        setIsSearchingPlatformer(false);
      }
    };

    const debounceTimer = setTimeout(fetchPlatformerLevels, 300);
    return () => clearTimeout(debounceTimer);
  }, [platformerSearchQuery]);

  const handleLogin = async (password: string) => {
    try {
      const result = await api.login(password);
      if (result.success) {
        setIsAuthenticated(true);
        setPasswordError(false);
        setIsBanned(false);
      } else {
        setPasswordError(true);
        setIsBanned(false);
        
        // Check if IP is banned
        if (result.error === 'IP banned') {
          setIsBanned(true);
          setBanRemainingTime(result.remainingTime);
        }
        
        // Show attempts remaining
        if (result.attemptsRemaining !== undefined) {
          setAttemptsRemaining(result.attemptsRemaining);
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      // Check if it's a ban error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('IP banned')) {
        setIsBanned(true);
      } else {
        setPasswordError(true);
      }
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setPasswordError(false);
  };

  const handleApproveSubmission = async (submission: PendingSubmission) => {
    try {
      console.log('Approving submission:', submission);
      
      // Check if level already exists in our database
      const existingLevel = levels.find(l => l.id === submission.levelId);
      
      if (!existingLevel) {
        // Level doesn't exist - create it from submission data
        const levelData = submission.levelData || {};
        
        // Calculate HKGD rank for new level
        const allLevelsWithNew = [...levels, {
          id: submission.levelId,
          aredlRank: levelData.aredlRank || 9999
        }];
        const sortedByAredl = allLevelsWithNew
          .filter(l => l.aredlRank !== null)
          .sort((a, b) => (a.aredlRank || 9999) - (b.aredlRank || 9999));
        
        const hkgdRank = sortedByAredl.findIndex(l => l.id === submission.levelId) + 1;
        
        const newLevel: Level = {
          id: submission.levelId,
          hkgdRank: hkgdRank,
          aredlRank: levelData.aredlRank || null,
          pemonlistRank: levelData.pemonlistRank || null,
          name: levelData.name || submission.levelName || 'Unknown',
          creator: levelData.creator || 'Unknown',
          verifier: levelData.verifier || 'Unknown',
          levelId: submission.levelId,
          description: levelData.description || '',
          thumbnail: levelData.thumbnail,
          songId: levelData.songId,
          songName: levelData.songName,
          tags: levelData.tags || ['Overall'],
          dateAdded: submission.submittedAt,
          records: [],
          pack: levelData.pack,
          gddlTier: levelData.gddlTier,
          nlwTier: levelData.nlwTier
        };

        console.log('Creating new level:', newLevel);
        await api.createLevel(newLevel);
      }
      
      // Add the record (level should now exist)
      console.log('Adding record to level:', submission.levelId, submission.record);
      await api.addRecord(submission.levelId, submission.record);
      
      // Update submission status
      await api.updatePendingSubmission(submission.id, 'approved');
      
      // Reload data to refresh all lists
      await onReloadData();
      
      alert('Submission approved successfully!');
    } catch (error) {
      console.error('Failed to approve submission:', error);
      alert(`Failed to approve: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      await api.updatePendingSubmission(submissionId, 'rejected');
      onUpdatePending(pendingSubmissions.filter(p => p.id !== submissionId));
    } catch (error) {
      console.error('Failed to reject submission:', error);
      alert('Failed to reject submission. Please try again.');
    }
  };

  const handleApproveAll = async () => {
    for (const submission of pendingSubmissions) {
      await handleApproveSubmission(submission);
    }
  };

  const handleRejectAll = async () => {
    for (const submission of pendingSubmissions) {
      await handleRejectSubmission(submission.id);
    }
  };

  const handleSyncAREDL = async () => {
    try {
      const result = await api.syncAREDL();
      
      if (result.success) {
        alert(`AREDL sync completed!\n\n${result.message}\n\n- Added: ${result.stats.added}\n- Updated: ${result.stats.updated}\n- Moved: ${result.stats.rankChanges}\n- Total levels: ${result.stats.totalLevels}`);
        
        // Reload data to refresh all lists
        await onReloadData();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('AREDL sync error:', error);
      alert(`AREDL sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddChangelogEntry = async (entry: ChangelogEntry) => {
    try {
      await api.addChangelog(entry);
      await onReloadData();
    } catch (error) {
      console.error('Failed to add changelog entry:', error);
      alert('Failed to add changelog entry. Please try again.');
    }
  };

  const handleDeleteChangelogEntry = async (entryId: string) => {
    try {
      await api.deleteChangelogEntry(entryId);
      await onReloadData();
    } catch (error) {
      console.error('Failed to delete changelog entry:', error);
      alert('Failed to delete changelog entry. Please try again.');
    }
  };

  const handleClearChangelog = async () => {
    try {
      await api.clearChangelog();
      await onReloadData();
    } catch (error) {
      console.error('Failed to clear changelog:', error);
      alert('Failed to clear changelog. Please try again.');
    }
  };

  const handleAddLevel = () => {
    setShowAddLevel(true);
  };

  const handleAddPlatformerLevel = async (pemonlistLevel: any) => {
    try {
      console.log('Adding platformer level:', pemonlistLevel);

      // Calculate HKGD rank for the new platformer level
      const platformerLevels = levels.filter(l => l.aredlRank === null);
      const newHKGDRank = platformerLevels.length + 1;

      // Create new platformer level
      const newLevel: Level = {
        id: pemonlistLevel.level_id.toString(),
        hkgdRank: newHKGDRank,
        aredlRank: null, // Platformer levels don't have AREDL rank
        pemonlistRank: pemonlistLevel.position,
        name: pemonlistLevel.name,
        creator: pemonlistLevel.publisher || 'Unknown',
        verifier: pemonlistLevel.verifier || 'Unknown',
        levelId: pemonlistLevel.level_id.toString(),
        description: '', // Platformer levels don't have descriptions
        thumbnail: pemonlistLevel.thumbnail || undefined,
        songId: undefined,
        songName: undefined,
        tags: ['Platformer'],
        dateAdded: new Date().toISOString(),
        records: [],
        pack: undefined,
        gddlTier: undefined,
        nlwTier: undefined
      };

      await api.createLevel(newLevel);

      // Reload data to refresh the list
      await onReloadData();

      alert(`Successfully added ${newLevel.name} (Pemonlist #${pemonlistLevel.position})!`);

      // Reset search
      setPlatformerSearchQuery('');
      setPlatformerSearchResults([]);
    } catch (error) {
      console.error('Failed to add platformer level:', error);
      alert(`Failed to add platformer level: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditLevel = (level: Level) => {
    setEditingLevel(level);
  };

  const handleSaveLevel = async (updatedLevel: Level) => {
    // Update the level in the local state
    const updatedLevels = levels.map(l => 
      l.id === updatedLevel.id ? updatedLevel : l
    );
    onUpdateLevels(updatedLevels);
    setEditingLevel(null);
  };

  const handleLevelDeleted = async () => {
    // Refresh the levels list
    await onReloadData();
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (confirm('Are you sure you want to delete this level?')) {
      try {
        await api.deleteLevel(levelId);
        const updatedLevels = levels.filter(l => l.id !== levelId);
        onUpdateLevels(updatedLevels);
        alert('Level deleted successfully!');
      } catch (error) {
        console.error('Failed to delete level:', error);
        alert('Failed to delete level. Please try again.');
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminAuth 
        onLogin={handleLogin} 
        onClose={onClose} 
        passwordError={passwordError}
        isBanned={isBanned}
        banRemainingTime={banRemainingTime}
        attemptsRemaining={attemptsRemaining}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl border border-border/50 overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
              <p className="text-sm text-muted-foreground">Manage HKGD list</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Dropdown for tab selection */}
        <div className="px-6 pt-6">
          <Select value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic-levels">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Classic Levels
                </div>
              </SelectItem>
              <SelectItem value="platformer-levels">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Platformer Levels
                </div>
              </SelectItem>
              <SelectItem value="pending">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Pending Submissions
                </div>
              </SelectItem>
              <SelectItem value="changelog">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Changelog
                </div>
              </SelectItem>
              <SelectItem value="sync">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  AREDL Sync
                </div>
              </SelectItem>
              <SelectItem value="settings">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Settings
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[calc(90vh-140px)]">
          <div className="p-6">
            {activeTab === 'classic-levels' && (
              <LevelManagement
                levels={levels.filter(l => l.aredlRank !== null)}
                onAddLevel={handleAddLevel}
                onEditLevel={handleEditLevel}
                onDeleteLevel={handleDeleteLevel}
                listType="classic"
              />
            )}

            {activeTab === 'platformer-levels' && (
              <LevelManagement
                levels={levels.filter(l => l.aredlRank === null)}
                onAddLevel={handleAddLevel}
                onEditLevel={handleEditLevel}
                onDeleteLevel={handleDeleteLevel}
                listType="platformer"
                onAddPlatformerLevel={handleAddPlatformerLevel}
                platformerSearchQuery={platformerSearchQuery}
                onPlatformerSearchChange={setPlatformerSearchQuery}
                platformerSearchResults={platformerSearchResults}
                isSearchingPlatformer={isSearchingPlatformer}
              />
            )}

            {activeTab === 'pending' && (
              <PendingSubmissions
                submissions={pendingSubmissions}
                levels={levels}
                onApprove={handleApproveSubmission}
                onReject={handleRejectSubmission}
                onApproveAll={handleApproveAll}
                onRejectAll={handleRejectAll}
              />
            )}

            {activeTab === 'changelog' && (
              <ChangelogManagement
                changelog={changelog}
                onAddEntry={handleAddChangelogEntry}
                onDeleteEntry={handleDeleteChangelogEntry}
                onClearAll={handleClearChangelog}
              />
            )}

            {activeTab === 'sync' && (
              <AREDLSync onSync={handleSyncAREDL} />
            )}

            {activeTab === 'settings' && (
              <SettingsManagement />
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Edit Level Modal */}
      {editingLevel && (
        <EditLevelModal
          level={editingLevel}
          onClose={() => setEditingLevel(null)}
          onSave={handleSaveLevel}
          onDeleted={handleLevelDeleted}
        />
      )}

      {/* Add Level Modal */}
      {showAddLevel && (
        <AddLevelModal
          levels={levels}
          onClose={() => setShowAddLevel(false)}
          onAdded={onReloadData}
        />
      )}
    </div>
  );
}