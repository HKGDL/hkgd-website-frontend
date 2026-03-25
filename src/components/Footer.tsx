import { Skull, ExternalLink, Heart, Shield } from 'lucide-react';
import type { WebsiteContent } from '@/types';

interface FooterProps {
  content: WebsiteContent['footer'];
}

export function Footer({ content }: FooterProps) {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Skull className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-gradient">HKGD</span>
                <span className="text-xs text-muted-foreground block">Demon List</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://aredl.net/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  AREDL (Reference)
                </a>
              </li>
              <li>
                <a 
                  href="https://gdbrowser.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  GDBrowser
                </a>
              </li>
              <li>
                <a 
                  href="https://geometrydash.fandom.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  GD Wiki
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Heart className="w-4 h-4 text-red-400" />
            {content.credits}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Not affiliated with RobTop Games
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
