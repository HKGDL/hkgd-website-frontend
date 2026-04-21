import { Skull, Sparkles, List, Gamepad2 } from 'lucide-react';
import type { WebsiteContent, Level } from '@/types';
import { Button } from '@/components/ui/button';

interface HeroProps {
  content: WebsiteContent['hero'];
  levels: Level[];
  platformerLevels: Level[];
  onNavigate?: (page: 'home' | 'list' | 'platformer' | 'leaderboard' | 'mod') => void;
}

export function Hero({ content, levels, platformerLevels, onNavigate }: HeroProps) {
  const classicLevels = levels;

  const hardestClassic = classicLevels.length > 0
    ? classicLevels.sort((a, b) => (a.aredlRank || 9999) - (b.aredlRank || 9999))[0]
    : null;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-0">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-background to-background" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 sm:mb-8 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          <span className="text-xs sm:text-sm text-indigo-300">{content.subtitle}</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <span className="text-gradient">HKGD</span>
          <br />
          <span className="text-foreground">{content.title.replace('HKGD ', '')}</span>
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-3 sm:mb-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          {content.description}
        </p>

        {/* Disclaimer */}
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-10 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <Skull className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Rankings are based on AREDL positions. Your opinions may differ.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.5s' }}>
          {/* Classic Demons */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="text-xs text-indigo-400 uppercase tracking-wider mb-2">Classic Demons</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-indigo-300">{classicLevels.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Levels</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-indigo-300">
                  {hardestClassic ? `#${hardestClassic.aredlRank || hardestClassic.hkgdRank}` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Hardest</div>
              </div>
            </div>
          </div>

          {/* Platformer Demons */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="text-xs text-purple-400 uppercase tracking-wider mb-2">Platformer Demons</div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-300">{platformerLevels.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Levels</div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-8 sm:mt-12 animate-fadeIn" style={{ animationDelay: '0.7s' }}>
          <Button 
            onClick={() => onNavigate?.('list')}
            size="lg"
            className="bg-indigo-500 hover:bg-indigo-600 gap-2"
          >
            <List className="w-5 h-5" />
            {content.ctaButton || 'View Demon List'}
          </Button>
          
          <Button 
            onClick={() => onNavigate?.('mod')}
            size="lg"
            variant="outline"
            className="border-indigo-500/30 hover:border-indigo-500/60 gap-2"
          >
            <Gamepad2 className="w-5 h-5" />
            View HKGD Geode Mod
          </Button>
        </div>
      </div>
    </section>
  );
}