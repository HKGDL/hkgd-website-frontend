import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Image, Music, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AREDLSyncProps {
  onSync: () => Promise<void>;
  onSyncDetails?: () => Promise<void>;
  onSyncPlatformerDetails?: () => Promise<void>;
  showDetailsSync?: boolean;
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export function AREDLSync({ onSync, onSyncDetails, onSyncPlatformerDetails }: AREDLSyncProps) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [message, setMessage] = useState('');
  const [detailsStatus, setDetailsStatus] = useState<SyncStatus>('idle');
  const [detailsMessage, setDetailsMessage] = useState('');
  const [timeToNextSync, setTimeToNextSync] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      
      target.setUTCHours(4, 0, 0, 0);
      if (now.getUTCHours() >= 4) {
        target.setUTCDate(target.getUTCDate() + 1);
      }
      
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeToNextSync(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setStatus('syncing');
    setMessage('Syncing with AREDL...');
    
    try {
      await onSync();
      setStatus('success');
      setMessage('Sync completed successfully!');
      
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Sync failed');
    }
  };

  const handleSyncDetails = async () => {
    if (!onSyncDetails) return;
    
    setDetailsStatus('syncing');
    setDetailsMessage('Syncing level details...');
    
    try {
      await onSyncDetails();
      setDetailsStatus('success');
      setDetailsMessage('Details synced for classic levels!');
      
      setTimeout(() => {
        setDetailsStatus('idle');
        setDetailsMessage('');
      }, 3000);
    } catch (error) {
      setDetailsStatus('error');
      setDetailsMessage(error instanceof Error ? error.message : 'Sync failed');
    }
  };

  const handleSyncPlatformerDetails = async () => {
    if (!onSyncPlatformerDetails) return;
    
    setDetailsStatus('syncing');
    setDetailsMessage('Syncing platformer details...');
    
    try {
      await onSyncPlatformerDetails();
      setDetailsStatus('success');
      setDetailsMessage('Details synced for platformer levels!');
      
      setTimeout(() => {
        setDetailsStatus('idle');
        setDetailsMessage('');
      }, 3000);
    } catch (error) {
      setDetailsStatus('error');
      setDetailsMessage(error instanceof Error ? error.message : 'Sync failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AREDL Sync</h3>
        <Button
          onClick={handleSync}
          disabled={status === 'syncing'}
          className="bg-indigo-500 hover:bg-indigo-600"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${status === 'syncing' ? 'animate-spin' : ''}`} />
          {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        <Clock className="w-4 h-4" />
        <span>Auto-sync at 12:00 PM (GMT+8) every day</span>
        <span className="ml-auto font-mono text-indigo-400">{timeToNextSync}</span>
      </div>

      <Alert>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Sync with AREDL will update all level rankings and re-sort the HKGD list based on AREDL difficulty order.
        </AlertDescription>
      </Alert>

      {message && (
        <Alert variant={status === 'success' ? 'default' : 'destructive'}>
          {status === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : status === 'error' ? (
            <XCircle className="w-4 h-4" />
          ) : null}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Level Details Sync */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Image className="w-5 h-5" />
          Level Details (History GD)
        </h3>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <Button
            onClick={handleSyncDetails}
            disabled={detailsStatus === 'syncing' || !onSyncDetails}
            variant="outline"
            className="border-blue-500/30 hover:border-blue-500/60"
          >
            <Music className={`w-4 h-4 mr-2 ${detailsStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {detailsStatus === 'syncing' ? 'Syncing...' : 'Classic Levels'}
          </Button>
          
          <Button
            onClick={handleSyncPlatformerDetails}
            disabled={detailsStatus === 'syncing' || !onSyncPlatformerDetails}
            variant="outline"
            className="border-purple-500/30 hover:border-purple-500/60"
          >
            <Music className={`w-4 h-4 mr-2 ${detailsStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {detailsStatus === 'syncing' ? 'Syncing...' : 'Platformer Levels'}
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Sync level details fetches creator, thumbnail, and songs from History GD API for rated levels.
          </AlertDescription>
        </Alert>

        {detailsMessage && (
          <Alert variant={detailsStatus === 'success' ? 'default' : 'destructive'}>
            {detailsStatus === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : detailsStatus === 'error' ? (
              <XCircle className="w-4 h-4" />
            ) : null}
            <AlertDescription>{detailsMessage}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
        <p className="font-medium text-foreground">What this does:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Fetches latest rankings from AREDL API</li>
          <li>Updates AREDL rank for all existing levels</li>
          <li>Re-sorts HKGD list by AREDL difficulty</li>
          <li>Updates all level ranks in database</li>
          <li>Creates a changelog entry</li>
        </ul>
      </div>
    </div>
  );
}