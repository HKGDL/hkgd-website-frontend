import { useState } from 'react';
import { X, Save, Plus, Search, Music, User, Hash, FileText, Image, Tag, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Level, Record } from '@/types';
import { api } from '@/lib/api';

interface AddLevelModalProps {
  levels: Level[];
  onClose: () => void;
  onAdded: () => void;
}

export function AddLevelModal({ levels, onClose, onAdded }: AddLevelModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingAREDL, setIsSearchingAREDL] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAREDLLevel, setSelectedAREDLLevel] = useState<any | null>(null);
  const [mode, setMode] = useState<'search' | 'manual'>('search');

  // Level details state
  const [formData, setFormData] = useState({
    name: '',
    creator: '',
    verifier: '',
    levelId: '',
    description: '',
    thumbnail: '',
    songId: '',
    songName: '',
    tags: 'Overall',
    pack: '',
    gddlTier: '',
    nlwTier: '',
  });

  // Record state
  const [record, setRecord] = useState<Partial<Record>>({
    player: '',
    date: new Date().toISOString().split('T')[0],
    videoUrl: '',
    fps: '',
    cbf: false,
    attempts: undefined,
  });
  const [addRecord, setAddRecord] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Search AREDL levels
  const handleSearchAREDL = async () => {
    if (!searchQuery.trim()) return;

    setIsSearchingAREDL(true);
    try {
      const aredlLevels = await api.getAREDLLevels();
      const query = searchQuery.toLowerCase();
      
      const filtered = aredlLevels.filter((l: any) =>
        l.name?.toLowerCase().includes(query) ||
        l.level_id?.toString() === searchQuery ||
        l.position?.toString() === searchQuery
      ).slice(0, 10);

      setSearchResults(filtered);

      if (filtered.length === 0) {
        alert('No levels found. Try a different search or use manual entry.');
      }
    } catch (error) {
      console.error('Failed to search AREDL:', error);
      alert('Failed to search AREDL levels');
    } finally {
      setIsSearchingAREDL(false);
    }
  };

  // Select an AREDL level and populate form
  const handleSelectAREDLLevel = (level: any) => {
    setSelectedAREDLLevel(level);
    setFormData({
      name: level.name || '',
      creator: level.creator || '',
      verifier: level.verifier || '',
      levelId: level.level_id?.toString() || '',
      description: level.description || '',
      thumbnail: level.thumbnail || '',
      songId: level.song?.id?.toString() || '',
      songName: level.song?.name ? 
        `${level.song.name}${level.song.author ? ` by ${level.song.author}` : ''}` : '',
      tags: level.tags?.join(', ') || 'Overall',
      pack: '',
      gddlTier: '',
      nlwTier: '',
    });
    setMode('manual');
  };

  // Calculate the correct HKGD rank
  const calculateHKGDRank = () => {
    const classicLevels = levels.filter(l => l.aredlRank !== null);
    
    if (selectedAREDLLevel?.position) {
      // Find where this level should be placed based on AREDL rank
      const sortedByAredl = [...classicLevels]
        .filter(l => l.aredlRank)
        .sort((a, b) => (a.aredlRank || 9999) - (b.aredlRank || 9999));
      
      let rank = 1;
      for (const level of sortedByAredl) {
        if ((level.aredlRank || 9999) < selectedAREDLLevel.position) {
          rank++;
        }
      }
      return rank;
    }
    
    return classicLevels.length + 1;
  };

  // Helper function to format date as YY/MM/DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.creator || !formData.verifier || !formData.levelId) {
      alert('Name, Creator, Verifier, and Level ID are required');
      return;
    }

    if (addRecord && (!record.player || !record.date || !record.videoUrl)) {
      alert('Player, Date, and Video URL are required for the record');
      return;
    }

    // Check if level ID already exists
    if (levels.some(l => l.id === formData.levelId)) {
      alert('A level with this ID already exists');
      return;
    }

    setIsSaving(true);
    try {
      const hkgdRank = calculateHKGDRank();
      const levelId = formData.levelId;

      const newLevel: Level = {
        id: levelId,
        hkgdRank: hkgdRank,
        aredlRank: selectedAREDLLevel?.position || null,
        // Removed pemonlistRank - using manual ranking only
        // pemonlistRank: null,
        name: formData.name,
        creator: formData.creator,
        verifier: formData.verifier,
        levelId: levelId,
        description: formData.description || '',
        thumbnail: formData.thumbnail || undefined,
        songId: formData.songId || undefined,
        songName: formData.songName || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        dateAdded: new Date().toISOString(),
        records: [],
        pack: formData.pack || undefined,
        gddlTier: formData.gddlTier ? parseInt(formData.gddlTier) : undefined,
        nlwTier: formData.nlwTier || undefined,
      };

      await api.createLevel(newLevel);

      // Get levels above and below for changelog description
      const sortedClassicLevels = levels
        .filter(l => l.aredlRank !== null)
        .sort((a, b) => (a.hkgdRank || 9999) - (b.hkgdRank || 9999));
      const levelAbove = sortedClassicLevels[hkgdRank - 2]; // rank - 1 (0-indexed)
      const levelBelow = sortedClassicLevels[hkgdRank - 1]; // rank + 1 (after insertion)
      
      let description = `${formData.name} was added at rank #${hkgdRank}`;
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
        date: formatDate(new Date()),
        levelName: formData.name,
        levelId: levelId,
        change: 'added' as const,
        oldRank: null,
        newRank: hkgdRank,
        description: description,
        listType: 'classic' as const,
      };
      await api.addChangelog(changelogEntry);

      // Add record if provided
      if (addRecord && record.player && record.date && record.videoUrl) {
        await api.addRecord(levelId, {
          player: record.player,
          date: record.date,
          videoUrl: record.videoUrl,
          fps: record.fps || undefined,
          cbf: record.cbf || false,
          attempts: record.attempts,
        });
      }

      alert(`Level "${formData.name}" added successfully!`);
      onAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add level:', error);
      alert(`Failed to add level: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-2xl border border-border/50 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Add New Level</h2>
              <p className="text-sm text-muted-foreground">Classic Demon List</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border/50">
          <div className="flex">
            <button
              onClick={() => setMode('search')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                mode === 'search'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Search AREDL
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                mode === 'manual'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Manual Entry
            </button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(90vh-200px)]">
          <div className="p-6">
            {mode === 'search' && (
              <div className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Search for a level in the AREDL database by name or level ID, then select it to auto-populate the form.
                  </AlertDescription>
                </Alert>

                {/* Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or level ID..."
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchAREDL()}
                    />
                  </div>
                  <Button onClick={handleSearchAREDL} disabled={isSearchingAREDL}>
                    {isSearchingAREDL ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Results</h4>
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                      {searchResults.map((level) => (
                        <button
                          key={level.level_id}
                          onClick={() => handleSelectAREDLLevel(level)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted transition-colors border-b border-border/30 last:border-b-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="default" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                                AREDL #{level.position}
                              </Badge>
                              <Badge variant="secondary">ID: {level.level_id}</Badge>
                            </div>
                            <h4 className="font-semibold text-foreground">{level.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              by {level.creator} • Verified by {level.verifier}
                            </p>
                            {level.song && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <Music className="w-3 h-3 inline mr-1" />
                                {level.song.name} by {level.song.author}
                              </p>
                            )}
                          </div>
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                            <Check className="w-4 h-4 mr-1" />
                            Select
                          </Button>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center py-4">
                  <Button variant="outline" onClick={() => setMode('manual')}>
                    Or enter level data manually
                  </Button>
                </div>
              </div>
            )}

            {mode === 'manual' && (
              <div className="space-y-6">
                {selectedAREDLLevel && (
                  <Alert className="bg-emerald-500/10 border-emerald-500/20">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <AlertDescription className="text-emerald-400">
                      Auto-filled from AREDL #{selectedAREDLLevel.position} - {selectedAREDLLevel.name}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Level Name *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Level name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Hash className="w-4 h-4" /> Level ID *
                      </label>
                      <Input
                        value={formData.levelId}
                        onChange={(e) => handleInputChange('levelId', e.target.value)}
                        placeholder="Level ID (ex. demon ID)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" /> Creator *
                      </label>
                      <Input
                        value={formData.creator}
                        onChange={(e) => handleInputChange('creator', e.target.value)}
                        placeholder="Creator name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" /> Verifier *
                      </label>
                      <Input
                        value={formData.verifier}
                        onChange={(e) => handleInputChange('verifier', e.target.value)}
                        placeholder="Verifier name"
                      />
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Media</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Image className="w-4 h-4" /> Thumbnail URL
                    </label>
                    <Input
                      value={formData.thumbnail}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Music className="w-4 h-4" /> Song ID
                      </label>
                      <Input
                        value={formData.songId}
                        onChange={(e) => handleInputChange('songId', e.target.value)}
                        placeholder="Song ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Music className="w-4 h-4" /> Song Name
                      </label>
                      <Input
                        value={formData.songName}
                        onChange={(e) => handleInputChange('songName', e.target.value)}
                        placeholder="Song name"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Additional Information</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Description
                    </label>
                    <Input
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Level description"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Tags (comma-separated)
                    </label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="Overall, Timing, Blind"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Pack</label>
                      <Input
                        value={formData.pack}
                        onChange={(e) => handleInputChange('pack', e.target.value)}
                        placeholder="Pack name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">GDDL Tier</label>
                      <Input
                        type="number"
                        value={formData.gddlTier}
                        onChange={(e) => handleInputChange('gddlTier', e.target.value)}
                        placeholder="1-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">NLW Tier</label>
                      <Input
                        value={formData.nlwTier}
                        onChange={(e) => handleInputChange('nlwTier', e.target.value)}
                        placeholder="Tier"
                      />
                    </div>
                  </div>
                </div>

                {/* Initial Record */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Initial Record (Optional)
                    </h3>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="addRecord"
                        checked={addRecord}
                        onCheckedChange={(checked) => setAddRecord(checked as boolean)}
                      />
                      <label htmlFor="addRecord" className="text-sm text-muted-foreground">Add first completion</label>
                    </div>
                  </div>

                  {addRecord && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Player *</label>
                          <Input
                            value={record.player}
                            onChange={(e) => setRecord({ ...record, player: e.target.value })}
                            placeholder="Player name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Date *</label>
                          <Input
                            type="date"
                            value={record.date}
                            onChange={(e) => setRecord({ ...record, date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Video URL *</label>
                        <Input
                          value={record.videoUrl}
                          onChange={(e) => setRecord({ ...record, videoUrl: e.target.value })}
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">FPS</label>
                          <Input
                            value={record.fps}
                            onChange={(e) => setRecord({ ...record, fps: e.target.value })}
                            placeholder="60"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">Attempts</label>
                          <Input
                            type="number"
                            value={record.attempts || ''}
                            onChange={(e) => setRecord({ ...record, attempts: parseInt(e.target.value) || undefined })}
                            placeholder="100"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <Checkbox
                            id="cbf"
                            checked={record.cbf}
                            onCheckedChange={(checked) => setRecord({ ...record, cbf: checked as boolean })}
                          />
                          <label htmlFor="cbf" className="text-sm text-muted-foreground">CBF</label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600">
                    <Save className="w-4 h-4 mr-2" />
                    Add Level
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
