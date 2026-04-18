import { useState } from 'react';
import { CheckCircle, XCircle, Video, User, Calendar, Loader2, Award, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PendingSubmission, Level } from '@/types';

interface PendingSubmissionsProps {
  submissions: PendingSubmission[];
  levels: Level[];
  onApprove: (submission: PendingSubmission) => void;
  onReject: (submissionId: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onRefresh?: () => void;
}

export function PendingSubmissions({ 
  submissions, 
  levels, 
  onApprove, 
  onReject,
  onApproveAll,
  onRejectAll,
  onRefresh
}: PendingSubmissionsProps) {
  const [approving, setApproving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleApprove = async (submission: PendingSubmission) => {
    setApproving(submission.id);
    try {
      await onApprove(submission);
    } finally {
      setApproving(null);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Pending Submissions ({submissions.length})
        </h3>
        <div className="flex gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          {submissions.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onApproveAll}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRejectAll}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject All
              </Button>
            </>
          )}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-border/50">
          <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No pending submissions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const level = levels.find(l => l.levelId === submission.levelId);
            return (
              <div
                key={submission.id}
                className="p-4 rounded-xl bg-card border border-border/50 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {submission.isNewLevel && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          New Level
                        </Badge>
                      )}
                      {submission.isPlatformer && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          🎮 Platformer
                        </Badge>
                      )}
                      {submission.adminDecidesDifficulty && (
                        <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                          👑 Admin Places
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {submission.status}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-foreground truncate">
                      {submission.levelName || submission.levelId}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {submission.record.player}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {submission.submittedAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(submission)}
                      disabled={approving === submission.id}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {approving === submission.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onReject(submission.id)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {submission.record.videoUrl && (submission.record.videoUrl.startsWith('http://') || submission.record.videoUrl.startsWith('https://')) && (
                  <a
                    href={submission.record.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 text-sm hover:underline truncate ${
                      submission.record.videoUrl.toLowerCase().includes('discord')
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-indigo-400 hover:text-indigo-300'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    {submission.record.videoUrl.toLowerCase().includes('discord') ? 'View' : 'Watch Video'}
                  </a>
                )}

                {submission.record.fps && submission.record.fps !== '0' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>•</span>
                    <span>{submission.record.fps}fps</span>
                  </div>
                )}

                {submission.record.attempts && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>•</span>
                    <span>{submission.record.attempts} attempts</span>
                  </div>
                )}

                {submission.record.cbf && (
                  <Badge variant="outline" className="text-xs bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.55.45-1 1-1s1 .45 1 1c0 .95 2.61 3.44 6.5 3.93v-2.02c-2.29-.37-4.22-2.12-4.83-4.23h2.83c.36 1.19 1.45 2.07 2.73 2.07 1.57 0 2.85-1.28 2.85-2.85s-1.28-2.85-2.85-2.85c-1.28 0-2.37.88-2.73 2.07H6.67c.61-2.11 2.54-3.86 4.83-4.23V8.07C6.05 8.56 2 11.51 2 15.93c0 4.08 3.05 7.44 7 7.93V19.93zm4-7.43c1.08 0 1.85.77 1.85 1.85s-.77 1.85-1.85 1.85-1.85-.77-1.85-1.85.77-1.85 1.85-1.85z"/>
                        <path d="M14.5 9c.83 0 1.5-.67 1.5-1.5S15.33 6 14.5 6 13 6.67 13 7.5 13.67 9 14.5 9z"/>
                      </svg>
                      <span className="font-semibold">CBF</span>
                    </div>
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}