import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Settings, PartyPopper } from 'lucide-react';

interface SettingsProps {
  onSettingsChange?: (key: string, value: boolean) => void;
}

export function SettingsManagement({ onSettingsChange }: SettingsProps) {
  const [aprilFoolsEnabled, setAprilFoolsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    </div>
  );
}
