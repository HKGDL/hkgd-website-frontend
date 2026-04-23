import { useState, useEffect } from 'react';
import { X, Lock, Settings, Trophy, Users, User, List, RefreshCw, LogOut, History, ChevronDown, Sliders, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { css } from '@emotion/css';
import { toast } from 'sonner';
import { AdminAuth } from './AdminAuth';
import { PendingSubmissions } from './PendingSubmissions';
import { AREDLSync } from './AREDLSync';
import { LevelManagement } from './LevelManagement';
import { ChangelogManagement } from './ChangelogManagement';
import { SettingsManagement } from './SettingsManagement';
import { SuggestionsManagement } from './SuggestionsManagement';
import { PlayerMappings } from './PlayerMappings';
import { EditLevelModal } from './EditLevelModal';
import { AddLevelModal } from './AddLevelModal';
import { PlatformerDifficultyModal } from './PlatformerDifficultyModal';
import type { Level, Member, ChangelogEntry, PendingSubmission } from '@/types';
import { api } from '@/lib/api';

interface AdminCMSProps {
  levels: Level[];
  platformerLevels: Level[];
  members: Member[];
  changelog: ChangelogEntry[];
  pendingSubmissions: PendingSubmission[];
  onUpdateLevels: (levels: Level[]) => void;
  onUpdatePlatformerLevels: (levels: Level[]) => void;
  onUpdateMembers: (members: Member[]) => void;
  onUpdateChangelog: (changelog: ChangelogEntry[]) => void;
  onUpdatePending: (pending: PendingSubmission[]) => void;
  onReloadData: () => Promise<void>;
  onClose: () => void;
}

export function AdminCMSRefactored({ 
  levels, 
  platformerLevels,
  members, 
  changelog, 
  pendingSubmissions,
  onUpdateLevels, 
  onUpdatePlatformerLevels,
  onUpdateMembers,
  onUpdateChangelog,
  onUpdatePending,
  onReloadData,
  onClose 
}: AdminCMSProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminType, setIsAdminType] = useState<boolean | 'suggestions'>(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banRemainingTime, setBanRemainingTime] = useState<number>();
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'classic-levels' | 'platformer-levels' | 'pending' | 'sync' | 'changelog' | 'settings' | 'suggestions' | 'mappings'>(() => {
    const savedTab = localStorage.getItem('admin-active-tab');
    return (savedTab === 'classic-levels' || savedTab === 'platformer-levels' || savedTab === 'pending' || savedTab === 'sync' || savedTab === 'changelog' || savedTab === 'settings' || savedTab === 'suggestions' || savedTab === 'mappings')
      ? savedTab
      : 'classic-levels';
  });
  const [difficultyModalSubmission, setDifficultyModalSubmission] = useState<PendingSubmission | null>(null);
  
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
          setIsAdminType(result.user?.isAdmin || false);
        }
      } catch (error) {
        console.log('Not authenticated');
      }
    };
    checkAuth();
  }, []);

  // Fetch platformer levels for search via History GD API
  useEffect(() => {
    const fetchPlatformerLevels = async () => {
      if (!platformerSearchQuery.trim()) {
        setPlatformerSearchResults([]);
        return;
      }

      setIsSearchingPlatformer(true);
      try {
        // Use History GD API for searching
        const results = await api.searchLevels(platformerSearchQuery);
        
        // Filter for platformer levels (cache_length = 5 = platformer)
        const filtered = results.filter((l: any) =>
          l.cache_length === 5
        ).slice(0, 20);

        setPlatformerSearchResults(filtered);
      } catch (err) {
        console.error('Failed to search platformer levels:', err);
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
        setIsAdminType(result.user?.isAdmin || false);
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

  const handlePlatformerDifficultySubmit = async (rank: number, levelData?: Partial<Level>) => {
    try {
      if (!difficultyModalSubmission) return;
      
      const submission = difficultyModalSubmission;
      console.log('Processing platformer submission:', submission);
      
      // Check if level already exists in platformer list
      let existingLevel = platformerLevels.find(l => l.levelId === submission.levelId);
      
      if (levelData || !existingLevel) {
        // Create or update level
        const platformerLevelData = {
          id: `plat-${submission.levelId}`,
          hkgdRank: rank,
          aredlRank: null,
          name: levelData?.name || levelData?.levelId || submission.levelName || submission.levelId,
          creator: levelData?.creator || 'Unknown',
          verifier: levelData?.verifier || 'Unknown',
          levelId: submission.levelId,
          description: levelData?.description || '',
          thumbnail: levelData?.thumbnail || `https://levelthumbs.prevter.me/thumbnail/${submission.levelId}`,
          songId: null,
          songName: null,
          tags: ['Platformer'],
          dateAdded: new Date().toISOString(),
          records: []
        };
        
        if (existingLevel) {
          console.log('Updating existing platformer level rank:', existingLevel.id, 'from', existingLevel.hkgdRank, 'to', rank);
          await api.updatePlatformerLevel(existingLevel.id, {
            ...existingLevel,
            hkgdRank: rank
          });
          toast(`✅ Updated ${existingLevel.name} to rank #${rank}`);
        } else {
          console.log('Creating new platformer level with rank:', rank);
          await api.createPlatformerLevel(platformerLevelData);
          toast('✅ Created new platformer level');
        }
      } else if (existingLevel && existingLevel.hkgdRank !== rank) {
        console.log('Updating existing platformer level rank:', existingLevel.id, 'from', existingLevel.hkgdRank, 'to', rank);
        await api.updatePlatformerLevel(existingLevel.id, {
          ...existingLevel,
          hkgdRank: rank
        });
        toast(`✅ Updated ${existingLevel.name} to rank #${rank}`);
      }
      
      const recordData = {
        player: submission.record.player,
        date: submission.record.date,
        videoUrl: submission.record.videoUrl,
        fps: submission.record.fps,
        attempts: submission.record.attempts,
        cbf: submission.record.cbf
      };
      
      const platformerLevelId = `plat-${submission.levelId}`;
      console.log('Adding platformer record to level:', platformerLevelId, recordData);
      await api.addPlatformerRecord(platformerLevelId, recordData);
      toast('✅ Added platformer record');
      
      console.log('Updating submission status to approved');
      await api.updatePendingSubmission(submission.id, 'approved');
      
      console.log('Refreshing data...');
      await onReloadData();
      
      toast(`✅ Platformer submission approved! Set to rank #${rank} in platformer list`);
      
      setDifficultyModalSubmission(null);
    } catch (error) {
      console.error('Failed to approve platformer submission:', error);
      toast(`❌ Failed to approve platformer submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      // Always show platformer difficulty modal for platformer submissions
      if (submission.isPlatformer) {
        setDifficultyModalSubmission(submission);
        return; // Show modal to assign rank
      }
      
      // Check if level already exists in our database
      const existingLevel = levels.find(l => l.levelId === submission.levelId);
      
      if (!existingLevel) {
        // Level doesn't exist - fetch data from AREDL API
        let aredlData: any = null;
        try {
          const aredlLevels = await api.getAREDLLevels();
          aredlData = aredlLevels.find((l: any) => 
            l.level_id?.toString() === submission.levelId || 
            l.id?.toString() === submission.levelId
          );
          console.log('Fetched AREDL data:', aredlData);
        } catch (err) {
          console.warn('Could not fetch AREDL data, using submission data:', err);
        }
        
        // Use AREDL data or fall back to submission data
        const levelData = aredlData || submission.levelData || {};
        
        // Fetch creator/verifier from Pointercrate for top 150, or GDBrowser for everything else
        let creator = levelData.creator || 'Unknown';
        let verifier = levelData.verifier || 'Unknown';
        const position = levelData.position || levelData.aredlRank || 9999;
        const levelIdToFetch = aredlData?.level_id || submission.levelId;
        
        if (position <= 150 && aredlData?.name) {
          // Top 150 - fetch from Pointercrate
          try {
            const pcResponse = await fetch(`https://pointercrate.com/api/v2/demons/?name_contains=${encodeURIComponent(aredlData.name)}`);
            if (pcResponse.ok) {
              const pcData = await pcResponse.json();
              if (pcData.length > 0) {
                creator = pcData[0].publisher?.name || creator;
                verifier = pcData[0].verifier?.name || verifier;
              }
            }
          } catch (pcError) {
            console.warn('Failed to fetch from Pointercrate:', pcError);
          }
        } else {
          // NOT top 150 - fetch from GDBrowser
          if (levelIdToFetch) {
            try {
              const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${levelIdToFetch}`);
              if (gdbResponse.ok) {
                const gdbData = await gdbResponse.json();
                if (gdbData.author) {
                  creator = gdbData.author;
                }
              }
            } catch (gdbError) {
              console.warn('Failed to fetch from GDBrowser:', gdbError);
            }
          }
        }
        
        // Final fallback to submission data
        creator = creator === 'Unknown' ? (submission.levelData?.creator || 'Unknown') : creator;
        verifier = verifier === 'Unknown' ? (submission.levelData?.verifier || 'Unknown') : verifier;
        
        // Calculate HKGD rank for new level
        const allLevelsWithNew = [...levels, {
          id: submission.levelId,
          aredlRank: levelData.position || levelData.aredlRank || 9999
        }];
        const sortedByAredl = allLevelsWithNew
          .filter(l => l.aredlRank !== null)
          .sort((a, b) => (a.aredlRank || 9999) - (b.aredlRank || 9999));
        
        const hkgdRank = sortedByAredl.findIndex(l => l.id === submission.levelId) + 1;
        
        // Use AREDL thumbnail or Prevter levelthumbs as fallback
        const thumbnail = levelData.thumbnail || 
          `https://levelthumbs.prevter.me/thumbnail/${submission.levelId}`;
        
        const newLevel: Level = {
          id: submission.levelId,
          hkgdRank: hkgdRank,
          aredlRank: levelData.position || levelData.aredlRank || null,
          // Removed pemonlistRank - using manual ranking only
          // pemonlistRank: levelData.pemonlistRank || null,
          name: levelData.name || submission.levelName || 'Unknown',
          creator: creator,
          verifier: verifier,
          levelId: submission.levelId,
          description: levelData.description || '',
          thumbnail: thumbnail,
          songId: levelData.song?.id?.toString() || levelData.songId,
          songName: levelData.song?.name 
            ? `${levelData.song.name}${levelData.song.author ? ` by ${levelData.song.author}` : ''}`
            : levelData.songName,
          tags: levelData.tags || ['Overall'],
          dateAdded: submission.submittedAt,
          records: [],
          pack: levelData.pack,
          gddlTier: levelData.gddl_tier,
          nlwTier: levelData.nlw_tier,
          edelEnjoyment: levelData.edel_enjoyment || null
        };

        console.log('Creating new level:', newLevel);
        await api.createLevel(newLevel);
        
        // Get levels above and below for changelog description
        const sortedClassicLevels = levels
          .filter(l => l.aredlRank !== null)
          .sort((a, b) => (a.hkgdRank || 9999) - (b.hkgdRank || 9999));
        const levelAbove = sortedClassicLevels[hkgdRank - 2];
        const levelBelow = sortedClassicLevels[hkgdRank - 1];
        
        let description = `${newLevel.name} was added at rank #${hkgdRank}`;
        if (levelAbove && levelBelow) {
          description += `, above ${levelBelow.name} and below ${levelAbove.name}`;
        } else if (levelAbove) {
          description += `, below ${levelAbove.name}`;
        } else if (levelBelow) {
          description += `, above ${levelBelow.name}`;
        }
        
        // Create changelog entry for the new level
        const changelogEntry = {
          id: `changelog-${Date.now()}`,
          date: (() => {
            const d = new Date();
            return `${d.getFullYear().toString().slice(-2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
          })(),
          levelName: newLevel.name,
          levelId: submission.levelId,
          change: 'added' as const,
          oldRank: null,
          newRank: hkgdRank,
          description: description,
          listType: 'classic' as const,
        };
        await api.addChangelog(changelogEntry);
      }
      
      // Add the record - use the level's database ID if it exists, otherwise use submission.levelId
      const levelIdForRecord = existingLevel ? existingLevel.id : submission.levelId;
      console.log('Adding record to level:', levelIdForRecord, submission.record);
      await api.addRecord(levelIdForRecord, submission.record);
      
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
        alert(`AREDL sync completed!\n\n${result.message}\n\n- Updated levels: ${result.updatedLevels || result.details?.length || 0}`);
        
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

  const handleSyncLevelDetails = async () => {
    try {
      const result = await api.syncLevelDetails();
      
      if (result.success) {
        alert(`Classic levels details synced!\n\n${result.message}\n\n- Updated levels: ${result.updatedLevels || 0}`);
        await onReloadData();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Level details sync error:', error);
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSyncPlatformerLevelDetails = async () => {
    try {
      const result = await api.syncPlatformerLevelDetails();
      
      if (result.success) {
        alert(`Platformer levels details synced!\n\n${result.message}\n\n- Updated levels: ${result.updatedLevels || 0}`);
        await onReloadData();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Platformer level details sync error:', error);
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const handleAddPlatformerLevel = async (levelData: any) => {
    try {
      console.log('Adding platformer level:', levelData);

      const newHKGDRank = platformerLevels.length + 1;

      // Fetch level details from History GD API
      let levelDetails: any = null;
      try {
        levelDetails = await api.getLevelDetails(levelData.level_id);
      } catch (err) {
        console.warn('Could not fetch level details, using search data:', err);
      }

      // Use fetched data or fallback to search data
      const creator = levelDetails?.author || levelData.publisher || 'Unknown';
      const verifier = levelDetails?.verifier || 'Unknown';
      const thumbnail = levelDetails?.thumbnail || levelDetails?.img || `https://levelthumbs.prevter.me/thumbnail/${levelData.level_id}`;
      const description = levelDetails?.description || '';

      const newLevel: Level = {
        id: `plat-${levelData.level_id}`,
        hkgdRank: newHKGDRank,
        aredlRank: null,
        name: levelDetails?.name || levelData.name,
        creator,
        verifier,
        levelId: levelData.level_id.toString(),
        description,
        thumbnail,
        songId: levelDetails?.song?.id?.toString() || undefined,
        songName: levelDetails?.song?.name || undefined,
        tags: ['Platformer'],
        dateAdded: new Date().toISOString(),
        records: [],
        pack: undefined,
        gddlTier: undefined,
        nlwTier: undefined
      };

      await api.createPlatformerLevel(newLevel);

      const levelAbove = platformerLevels[newHKGDRank - 2];
      const levelBelow = platformerLevels[newHKGDRank - 1];
      
      let changelogDesc = `${newLevel.name} was added at rank #${newHKGDRank}`;
      if (levelAbove && levelBelow) {
        changelogDesc += `, above ${levelBelow.name} and below ${levelAbove.name}`;
      } else if (levelAbove) {
        changelogDesc += `, below ${levelAbove.name}`;
      } else if (levelBelow) {
        changelogDesc += `, above ${levelBelow.name}`;
      }

      const changelogEntry = {
        id: `changelog-${Date.now()}`,
        date: (() => {
          const d = new Date();
          return `${d.getFullYear().toString().slice(-2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
        })(),
        levelName: newLevel.name,
        levelId: levelData.level_id.toString(),
        change: 'added' as const,
        oldRank: null,
        newRank: newHKGDRank,
        description: changelogDesc,
        listType: 'platformer' as const,
      };
      await api.addChangelog(changelogEntry);

      await onReloadData();

      alert(`Successfully added ${newLevel.name} (HKGD #${newHKGDRank})!`);

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

  const handleDeletePlatformerLevel = async (levelId: string) => {
    if (confirm('Are you sure you want to delete this platformer level?')) {
      try {
        await api.deletePlatformerLevel(levelId);
        const updatedPlatformerLevels = platformerLevels.filter(l => l.id !== levelId);
        onUpdatePlatformerLevels(updatedPlatformerLevels);
        alert('Platformer level deleted successfully!');
      } catch (error) {
        console.error('Failed to delete platformer level:', error);
        alert('Failed to delete platformer level. Please try again.');
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
      <div className="relative w-full max-w-4xl h-[90vh] sm:max-h-[95vh] sm:h-auto bg-card rounded-2xl border border-border/50 overflow-hidden animate-fadeIn flex flex-col">
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-border/50 shrink-0">
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
              <SelectItem value="mappings">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Player Mappings
                </div>
              </SelectItem>
              {isAdminType === 'suggestions' && (
                <SelectItem value="suggestions">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Suggestions
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 min-h-0">
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
                levels={platformerLevels}
                onAddLevel={handleAddLevel}
                onEditLevel={handleEditLevel}
                onDeleteLevel={handleDeleteLevel}
                onDeletePlatformerLevel={handleDeletePlatformerLevel}
                listType="platformer"
                onAddPlatformerLevel={handleAddPlatformerLevel}
                platformerSearchQuery={platformerSearchQuery}
                onPlatformerSearchChange={setPlatformerSearchQuery}
                platformerSearchResults={platformerSearchResults}
                isSearchingPlatformer={isSearchingPlatformer}
                onReloadData={onReloadData}
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
                onRefresh={onReloadData}
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
              <AREDLSync 
                onSync={handleSyncAREDL}
                onSyncDetails={handleSyncLevelDetails}
                onSyncPlatformerDetails={handleSyncPlatformerLevelDetails}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsManagement />
            )}

            {activeTab === 'mappings' && (
              <PlayerMappings />
            )}

            {isAdminType === 'suggestions' && activeTab === 'suggestions' && (
              <SuggestionsManagement />
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

      {/* Platformer Difficulty Placement Modal */}
      {difficultyModalSubmission && (
        <PlatformerDifficultyModal
          submission={difficultyModalSubmission}
          onClose={() => setDifficultyModalSubmission(null)}
          onSubmit={handlePlatformerDifficultySubmit}
          existingLevels={platformerLevels}
        />
      )}
    </div>
  );
}