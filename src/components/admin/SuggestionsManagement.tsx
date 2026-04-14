import { useState, useEffect } from 'react';
import { Lightbulb, MessageSquare, AlertCircle, Sparkles, Check, X, Clock, Wrench, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import type { Suggestion } from '@/types';

export function SuggestionsManagement() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSuggestions();
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Suggestion['status']) => {
    setUpdatingId(id);
    try {
      await api.updateSuggestion(id, { 
        status, 
        adminNotes: adminNotes[id] 
      });
      await loadSuggestions();
      setAdminNotes(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      alert(`Failed to update: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this suggestion?')) return;
    
    setUpdatingId(id);
    try {
      await api.deleteSuggestion(id);
      await loadSuggestions();
    } catch (err) {
      alert(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getTypeInfo = (type: Suggestion['type']) => {
    switch (type) {
      case 'issue':
        return { icon: AlertCircle, label: 'Issue', color: 'text-red-400', bg: 'bg-red-500/20' };
      case 'enhancement':
        return { icon: Sparkles, label: 'Enhancement', color: 'text-purple-400', bg: 'bg-purple-500/20' };
      default:
        return { icon: Lightbulb, label: 'Suggestion', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    }
  };

  const getStatusInfo = (status: Suggestion['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      case 'approved':
        return { icon: Check, label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'rejected':
        return { icon: X, label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/20' };
      case 'fixed':
        return { icon: Wrench, label: 'Fixed', color: 'text-blue-400', bg: 'bg-blue-500/20' };
      case 'in_progress':
        return { icon: Clock, label: 'In Progress', color: 'text-orange-400', bg: 'bg-orange-500/20' };
      default:
        return { icon: Clock, label: status, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Suggestions</h2>
            <p className="text-sm text-muted-foreground">View and manage user suggestions</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Suggestions</h2>
            <p className="text-sm text-muted-foreground">View and manage user suggestions</p>
          </div>
        </div>
        <div className="text-center py-12 text-destructive">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={loadSuggestions} className="mt-4">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Suggestions</h2>
            <p className="text-sm text-muted-foreground">
              {pendingCount > 0 ? `${pendingCount} pending review` : 'All caught up!'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadSuggestions}>
          Refresh
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-yellow-400/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Suggestions Yet</h3>
          <p className="text-muted-foreground max-w-md">
            When users submit feedback, issues, or suggestions, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const typeInfo = getTypeInfo(suggestion.type);
            const statusInfo = getStatusInfo(suggestion.status);
            const isExpanded = expandedId === suggestion.id;
            const isUpdating = updatingId === suggestion.id;

            return (
              <div
                key={suggestion.id}
                className={`rounded-xl border transition-all ${
                  suggestion.status === 'pending'
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-border/50 bg-muted/30'
                }`}
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${typeInfo.bg} flex items-center justify-center shrink-0`}>
                        <typeInfo.icon className={`w-4 h-4 ${typeInfo.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground truncate">{suggestion.title}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(suggestion.submittedAt)}
                          </span>
                          {suggestion.submittedBy && (
                            <span className="text-xs text-muted-foreground">
                              by {suggestion.submittedBy}
                            </span>
                          )}
                          {suggestion.levelName && (
                            <span className="text-xs text-indigo-400">
                              Level: {suggestion.levelName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4">
                    {/* Description */}
                    <div>
                      <h5 className="text-sm font-medium text-foreground mb-2">Description</h5>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">
                        {suggestion.description}
                      </p>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <h5 className="text-sm font-medium text-foreground mb-2">Admin Notes</h5>
                      <Textarea
                        value={adminNotes[suggestion.id] ?? suggestion.adminNotes ?? ''}
                        onChange={(e) => setAdminNotes(prev => ({
                          ...prev,
                          [suggestion.id]: e.target.value
                        }))}
                        placeholder="Add notes about this suggestion..."
                        className="bg-muted/30 min-h-[80px] resize-none"
                      />
                    </div>

                    {/* Resolution Info */}
                    {suggestion.resolvedAt && (
                      <div className="text-xs text-muted-foreground">
                        Resolved on {formatDate(suggestion.resolvedAt)} by {suggestion.resolvedBy}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(suggestion.id, 'approved')}
                        disabled={isUpdating}
                        className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(suggestion.id, 'fixed')}
                        disabled={isUpdating}
                        className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                      >
                        <Wrench className="w-4 h-4 mr-1" />
                        Mark Fixed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(suggestion.id, 'in_progress')}
                        disabled={isUpdating}
                        className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        In Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(suggestion.id, 'rejected')}
                        disabled={isUpdating}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(suggestion.id)}
                        disabled={isUpdating}
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}