import { useState, useEffect } from 'react';
import { X, Lock, AlertTriangle, ShieldAlert, Clock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';

interface AdminAuthProps {
  onLogin: (password: string) => void;
  onClose: () => void;
  passwordError: boolean;
  isBanned?: boolean;
  banRemainingTime?: number;
  attemptsRemaining?: number;
}

export function AdminAuth({ 
  onLogin, 
  onClose, 
  passwordError,
  isBanned = false,
  banRemainingTime,
  attemptsRemaining 
}: AdminAuthProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await api.login(password);
      if (result.success) {
        onLogin(password);
        setPassword('');
      } else {
        // Let parent handle the error
        onLogin(password);
      }
    } catch (error) {
      console.error('Login failed:', error);
      onLogin(password); // Let parent handle the error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border/50 p-8 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            {isBanned ? (
              <ShieldAlert className="w-8 h-8 text-red-400" />
            ) : (
              <Lock className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isBanned ? 'IP Banned' : 'Admin Access'}
          </h2>
          <p className="text-muted-foreground">
            {isBanned 
              ? 'Too many failed login attempts'
              : 'Enter password to manage the list'}
          </p>
        </div>
        
        {isBanned && banRemainingTime !== undefined && (
          <Alert variant="destructive" className="mb-6">
            <Clock className="w-4 h-4" />
            <AlertDescription>
              Your IP has been temporarily banned. Please try again in{' '}
              {Math.floor(banRemainingTime / 60)} minutes {banRemainingTime % 60} seconds.
            </AlertDescription>
          </Alert>
        )}

        {!isBanned && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                className="bg-muted/50 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordError && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Incorrect password
                  {attemptsRemaining !== undefined && attemptsRemaining > 0 && (
                    <span> - {attemptsRemaining} attempts remaining</span>
                  )}
                  {attemptsRemaining === 0 && (
                    <span> - IP will be banned on next attempt</span>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <Button 
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-600"
              disabled={isLoading}
            >
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? 'Verifying...' : 'Login'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}