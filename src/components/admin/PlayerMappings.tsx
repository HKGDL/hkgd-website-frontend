import { useState, useEffect } from 'react';
import { User, Plus, Trash2, Edit, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { PlayerMapping } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PlayerMappings() {
  const [mappings, setMappings] = useState<PlayerMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMapping, setNewMapping] = useState({ gameName: '', dbName: '', accountId: '' as string | number });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ gameName: '', dbName: '', accountId: '' as string | number });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const data = await api.getPlayerMappings();
      setMappings(data);
    } catch (error) {
      console.error('Failed to fetch player mappings:', error);
      setErrorMessage('Failed to fetch player mappings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const handleAddMapping = async () => {
    if (!newMapping.gameName.trim() || !newMapping.dbName.trim()) {
      setErrorMessage('Both game name and database name are required');
      return;
    }

    try {
      await api.createPlayerMapping({
        gameName: newMapping.gameName,
        dbName: newMapping.dbName,
        accountId: newMapping.accountId ? Number(newMapping.accountId) : null
      });
      
      setSuccessMessage('Player mapping created successfully');
      
      // Reset form and refresh
      setNewMapping({ gameName: '', dbName: '', accountId: '' });
      fetchMappings();
    } catch (error) {
      console.error('Failed to create mapping:', error);
      setErrorMessage('Failed to create player mapping');
    }
  };

  const handleDeleteMapping = async (id: number) => {
    try {
      await api.deletePlayerMapping(id);
      setSuccessMessage('Player mapping deleted successfully');
      fetchMappings();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
      setErrorMessage('Failed to delete player mapping');
    }
  };

  const startEditing = (mapping: any) => {
    setEditingId(mapping.id);
    setEditValues({
      gameName: mapping.gameName,
      dbName: mapping.dbName,
      accountId: mapping.accountId || ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async () => {
    if (!editValues.gameName.trim() || !editValues.dbName.trim()) {
      setErrorMessage('Both game name and database name are required');
      return;
    }

    try {
      await api.createPlayerMapping({
        gameName: editValues.gameName,
        dbName: editValues.dbName,
        accountId: editValues.accountId ? Number(editValues.accountId) : null
      });
      
      setSuccessMessage('Player mapping updated successfully');
      
      setEditingId(null);
      fetchMappings();
    } catch (error) {
      console.error('Failed to update mapping:', error);
      setErrorMessage('Failed to update player mapping');
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6" />
          Player Name Mappings
        </h2>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Add New Mapping</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Map game player names to database names (e.g., "saltyuranium" → "sot")
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <Input
            placeholder="Game Name (e.g., saltyuranium)"
            value={newMapping.gameName}
            onChange={(e) => setNewMapping({...newMapping, gameName: e.target.value})}
          />
          <Input
            placeholder="Database Name (e.g., sot)"
            value={newMapping.dbName}
            onChange={(e) => setNewMapping({...newMapping, dbName: e.target.value})}
          />
          <Input
            placeholder="Account ID (optional)"
            value={newMapping.accountId}
            onChange={(e) => setNewMapping({...newMapping, accountId: e.target.value})}
            type="number"
          />
        </div>
        <Button onClick={handleAddMapping} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Mapping
        </Button>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Existing Mappings</h3>
        
        {loading ? (
          <div className="text-center py-8">Loading mappings...</div>
        ) : mappings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No player mappings found</div>
        ) : (
          <div className="space-y-3">
            {mappings.map((mapping) => (
              <div key={mapping.id} className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                {editingId === mapping.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        value={editValues.gameName}
                        onChange={(e) => setEditValues({...editValues, gameName: e.target.value})}
                      />
                      <Input
                        value={editValues.dbName}
                        onChange={(e) => setEditValues({...editValues, dbName: e.target.value})}
                      />
                      <Input
                        value={editValues.accountId}
                        onChange={(e) => setEditValues({...editValues, accountId: e.target.value})}
                        type="number"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveEditing} size="sm" className="gap-1">
                        <Save className="w-3 h-3" />
                        Save
                      </Button>
                      <Button onClick={cancelEditing} size="sm" variant="outline" className="gap-1">
                        <X className="w-3 h-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-mono font-semibold">
                        {mapping.gameName} → {mapping.dbName}
                      </div>
                      {mapping.accountId && (
                        <div className="text-sm text-gray-500">
                          Account ID: {mapping.accountId}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEditing(mapping)}
                        size="sm"
                        variant="outline"
                        className="gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteMapping(mapping.id)}
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
