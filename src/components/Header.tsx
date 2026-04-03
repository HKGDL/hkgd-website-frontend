import { useState, useEffect } from 'react';
import { Skull, Menu, X, Trophy, List, Upload, Gamepad2, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onNavigate: (page: 'home' | 'list' | 'platformer') => void;
  currentPage: string;
  onSubmitRecord?: () => void;
  onOpenAdmin?: () => void;
  onOpenSettings?: () => void;
  onOpenLeaderboard?: () => void;
}

export function Header({ onNavigate, currentPage, onSubmitRecord, onOpenAdmin, onOpenSettings, onOpenLeaderboard }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    
    // Navigate to home on first click
    if (newClicks === 1) {
      onNavigate('home');
    }
    
    // Trigger admin on 5th click
    if (newClicks >= 5 && onOpenAdmin) {
      onOpenAdmin();
      setLogoClicks(0);
    }
    
    // Reset clicks after 5 seconds
    setTimeout(() => {
      setLogoClicks(0);
    }, 5000);
  };

  const navItems = [
    { id: 'list', label: 'Demon List', icon: List },
    { id: 'platformer', label: 'Platformer', icon: Gamepad2 },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/90 backdrop-blur-xl border-b border-border/50'
          : 'bg-background/40 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
                <Skull className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight text-gradient">HKGD</span>
              <span className="text-[10px] text-muted-foreground leading-tight tracking-wider">DEMON LIST</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as 'list' | 'platformer')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-yellow-400 hover:bg-yellow-500/20"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </button>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {onSubmitRecord && (
              <Button
                variant="default"
                size="sm"
                onClick={onSubmitRecord}
                className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2"
              >
                <Upload className="w-4 h-4" />
                Submit
              </Button>
            )}
            {onOpenSettings && (
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenSettings}
                className="rounded-full hover:bg-muted"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fadeIn">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id as 'list' | 'platformer');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === item.id
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
              {onOpenLeaderboard && (
                <button
                  onClick={() => {
                    onOpenLeaderboard();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-yellow-400 hover:bg-yellow-500/20"
                >
                  <Trophy className="w-4 h-4" />
                  Leaderboard
                </button>
              )}
              {onSubmitRecord && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    onSubmitRecord();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Submit Record
                </Button>
              )}
              {onOpenSettings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenSettings();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-2 gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}