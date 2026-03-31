import { useState, useCallback, useRef, useEffect } from 'react';
import { Skull, Zap, AlertTriangle, Sparkles } from 'lucide-react';

const maintenanceReasons = [
  "Server is taking a NAP"
  "Syncing with the demon portal...",
  "Recalibrating difficulty rankings...",
  "The verifier is taking a coffee break...",
  "Upgrading to Geometry Dash 2.3 ... just kidding",
  "Server is attempting Bloodlust...",
  "Hamster-powered CPU needs more hamsters",
  "Quantum demon physics recalibration",
  "Server is questioning its AREDL ranking",
  "Cloud storage experiencing heavy demon energy",
  "CPU went to practice timings",
  "Server got stuck on a wave part",
  "Memory modules are buffering a recording",
  "Server is selecting the 8 keys"
  "Server is trying Heliopolis for the 10000 bounty"
  "DNS server forgot its click pattern",
  "Server is grinding for stars",
  "Developer fell asleep during verification",
  "Ran out of attempts, starting over...",
  "Server is having an existential crisis on level 1",
  "Someone pushed to production on April 1st",
  "Cache invalidation gone wrong (classic)",
  "Server is watching a vibing level for inspiration",
  "Binary gods demand more FPS",
  "The rubber duck quit the team",
  "Server discovered it's actually a platformer",
  "Keyboard cat is beating the demon list",
  "Server is questioning its skill issue",
  "Ran out of nervs, restocking",
  "Unexpected nerf in the gameplay",
  "Server is stuck at 98%... again",
  "Physics engine hit a spike",
  "The AI achieved sentience and started playing GD",
];

export function AprilFoolsPrank({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [showPrank, setShowPrank] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [showGiveUp, setShowGiveUp] = useState(false);
  const [showLoserMessage, setShowLoserMessage] = useState(false);
  const [showWinnerMessage, setShowWinnerMessage] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const attemptsRef = useRef(0);

  const reason = maintenanceReasons[Math.floor(Math.random() * maintenanceReasons.length)];

  // Check if April Fools is enabled from API
  useEffect(() => {
    const checkSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          setIsEnabled(settings.april_fools_enabled === true);
        } else {
          setIsEnabled(false);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setIsEnabled(false);
      }
    };
    checkSettings();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      setButtonPos({
        x: container.offsetWidth / 2 - 60,
        y: container.offsetHeight - 80
      });
    }
  }, [isEnabled]);

  const moveButton = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const btnWidth = 140;
    const btnHeight = 40;
    
    const maxX = container.offsetWidth - btnWidth - 20;
    const maxY = container.offsetHeight - btnHeight - 80;
    
    const newX = Math.random() * maxX;
    const newY = Math.random() * maxY;
    
    setButtonPos({ x: newX, y: newY });
    setAttempts(prev => prev + 1);
    attemptsRef.current += 1;
  }, []);

  const handleMouseEnter = useCallback(() => {
    moveButton();
  }, [moveButton]);

  const handleButtonClick = () => {
    if (attemptsRef.current < 10) {
      setShowWinnerMessage(true);
    } else {
      setShowPrank(false);
    }
  };

  const handleGiveUp = () => {
    setShowLoserMessage(true);
  };

  // Still loading settings
  if (isEnabled === null) {
    return children;
  }

  // April Fools is disabled
  if (!isEnabled) {
    return children;
  }

  if (showWinnerMessage) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999] overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 bg-card/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl shadow-indigo-500/20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 mb-4">
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Wait What?!
          </h1>
          <h2 className="text-xl text-yellow-400 mb-4">You actually clicked it?!</h2>
          <p className="text-muted-foreground mb-6">No No No That Is Not Fair...</p>
          <button
            onClick={() => {
              setShowWinnerMessage(false);
              setShowPrank(false);
            }}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-indigo-500/25"
          >
            Enter the Demon List
          </button>
        </div>
      </div>
    );
  }

  if (showLoserMessage) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999] overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 bg-card/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl shadow-red-500/20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 mb-4">
            <Skull className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-red-400 mb-2">Skill Issue Detected</h1>
          <h2 className="text-xl text-muted-foreground mb-4">Server 1 - 0 You</h2>
          <p className="text-muted-foreground mb-2">You gave up after {attempts} attempts.</p>
          <p className="text-sm text-muted-foreground mb-6">You Cant Even Beat a Demon LMAO</p>
          <button
            onClick={() => {
              setShowLoserMessage(false);
              setShowPrank(false);
            }}
            className="px-6 py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-300 font-semibold rounded-xl hover:from-red-500/30 hover:to-orange-500/30 transition-all duration-300"
          >
            Fine, let me in...
          </button>
        </div>
      </div>
    );
  }

  if (!showPrank) return children;

  return (
    <div ref={containerRef} className="fixed inset-0 bg-background flex items-center justify-center z-[9999] overflow-hidden">
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

      {/* Main Content */}
      <div className="relative z-10 bg-card/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 text-center shadow-2xl shadow-indigo-500/20">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-4">
          <AlertTriangle className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          SERVER MAINTENANCE
        </h1>
        <h2 className="text-sm sm:text-base text-muted-foreground mb-4">
          The List Is Fucked Up 
        </h2>
        
        <div className="bg-muted/50 rounded-xl p-4 mb-4 text-left border border-indigo-500/10">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-indigo-300">{reason}</p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl p-3 mb-4 border border-indigo-500/10">
          <p className="text-xs sm:text-sm text-muted-foreground">
            White Emerald is working with some AI to restore service. 
            Please try again later... or don't.
          </p>
        </div>

        {attempts > 0 && (
          <p className="text-xs text-muted-foreground mb-2">
            Button escaped {attempts} time{attempts > 1 ? 's' : ''}... 
            {attempts > 10 && " (Skillless!)"}
            {attempts > 30 && " (impressive!)"}
            {attempts > 50 && " (seriously?)"}
            {attempts > 75 && " (just Give Up already!)"}
          </p>
        )}

        {attempts >= 50 && !showGiveUp && (
          <button
            onClick={() => setShowGiveUp(true)}
            className="mt-2 px-3 py-1 text-xs bg-muted/50 text-muted-foreground rounded-lg hover:bg-muted transition-colors border border-indigo-500/10"
          >
            ...I give up
          </button>
        )}
      </div>

      {/* Escaping Button */}
      <button
        onMouseEnter={handleMouseEnter}
        onClick={handleButtonClick}
        className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl 
          hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25 cursor-pointer fixed z-[10000] transition-all duration-100"
        style={{
          left: `${buttonPos.x}px`,
          top: `${buttonPos.y}px`,
        }}
      >
        Enter anyway
      </button>

      {showGiveUp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001]">
          <div className="bg-card border border-indigo-500/30 p-6 rounded-2xl text-center shadow-2xl shadow-indigo-500/20">
            <p className="text-muted-foreground mb-4">Are you sure you want to give up?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleGiveUp}
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-500/30 transition-colors"
              >
                Yes, I give up
              </button>
              <button
                onClick={() => setShowGiveUp(false)}
                className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl hover:bg-indigo-500/30 transition-colors"
              >
                I Wont Give Up.
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
