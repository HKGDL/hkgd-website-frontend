import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { LevelList } from '@/components/LevelList';
import { PlatformerList } from '@/components/PlatformerList';
import { Footer } from '@/components/Footer';
import { AdminCMSRefactored as AdminCMS } from '@/components/admin/AdminCMSRefactored';
import { DragPlatformer } from '@/components/admin/DragPlatformer';
import { SubmitRecord } from '@/components/SubmitRecord';
import { UserSettings } from '@/components/UserSettings';
import { Leaderboard } from '@/components/Leaderboard';
import { ModPage } from '@/components/ModPage';
import { SuggestionsForm } from '@/components/SuggestionsForm';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { AprilFoolsPrank } from '@/components/AprilFoolsPrank';
import { defaultContent, loadContent } from '@/data/content';
import { api } from '@/lib/api';
import type { Level, ChangelogEntry, Member, Record, PendingSubmission, WebsiteContent } from '@/types';

type Page = 'home' | 'list' | 'platformer' | 'leaderboard' | 'mod';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [levels, setLevels] = useState<Level[]>([]);
  const [platformerLevels, setPlatformerLevels] = useState<Level[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [content, setContent] = useState<WebsiteContent>(defaultContent);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrerelease, setShowPrerelease] = useState(true);

  // Load data from backend API on mount
  useEffect(() => {
    const loadData = async () => {
      const loadedContent = await loadContent();
      setContent(loadedContent);
      await loadAllData();
    };
    loadData();
  }, []);

  // Load user preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('hkgd_user_preferences');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.hidePrerelease) {
          setShowPrerelease(false);
        }
      } catch {
        // Use defaults
      }
    }
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [levelsData, platformerData, changelogData, membersData, submissionsData] = await Promise.all([
        api.getLevels(),
        api.getPlatformerLevels(),
        api.getChangelog(),
        api.getMembers(),
        api.getPendingSubmissions(),
      ]);
      setLevels(levelsData);
      setPlatformerLevels(platformerData);
      setChangelog(changelogData);
      setMembers(membersData);
      setPendingSubmissions(submissionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to format date as YY/MM/DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

const handleSubmitRecord = async (levelId: string, record: Record, levelData?: Partial<Level>) => {
    try {
      const existingLevel = levels.find(l => l.levelId === levelId);
      const isNewLevel = !existingLevel;

      const pendingSubmission: PendingSubmission = {
        id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        levelId: levelId,
        levelName: levelData?.name || existingLevel?.name || undefined,
        isNewLevel: isNewLevel,
        record: record,
        submittedAt: formatDate(new Date()),
        submittedBy: record.player,
        status: 'pending',
        levelData: levelData,
        isPlatformer: levelData?.tags?.some(t => t.toLowerCase() === 'platformer'),
        adminDecidesDifficulty: isNewLevel
      };

      console.log('Submitting record with data:', pendingSubmission);
      const result = await api.createPendingSubmission(pendingSubmission);
      console.log('Submission result:', result);
      setPendingSubmissions([...pendingSubmissions, pendingSubmission]);
      alert('Your submission has been sent for admin approval!');
    } catch (error) {
      console.error('Failed to submit record:', error);
      console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error');
      alert(`Failed to submit record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Calculate members from levels
  const recalculateMembers = (updatedLevels: Level[]) => {
    const memberMap = new Map<string, Member>();

    updatedLevels.forEach(level => {
      level.records.forEach(record => {
        const existing = memberMap.get(record.player);
        if (existing) {
          existing.levelsBeaten += 1;
        } else {
          memberMap.set(record.player, {
            name: record.player,
            levelsBeaten: 1
          });
        }
      });
    });

    const newMembers = Array.from(memberMap.values()).sort((a, b) => b.levelsBeaten - a.levelsBeaten);
    setMembers(newMembers);
    return newMembers;
  };

  const handleUpdateLevels = async (updatedLevels: Level[]) => {
    try {
      setLevels(updatedLevels);
      recalculateMembers(updatedLevels);
      
      // Sync to backend
      for (const level of updatedLevels) {
        try {
          await api.updateLevel(level.id, level);
        } catch (error) {
          console.error(`Failed to sync level ${level.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to update levels:', error);
    }
  };

  const handleUpdateMembers = (updatedMembers: Member[]) => {
    setMembers(updatedMembers);
  };

  const handleUpdatePlatformerLevels = (updatedLevels: Level[]) => {
    setPlatformerLevels(updatedLevels);
  };

  const handleUpdateChangelog = (updatedChangelog: ChangelogEntry[]) => {
    setChangelog(updatedChangelog);
  };

  const handleUpdatePending = (updatedPending: PendingSubmission[]) => {
    setPendingSubmissions(updatedPending);
  };

   const renderContent = () => {
    // Check if we're in the drag platformer window
    if (window.location.pathname === '/admin/drag-platformer') {
      return <DragPlatformer />;
    }

    switch (currentPage) {
      case 'home':
        return (
          <Hero content={content.hero} levels={levels} platformerLevels={platformerLevels} />
        );
      case 'list':
        return <LevelList levels={levels} listPage={content.listPage} changelog={changelog} />;
      case 'platformer':
        return <PlatformerList platformerPage={content.platformerPage} levels={platformerLevels} />;
      case 'leaderboard':
        return <Leaderboard levels={levels} onClose={() => handleNavigate('home')} />;
      case 'mod':
        return <ModPage />;
      default:
        return null;
    }
  };

if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading HKGD...</p>
        </div>
      </div>
    );
  }

  return (
    <AprilFoolsPrank>
      <div className="min-h-screen bg-background">
         <Header 
           onNavigate={handleNavigate} 
           currentPage={currentPage} 
           onSubmitRecord={() => setIsSubmitOpen(true)}
           onOpenAdmin={() => setIsAdminOpen(true)}
           onOpenSettings={() => setIsSettingsOpen(true)}
           onOpenLeaderboard={() => handleNavigate('leaderboard')}
         />
        
        <main className={currentPage === 'home' ? 'min-h-screen' : 'pt-20 min-h-screen'}>
          {renderContent()}
        </main>

        <Footer content={content.footer} onOpenSuggestions={() => setIsSuggestionsOpen(true)} />

        {/* Suggestions Form Modal */}
        {isSuggestionsOpen && (
          <SuggestionsForm
            levels={levels}
            onClose={() => setIsSuggestionsOpen(false)}
          />
        )}

        {/* Prerelease Alert */}
        <AlertDialog open={showPrerelease} onOpenChange={setShowPrerelease}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>🚀 HKGD Website - Prerelease</AlertDialogTitle>
              <AlertDialogDescription>
                Welcome to the HKGD website! This is currently in prerelease mode. Features and content are still being developed and may change. Thank you for your patience and support!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowPrerelease(false)}>
                Got it!
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Admin CMS */}
        {isAdminOpen && (
          <AdminCMS
            levels={levels}
            platformerLevels={platformerLevels}
            members={members}
            changelog={changelog}
            pendingSubmissions={pendingSubmissions}
            onUpdateLevels={handleUpdateLevels}
            onUpdatePlatformerLevels={handleUpdatePlatformerLevels}
            onUpdateMembers={handleUpdateMembers}
            onUpdateChangelog={handleUpdateChangelog}
            onUpdatePending={handleUpdatePending}
            onReloadData={loadAllData}
            onClose={() => setIsAdminOpen(false)}
          />
        )}

        {/* Submit Record Modal */}
        {isSubmitOpen && (
          <SubmitRecord
            levels={levels}
            onSubmit={handleSubmitRecord}
            onClose={() => setIsSubmitOpen(false)}
          />
        )}

        {/* User Settings Modal */}
        {isSettingsOpen && (
          <UserSettings onClose={() => setIsSettingsOpen(false)} />
        )}

         {/* Remove the modal leaderboard since it's now a full page */}
      </div>
    </AprilFoolsPrank>
  );
}

export default App;