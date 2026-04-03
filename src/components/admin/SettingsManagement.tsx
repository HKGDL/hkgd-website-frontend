import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Settings, PartyPopper, Shield, Trash2, Clock, RefreshCw } from 'lucide-react';

interface IPBan {
  ip: string;
  attempts: number;
  bannedUntil: number;
  isCurrentlyBanned: boolean;
  remainingTime: number;
  updatedAt: number;
}

interface SettingsProps {
  onSettingsChange?: (key: string, value: boolean) => void;
}

export function SettingsManagement({ onSettingsChange }: SettingsProps) {
  const [aprilFoolsEnabled, setAprilFoolsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ipBans, setIPBans] = useState<IPBan[]>([]);
  const [isLoadingBans, setIsLoadingBans] = useState(true);
  const [unbanningIP, setUnbanningIP] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.getSettings();
        setAprilFoolsEnabled(settings.april_fools_enabled === true);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    loadIPBans();
  }, []);

  const loadIPBans = async () => {
    setIsLoadingBans(true);
    try {
      const bans = await api.getIPBans();
      setIPBans(bans);
    } catch (error) {
      console.error('Failed to load IP bans:', error);
    } finally {
      setIsLoadingBans(false);
    }
  };

  const handleUnbanIP = async (ip: string) => {
    setUnbanningIP(ip);
    try {
      await api.unbanIP(ip);
      setIPBans(prev => prev.filter(ban => ban.ip !== ip));
    } catch (error) {
      console.error('Failed to unban IP:', error);
      alert('Failed to unban IP. Please try again.');
    } finally {
      setUnbanningIP(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleToggleAprilFools = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      await api.updateSetting('april_fools_enabled', enabled);
      setAprilFoolsEnabled(enabled);
      onSettingsChange?.('april_fools_enabled', enabled);
    } catch (error) {
      console.error('Failed to update setting:', error);
      alert('Failed to update setting. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground">Configure website settings</p>
        </div>
      </div>

      {/* April Fools Prank Settings */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <PartyPopper className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg">April Fools Prank</CardTitle>
              <CardDescription>
                Enable the fake maintenance screen prank on the website
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="april-fools-toggle" className="text-base font-medium">
                Enable April Fools Prank
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, visitors will see a fake "Server Maintenance" screen with an escaping button.
                Perfect for April 1st!
              </p>
            </div>
            <Switch
              id="april-fools-toggle"
              checked={aprilFoolsEnabled}
              onCheckedChange={handleToggleAprilFools}
              disabled={isSaving}
            />
          </div>
          
          {aprilFoolsEnabled && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-sm text-orange-400">
                <strong>Active:</strong> The April Fools prank is currently enabled. 
                Visitors will see the fake maintenance screen when they visit the site.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IP Ban Management */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-lg">IP Ban Management</CardTitle>
                <CardDescription>
                  View and manage IP addresses banned from admin login
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadIPBans}
              disabled={isLoadingBans}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingBans ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingBans ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
            </div>
          ) : ipBans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No IP bans found</p>
              <p className="text-sm">IPs will appear here after failed login attempts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ipBans.map((ban) => (
                <div
                  key={ban.ip}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    ban.isCurrentlyBanned 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-muted/50 border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      ban.isCurrentlyBanned ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{ban.ip}</span>
                        {ban.isCurrentlyBanned && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                            BANNED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ban.attempts} failed attempt{ban.attempts !== 1 ? 's' : ''}
                        {ban.isCurrentlyBanned && (
                          <span className="flex items-center gap-1 mt-1 text-red-400">
                            <Clock className="w-3 h-3" />
                            {formatTime(ban.remainingTime)} remaining
                          </span>
                        )}
                        {!ban.isCurrentlyBanned && ban.bannedUntil > 0 && (
                          <span className="text-yellow-400"> (ban expired)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnbanIP(ban.ip)}
                    disabled={unbanningIP === ban.ip}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    {unbanningIP === ban.ip ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
