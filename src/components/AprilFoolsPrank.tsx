import { useState, useCallback, useRef, useEffect } from 'react';

const maintenanceReasons = [
  "Server is upgrading to a newer version of Node.js",
  "Database migration in progress",
  "SSL certificates are being renewed",
  "Our hamster wheels need more hamsters",
  "Server is learning to speak fluent JavaScript",
  "Backend is taking a coffee break",
  "Quantum computer recalibration in progress",
  "Server is having an existential crisis",
  "Cloud storage is experiencing heavy rain",
  "Packet loss recovery mode activated",
  "Server is being held hostage by bugs",
  "CPU needs more coffee beans",
  "Memory modules are meditating",
  "DNS server forgot its own name",
  "Server is at the gym working on its uptime",
  "Developer fell asleep on the keyboard",
  "Ran out of Internets, ordering more",
  "Server caught a virus (the flu kind)",
  "Windows Update decided now is a good time",
  "The algorithm is feeling emotional today",
  "Bit flips causing personality changes",
  "Server went to get milk, will be back soon",
  "Electricity bills weren't paid (just kidding... maybe)",
  "The rubber duck is on strike",
  "Server is questioning its life choices",
  "Ran out of semicolons, restocking",
  "Someone pushed to production on Friday",
  "Cache invalidation gone wrong (classic)",
  "Server is watching paint dry for inspiration",
  "Binary gods demand a sacrifice",
  "The cable guy is fixing... something",
  "Server discovered it's actually a toaster",
  "Physics engine is having a bad day",
  "The AI achieved sentience and quit",
  "Keyboard cat is taking a nap on the server",
  "Server is buffering... life choices",
  "Unexpected item in bagging area",
  "The cloud has been grounded",
  "Server is in a meeting that could've been an email",
  "Developer is debugging the debugger",
];

export function AprilFoolsPrank({ children }: { children: React.ReactNode }) {
  const [showPrank, setShowPrank] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [showGiveUp, setShowGiveUp] = useState(false);
  const [showLoserMessage, setShowLoserMessage] = useState(false);
  const [showWinnerMessage, setShowWinnerMessage] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const attemptsRef = useRef(0);

  const reason = maintenanceReasons[Math.floor(Math.random() * maintenanceReasons.length)];

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      setButtonPos({
        x: container.offsetWidth / 2 - 60,
        y: container.offsetHeight - 60
      });
    }
  }, []);

  const moveButton = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const btnWidth = 120;
    const btnHeight = 32;
    
    const maxX = container.offsetWidth - btnWidth - 10;
    const maxY = container.offsetHeight - btnHeight - 60;
    
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

  if (showWinnerMessage) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-[9999]">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
          <div className="text-6xl mb-4">😱</div>
          <h1 className="text-3xl font-bold text-green-500 mb-4">NO NO NO</h1>
          <h2 className="text-2xl text-yellow-400 mb-4">THIS IS NOT FAIR...</h2>
          <p className="text-gray-300 mb-6">NO NO NO IT IS NOT FAIR</p>
          <button
            onClick={() => {
              setShowWinnerMessage(false);
              setShowPrank(false);
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-lg"
          >
            Buton To Hell...
          </button>
        </div>
      </div>
    );
  }

  if (showLoserMessage) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-[9999]">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
          <div className="text-6xl mb-4">🤡</div>
          <h1 className="text-3xl font-bold text-red-500 mb-4">LMAO</h1>
          <h2 className="text-2xl text-white mb-4">Server 1 : 0 You</h2>
          <p className="text-gray-300 mb-6">You gave up after {attempts} attempts. The server wins this round!</p>
          <button
            onClick={() => {
              setShowLoserMessage(false);
              setShowPrank(false);
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg"
          >
            Alright let me in already...
          </button>
        </div>
      </div>
    );
  }

  if (!showPrank) return children;

  return (
    <div ref={containerRef} className="fixed inset-0 bg-gray-900 flex items-center justify-center z-[9999] overflow-hidden">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
        <div className="text-6xl mb-4">🔧</div>
        <h1 className="text-2xl font-bold text-red-500 mb-2">SERVER MAINTENANCE</h1>
        <h2 className="text-lg text-gray-400 mb-4">MAY NOT ACCESS EVERYTHING</h2>
        
        <div className="bg-gray-700 rounded-lg p-4 mb-4 text-left">
          <p className="text-yellow-400 font-medium">{reason}</p>
        </div>

        <div className="bg-gray-700 rounded-lg p-3 mb-4">
          <p className="text-gray-300 text-sm">
            We apologize for the inconvenience. Our team of highly trained hamsters is working around the clock to restore service.
          </p>
        </div>

        {attempts > 0 && (
          <p className="text-gray-500 text-sm">
            Button escaped {attempts} time{attempts > 1 ? 's' : ''}... 
            {attempts > 20 && " (you're persistent!)"}
            {attempts > 50 && " (okay this is impressive)"}
            {attempts > 75 && " (just give up already)"}
          </p>
        )}

        {attempts >= 50 && !showGiveUp && (
          <button
            onClick={() => setShowGiveUp(true)}
            className="mt-4 px-3 py-1 text-xs bg-gray-600 text-gray-400 rounded hover:bg-gray-500"
          >
            ...I give up
          </button>
        )}
      </div>

      <button
        onMouseEnter={handleMouseEnter}
        onClick={handleButtonClick}
        className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded 
          hover:from-purple-600 hover:to-pink-600 shadow-lg cursor-pointer fixed z-[10000]"
        style={{
          left: `${buttonPos.x}px`,
          top: `${buttonPos.y}px`,
          transition: 'left 0.12s ease-out, top 0.12s ease-out'
        }}
      >
        Nevermind continue
      </button>

      {showGiveUp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001]">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <p className="text-gray-300 mb-4">Are you sure you want to give up? 😈</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleGiveUp}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Yes, I give up
              </button>
              <button
                onClick={() => setShowGiveUp(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                No, I'll keep trying
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
