import { useState, useEffect } from 'react';
import { Download, ExternalLink, Gamepad2, CheckCircle, AlertCircle, Loader2, Github, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: {
    id: number;
    name: string;
    browser_download_url: string;
    size: number;
    content_type: string;
  }[];
}

const GITHUB_REPO = 'HKGDL/hkgdl-geode-mod';

export function ModPage() {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelease = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (!response.ok) {
          throw new Error('Failed to fetch release');
        }
        const data: GitHubRelease = await response.json();
        setRelease(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load release');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRelease();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const geodeAsset = release?.assets.find(a => a.name.endsWith('.geode'));

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-lg shadow-indigo-500/30">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-4">HKGD Geode Mod</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Integrate the HKGD Demon List directly into Geometry Dash! View demon rankings, victors, and level info from within the game.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-indigo-400" />
              </div>
              <CardTitle className="text-lg">Auto Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatically detects when you're viewing a level on the HKGD list
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-2">
                <Gamepad2 className="w-5 h-5 text-purple-400" />
              </div>
              <CardTitle className="text-lg">In-Game Victors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View all victors with their rank, username, and completion date
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-2">
                <Download className="w-5 h-5 text-green-400" />
              </div>
              <CardTitle className="text-lg">Easy Install</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Download and install directly through Geode mod loader
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Download Section */}
        <Card className="bg-card/50 border-border/50 mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <FileCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Download Latest Release</CardTitle>
                <CardDescription>
                  {isLoading ? 'Loading...' : release ? `Version ${release.tag_name} • Released ${formatDate(release.published_at)}` : 'No release found'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open(`https://github.com/${GITHUB_REPO}/releases`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on GitHub
                </Button>
              </div>
            ) : release && geodeAsset ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Download className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium">{geodeAsset.name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(geodeAsset.size)}</p>
                      </div>
                    </div>
                    <Button
                      className="bg-indigo-500 hover:bg-indigo-600 text-white"
                      onClick={() => window.open(geodeAsset.browser_download_url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                {release.body && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="font-medium mb-2">Release Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{release.body}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No download available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        <Card className="bg-card/50 border-border/50 mb-8">
          <CardHeader>
            <CardTitle>Installation Instructions</CardTitle>
            <CardDescription>How to install the HKGD Geode mod</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-medium">1</span>
                <div>
                  <p className="font-medium">Install Geode</p>
                  <p className="text-sm text-muted-foreground">
                    Download and install <a href="https://geode-sdk.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Geode mod loader</a> for Geometry Dash
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-medium">2</span>
                <div>
                  <p className="font-medium">Download the Mod</p>
                  <p className="text-sm text-muted-foreground">
                    Click the download button above or get it from GitHub releases
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-medium">3</span>
                <div>
                  <p className="font-medium">Install the Mod</p>
                  <p className="text-sm text-muted-foreground">
                    Place the <code className="bg-muted px-1 py-0.5 rounded">.geode</code> file in your Geometry Dash <code className="bg-muted px-1 py-0.5 rounded">mods</code> folder
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-medium">4</span>
                <div>
                  <p className="font-medium">Restart the Game</p>
                  <p className="text-sm text-muted-foreground">
                    Restart Geometry Dash and the mod will be loaded automatically
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* GitHub Link */}
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.open(`https://github.com/${GITHUB_REPO}`, '_blank')}
            className="gap-2"
          >
            <Github className="w-5 h-5" />
            View on GitHub
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
