import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AREDLSyncProps {
  onSync: () => Promise<void>;
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export function AREDLSync({ onSync }: AREDLSyncProps) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [message, setMessage] = useState('');

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