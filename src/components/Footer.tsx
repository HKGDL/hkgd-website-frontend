import { useState, useEffect } from 'react';
import { Skull, ExternalLink, Heart, Tag, Loader2 } from 'lucide-react';
import type { WebsiteContent } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FooterProps {
  content: WebsiteContent['footer'];
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
}

const GITHUB_REPO_FRONTEND = 'HKGDL/hkgd-website-frontend';
const GITHUB_REPO_API = 'HKGDL/HKGD-Website-API';

export function Footer({ content }: FooterProps) {
  const [latestVersion, setLatestVersion] = useState<string>('v0.0.0');
  const [apiVersion, setApiVersion] = useState<string>('v0.0.0');
  const [isOpen, setIsOpen] = useState(false);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const [frontendRes, apiRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${GITHUB_REPO_FRONTEND}/releases`),
          fetch(`https://api.github.com/repos/${GITHUB_REPO_API}/releases`)
        ]);
        
        if (frontendRes.ok) {
          const data: GitHubRelease[] = await frontendRes.json();
          if (data.length > 0) {
            setLatestVersion(data[0].tag_name);
          }
        }
        
        if (apiRes.ok) {
          const data: GitHubRelease[] = await apiRes.json();
          if (data.length > 0) {
            setApiVersion(data[0].tag_name);
          }
        }
      } catch {
        // Silently fail, keep default version
      }
    };
    fetchVersion();
  }, []);

  const fetchReleases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_FRONTEND}/releases`);
      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }
      const data: GitHubRelease[] = await response.json();
      setReleases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load changelog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReleases();
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const parseMarkdown = (body: string) => {
    return body
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/- (.*)/g, '<li>$1</li>')
      .replace(/\n/g, '<br />');
  };

  return (
    <>
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
              <button
                onClick={() => setIsOpen(true)}
                className="text-xs text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                Frontend {latestVersion}
              </button>
              <a
                href={`https://github.com/${GITHUB_REPO_API}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                API {apiVersion}
              </a>
              <span className="text-xs text-muted-foreground">
                Not affiliated with RobTop Games
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Changelog Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-card/95 backdrop-blur-xl border-indigo-500/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Tag className="w-5 h-5 text-indigo-400" />
              Changelog
            </DialogTitle>
            <DialogDescription>
              Version history and updates from GitHub
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <p>{error}</p>
                <button 
                  onClick={fetchReleases}
                  className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 underline"
                >
                  Try again
                </button>
              </div>
            ) : releases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No releases found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {releases.map((release, index) => (
                  <div
                    key={release.id}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      index === 0
                        ? 'border-indigo-500/30 bg-indigo-500/5'
                        : 'border-border/50 bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          index === 0
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {release.tag_name}
                        </span>
                        {release.prerelease && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
                            Pre-release
                          </span>
                        )}
                      </div>
                      <a
                        href={release.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-indigo-400 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Released on {formatDate(release.published_at)}
                    </p>
                    {release.body ? (
                      <div 
                        className="text-sm text-foreground/90 leading-relaxed prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(release.body) }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No release notes provided
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="pt-4 border-t border-border/50 text-center">
            <a
              href={`https://github.com/${GITHUB_REPO_FRONTEND}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
            >
              View all releases on GitHub
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}