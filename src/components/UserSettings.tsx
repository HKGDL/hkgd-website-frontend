import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { X, Moon, Sun, Monitor, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface UserSettingsProps {
  onClose: () => void;
}

interface UserPreferences {
  reduceMotion: boolean;
  hidePrerelease: boolean;
}

const defaultPreferences: UserPreferences = {
  reduceMotion: false,
  hidePrerelease: false,
};

export function UserSettings({ onClose }: UserSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('hkgd_user_preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch {
        // Use defaults if parsing fails
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  const savePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('hkgd_user_preferences', JSON.stringify(newPrefs));
    
    // Apply reduce motion preference
    if (newPrefs.reduceMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
    }
  };

  const handleReduceMotionChange = (checked: boolean) => {
    savePreferences({ ...preferences, reduceMotion: checked });
  };

  const handleHidePrereleaseChange = (checked: boolean) => {
    savePreferences({ ...preferences, hidePrerelease: checked });
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Settings</h2>
              <p className="text-sm text-muted-foreground">Customize your experience</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Appearance</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-xs font-medium">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-xs font-medium">Dark</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  theme === 'system'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <span className="text-xs font-medium">System</span>
              </button>
            </div>
          </div>

          <Separator />

          {/* Preferences */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Preferences</Label>
            
            {/* Reduce Motion */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduce-motion" className="text-sm">Reduce Motion</Label>
                <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
              </div>
              <Switch
                id="reduce-motion"
                checked={preferences.reduceMotion}
                onCheckedChange={handleReduceMotionChange}
              />
            </div>

            {/* Hide Prerelease Banner */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hide-prerelease" className="text-sm">Hide Prerelease Banner</Label>
                <p className="text-xs text-muted-foreground">Don't show the prerelease warning on load</p>
              </div>
              <Switch
                id="hide-prerelease"
                checked={preferences.hidePrerelease}
                onCheckedChange={handleHidePrereleaseChange}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <Button
            onClick={onClose}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook to access user preferences from other components
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    const saved = localStorage.getItem('hkgd_user_preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch {
        // Use defaults
      }
    }
  }, []);

  return preferences;
}
