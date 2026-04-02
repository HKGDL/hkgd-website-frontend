import { useState, useEffect } from 'react';
import { Tag, ExternalLink, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
}

const GITHUB_REPO = 'HKGDL/hkgd-website-frontend';

export function VersionBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [latestVersion, setLatestVersion] = useState<string>('v0.0.0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReleases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`);
      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }
      const data: GitHubRelease[] = await response.json();
      setReleases(data);
      if (data.length > 0) {
        setLatestVersion(data[0].tag_name);
      }
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
    // Simple markdown parsing for basic formatting
    return body
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/- (.*)/g, '<li>$1</li>')
      .replace(/\n/g, '<br />');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 
                   bg-gradient-to-r from-indigo-500/10 to-purple-500/10 
                   hover:from-indigo-500/20 hover:to-purple-500/20
                   border border-indigo-500/30 hover:border-indigo-500/50
                   rounded-full text-sm font-medium text-muted-foreground hover:text-foreground
                   transition-all duration-300 backdrop-blur-sm
                   shadow-lg hover:shadow-indigo-500/10 group"
        title="View changelog"
      >
        <Tag className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
        <span className="text-indigo-300 group-hover:text-indigo-200 transition-colors">
          {latestVersion}
        </span>
      </button>

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
              href={`https://github.com/${GITHUB_REPO}/releases`}
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
