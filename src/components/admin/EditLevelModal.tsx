import { useState } from 'react';
import { X, Save, Plus, Trash2, Edit3, Check, Music, User, Calendar, Link, Hash, FileText, Image, Tag, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { Level, Record } from '@/types';
import { api } from '@/lib/api';

interface EditLevelModalProps {
  level: Level;
  onClose: () => void;
  onSave: (updatedLevel: Level) => void;
  onDeleted?: () => void;
}

export function EditLevelModal({ level, onClose, onSave, onDeleted }: EditLevelModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'records'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingAREDL, setIsFetchingAREDL] = useState(false);
  
  // Level details state
  const [formData, setFormData] = useState({
    name: level.name,
    creator: level.creator,
    verifier: level.verifier,
    levelId: level.levelId,
    description: level.description || '',
    thumbnail: level.thumbnail || '',
    songId: level.songId || '',
    songName: level.songName || '',
    tags: level.tags.join(', '),
    pack: level.pack || '',
    gddlTier: level.gddlTier?.toString() || '',
    nlwTier: level.nlwTier || '',
  });

  // Records state
  const [records, setRecords] = useState<Record[]>(level.records);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [newRecord, setNewRecord] = useState<Partial<Record>>({
    player: '',
    date: new Date().toISOString().split('T')[0],
    videoUrl: '',
    fps: '',
    cbf: false,
    attempts: undefined,
  });
  const [showAddRecord, setShowAddRecord] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fetch level data from AREDL API using level ID
  const fetchFromAREDL = async () => {
    if (!formData.levelId) {
      alert('Please enter a Level ID first');
      return;
    }

    setIsFetchingAREDL(true);
    try {
      const aredlLevels = await api.getAREDLLevels();
      const aredlLevel = aredlLevels.find((l: any) => l.level_id?.toString() === formData.levelId.toString());
      
      if (!aredlLevel) {
        alert('Level not found in AREDL database. Check if the Level ID is correct.');
        return;
      }

      // Auto-populate form data from AREDL
      setFormData(prev => ({
        ...prev,
        name: aredlLevel.name || prev.name,
        creator: aredlLevel.creator || prev.creator,
        verifier: aredlLevel.verifier || prev.verifier,
        thumbnail: aredlLevel.thumbnail || prev.thumbnail,
        songId: aredlLevel.song?.id?.toString() || prev.songId,
        songName: aredlLevel.song?.name ? 
          `${aredlLevel.song.name}${aredlLevel.song.author ? ` by ${aredlLevel.song.author}` : ''}` : 
          prev.songName,
        description: aredlLevel.description || prev.description,
        tags: aredlLevel.tags?.join(', ') || prev.tags,
      }));

      alert(`Successfully loaded data for "${aredlLevel.name}" (AREDL #${aredlLevel.position})`);
    } catch (error) {
      console.error('Failed to fetch from AREDL:', error);
      alert(`Failed to fetch from AREDL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFetchingAREDL(false);
    }
  };

  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const updatedLevel: Partial<Level> = {
        // Preserve existing rank and date fields
        hkgdRank: level.hkgdRank,
        aredlRank: level.aredlRank,
        // Removed pemonlistRank - using manual ranking only
        // pemonlistRank: level.pemonlistRank,
        dateAdded: level.dateAdded,
        // Update editable fields
        name: formData.name,
        creator: formData.creator,
        verifier: formData.verifier,
        levelId: formData.levelId,
        description: formData.description,
        thumbnail: formData.thumbnail || undefined,
        songId: formData.songId || undefined,
        songName: formData.songName || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        pack: formData.pack || undefined,
        gddlTier: formData.gddlTier ? parseInt(formData.gddlTier) : undefined,
        nlwTier: formData.nlwTier || undefined,
      };

      await api.updateLevel(level.id, updatedLevel);
      
      onSave({
        ...level,
        ...updatedLevel,
        records,
      });
      
      alert('Level updated successfully!');
    } catch (error) {
      console.error('Failed to save level:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.player || !newRecord.date || !newRecord.videoUrl) {
      alert('Player, date, and video URL are required');
      return;
    }

    setIsSaving(true);
    try {
      const recordToAdd: Record = {
        player: newRecord.player,
        date: newRecord.date,
        videoUrl: newRecord.videoUrl,
        fps: newRecord.fps || undefined,
        cbf: newRecord.cbf || false,
        attempts: newRecord.attempts,
      };

      await api.addRecord(level.id, recordToAdd);
      
      setRecords([...records, recordToAdd]);
      setNewRecord({
        player: '',
        date: new Date().toISOString().split('T')[0],
        videoUrl: '',
        fps: '',
        cbf: false,
        attempts: undefined,
      });
      setShowAddRecord(false);
      alert('Record added successfully!');
    } catch (error) {
      console.error('Failed to add record:', error);
      alert(`Failed to add record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRecord = async (recordId: number, updates: Partial<Record>) => {
    setIsSaving(true);
    try {
      await api.updateRecord(recordId, updates);
      
      setRecords(records.map(r => 
        r.id === recordId ? { ...r, ...updates } : r
      ));
      setEditingRecordId(null);
      alert('Record updated successfully!');
    } catch (error) {
      console.error('Failed to update record:', error);
      alert(`Failed to update record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    setIsSaving(true);
    try {
      await api.deleteRecord(recordId);
      setRecords(records.filter(r => r.id !== recordId));
      alert('Record deleted successfully!');
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert(`Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLevel = async () => {
    if (!confirm('Are you sure you want to delete this level? This action cannot be undone.')) return;

    setIsSaving(true);
    try {
      await api.deleteLevel(level.id);
      alert('Level deleted successfully!');
      onDeleted?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete level:', error);
      alert(`Failed to delete level: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Edit Level</h2>
              <p className="text-sm text-muted-foreground">{level.name}</p>
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
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Level Details
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'records'
                  ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Records ({records.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Level Name
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Level name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <Hash className="w-4 h-4" /> Level ID (ex. demon ID)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.levelId}
                          onChange={(e) => handleInputChange('levelId', e.target.value)}
                          placeholder="Level ID"
                          className="flex-1"
                        />
                        {level.aredlRank && (
                          <Button
                            onClick={fetchFromAREDL}
                            disabled={isFetchingAREDL}
                            variant="outline"
                            size="icon"
                            title="Fetch data from AREDL"
                          >
                            <Download className={`w-4 h-4 ${isFetchingAREDL ? 'animate-pulse' : ''}`} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" /> Creator
                      </label>
                      <Input
                        value={formData.creator}
                        onChange={(e) => handleInputChange('creator', e.target.value)}
                        placeholder="Creator name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" /> Verifier
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

                {/* Save Button */}
                <div className="flex justify-between pt-4 border-t border-border/50">
                  <Button variant="destructive" onClick={handleDeleteLevel} disabled={isSaving}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Level
                  </Button>
                  <Button onClick={handleSaveDetails} disabled={isSaving} className="bg-indigo-500 hover:bg-indigo-600">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'records' && (
              <div className="space-y-4">
                {/* Add Record Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Completion Records
                  </h3>
                  <Button
                    onClick={() => setShowAddRecord(!showAddRecord)}
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                </div>

                {/* Add Record Form */}
                {showAddRecord && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-4">
                    <h4 className="font-medium text-foreground">New Record</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Player *</label>
                        <Input
                          value={newRecord.player}
                          onChange={(e) => setNewRecord({ ...newRecord, player: e.target.value })}
                          placeholder="Player name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Date *</label>
                        <Input
                          type="date"
                          value={newRecord.date}
                          onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Video URL *</label>
                      <Input
                        value={newRecord.videoUrl}
                        onChange={(e) => setNewRecord({ ...newRecord, videoUrl: e.target.value })}
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">FPS</label>
                        <Input
                          value={newRecord.fps}
                          onChange={(e) => setNewRecord({ ...newRecord, fps: e.target.value })}
                          placeholder="60"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Attempts</label>
                        <Input
                          type="number"
                          value={newRecord.attempts || ''}
                          onChange={(e) => setNewRecord({ ...newRecord, attempts: parseInt(e.target.value) || undefined })}
                          placeholder="100"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Checkbox
                          id="cbf"
                          checked={newRecord.cbf}
                          onCheckedChange={(checked) => setNewRecord({ ...newRecord, cbf: checked as boolean })}
                        />
                        <label htmlFor="cbf" className="text-sm text-muted-foreground">CBF</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddRecord} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600">
                        <Check className="w-4 h-4 mr-2" />
                        Add Record
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddRecord(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Records List */}
                {records.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No records yet. Add a completion record to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {records.map((record) => (
                      <RecordEditor
                        key={record.id || record.player + record.date}
                        record={record}
                        isEditing={editingRecordId === record.id}
                        onEdit={() => setEditingRecordId(record.id || null)}
                        onSave={(updates) => handleUpdateRecord(record.id!, updates)}
                        onDelete={() => handleDeleteRecord(record.id!)}
                        onCancel={() => setEditingRecordId(null)}
                        isSaving={isSaving}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Record Editor Component
interface RecordEditorProps {
  record: Record;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Record>) => void;
  onDelete: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function RecordEditor({ record, isEditing, onEdit, onSave, onDelete, onCancel, isSaving }: RecordEditorProps) {
  const [editData, setEditData] = useState<Partial<Record>>({
    player: record.player,
    date: record.date,
    videoUrl: record.videoUrl,
    fps: record.fps,
    cbf: record.cbf,
    attempts: record.attempts,
  });

  if (isEditing) {
    return (
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Player</label>
            <Input
              value={editData.player}
              onChange={(e) => setEditData({ ...editData, player: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Date</label>
            <Input
              type="date"
              value={editData.date}
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Video URL</label>
          <Input
            value={editData.videoUrl}
            onChange={(e) => setEditData({ ...editData, videoUrl: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">FPS</label>
            <Input
              value={editData.fps}
              onChange={(e) => setEditData({ ...editData, fps: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Attempts</label>
            <Input
              type="number"
              value={editData.attempts || ''}
              onChange={(e) => setEditData({ ...editData, attempts: parseInt(e.target.value) || undefined })}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox
              id={`cbf-${record.id}`}
              checked={editData.cbf}
              onCheckedChange={(checked) => setEditData({ ...editData, cbf: checked as boolean })}
            />
            <label htmlFor={`cbf-${record.id}`} className="text-sm text-muted-foreground">CBF</label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onSave(editData)} disabled={isSaving} size="sm" className="bg-indigo-500 hover:bg-indigo-600">
            <Check className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" onClick={onCancel} size="sm">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground">{record.player}</span>
            {record.cbf && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                CBF
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {record.date}
            </span>
            {record.fps && (
              <span className="flex items-center gap-1">
                {record.fps} FPS
              </span>
            )}
            {record.attempts && (
              <span>{record.attempts} attempts</span>
            )}
          </div>
          {record.videoUrl && (
            <a
              href={record.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1"
            >
              <Link className="w-3 h-3" />
              View Video
            </a>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
