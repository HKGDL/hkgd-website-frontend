import { useState } from 'react';
import { X, Lightbulb, AlertCircle, Sparkles, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import type { Level } from '@/types';

interface SuggestionsFormProps {
  levels: Level[];
  onClose: () => void;
}

export function SuggestionsForm({ levels, onClose }: SuggestionsFormProps) {
  const [type, setType] = useState<'issue' | 'enhancement' | 'suggestion'>('issue');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [levelId, setLevelId] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedLevel = levels.find(l => l.levelId === levelId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.createSuggestion({
        type,
        title: title.trim(),
        description: description.trim(),
        levelId: levelId || undefined,
        levelName: selectedLevel?.name || undefined,
        submittedBy: submittedBy.trim() || undefined,
      });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit suggestion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions: Array<{ value: 'issue' | 'enhancement' | 'suggestion'; label: string; icon: typeof AlertCircle; color: string; bg: string; description: string }> = [
    { value: 'issue', label: 'Issue', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20', description: 'Report a bug or problem' },
    { value: 'enhancement', label: 'Enhancement', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/20', description: 'Improve existing feature' },
    { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/20', description: 'New idea or request' },
  ];

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border/50 overflow-hidden animate-fadeIn p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Thank You!</h2>
          <p className="text-muted-foreground">
            Your {type} has been submitted successfully. Our team will review it shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border/50 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Submit Feedback</h2>
              <p className="text-sm text-muted-foreground">Help us improve HKGD</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`p-3 rounded-xl border transition-all ${
                    type === option.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-border/50 hover:border-border bg-muted/30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${option.bg} flex items-center justify-center mx-auto mb-2`}>
                    <option.icon className={`w-4 h-4 ${option.color}`} />
                  </div>
                  <p className="text-sm font-medium text-foreground">{option.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Title <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your feedback"
              className="bg-muted/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description <span className="text-red-400">*</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe your issue or suggestion in detail..."
              className="bg-muted/30 min-h-[120px] resize-none"
            />
          </div>

          {/* Related Level (Optional) */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Related Level <span className="text-muted-foreground">(Optional)</span>
            </label>
            <select
              value={levelId}
              onChange={(e) => setLevelId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">Select a level...</option>
              {levels.map((level) => (
                <option key={level.levelId} value={level.levelId}>
                  #{level.hkgdRank} - {level.name}
                </option>
              ))}
            </select>
          </div>

          {/* Your Name (Optional) */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Your Name <span className="text-muted-foreground">(Optional)</span>
            </label>
            <Input
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="GD username (optional)"
              className="bg-muted/30"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
