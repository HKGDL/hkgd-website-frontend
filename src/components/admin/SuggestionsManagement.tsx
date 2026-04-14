import { Lightbulb, MessageSquare } from 'lucide-react';

export function SuggestionsManagement() {
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

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-yellow-400/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Suggestions Coming Soon</h3>
        <p className="text-muted-foreground max-w-md">
          This tab will display user-submitted suggestions for the HKGD list. 
          Feature implementation is in progress.
        </p>
      </div>
    </div>
  );
}
