import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Upload, 
  User, 
  Calendar, 
  Monitor, 
  Target, 
  CheckSquare,
  Video,
  AlertCircle,
  Search,
  Crown,
  Music,
  Trophy,
  Gamepad2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { Level, Record } from '@/types';

interface AREDLLevelData {
  id: number;
  position: number;
  name: string;
  requirement?: number;
  video?: string;
  thumbnail?: string;
  publisher?: { id: number; name: string; banned: boolean };
  verifier?: { id: number; name: string; banned: boolean };
  level_id: number;
  song?: { id: number; name: string; author: string };
  tags?: string[];
  description?: string;
}

interface SubmitRecordProps {
  levels: Level[];
  onSubmit: (levelId: string, record: Record, levelData?: Partial<Level>) => void;
  onClose: () => void;
}

export function SubmitRecord({ levels, onSubmit, onClose }: SubmitRecordProps) {
  const [demonListType, setDemonListType] = useState<'classic' | 'platformer'>('classic');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedLevelData, setSelectedLevelData] = useState<AREDLLevelData | null>(null);
  const [isOtherLevel, setIsOtherLevel] = useState(false);
  const [otherLevelName, setOtherLevelName] = useState('');
  const [otherLevelId, setOtherLevelId] = useState('');
  
  const [playerName, setPlayerName] = useState('');
  const [date, setDate] = useState('');
  const [fps, setFps] = useState('');
  const [cbf, setCbf] = useState(false);
  const [attempts, setAttempts] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // API fetch states
  const [isLoadingLevel, setIsLoadingLevel] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingAREDLLevels, setIsLoadingAREDLLevels] = useState(false);
  const [aredlLevelsList, setAredlLevelsList] = useState<AREDLLevelData[]>([]);
  const [isLoadingPlatformerDemons, setIsLoadingPlatformerDemons] = useState(false);
  const [platformerDemonsList, setPlatformerDemonsList] = useState<any[]>([]);
  const [instantSearchResults, setInstantSearchResults] = useState<AREDLLevelData[]>([]);
  const [isInstantSearching, setIsInstantSearching] = useState(false);

  // Fetch AREDL levels on component mount and when demon list type changes
  useEffect(() => {
    if (demonListType === 'classic') {
      // Clear cached data to force fresh fetch
      setAredlLevelsList([]);
      // Clear any previously selected platformer level data
      setSelectedLevelData(null);
      setSelectedLevelId('');
      setSearchResults([]);
      setSearchQuery('');
      setInstantSearchResults([]);
      const fetchAREDLLevels = async () => {
        setIsLoadingAREDLLevels(true);
        try {
          // Add timestamp to prevent any caching
          const data = await api.getAREDLLevels();
          setAredlLevelsList(data);
        } catch (err) {
          console.error('Failed to fetch AREDL levels:', err);
        } finally {
          setIsLoadingAREDLLevels(false);
        }
      };
      fetchAREDLLevels();
    }
  }, [demonListType]);

  // Fetch Platformer demons when selected
  useEffect(() => {
    if (demonListType === 'platformer') {
      // Clear any previously selected classic level data
      setSelectedLevelData(null);
      setSelectedLevelId('');
      setSearchResults([]);
      setSearchQuery('');
      setInstantSearchResults([]);
      const fetchPlatformerDemons = async () => {
        setIsLoadingPlatformerDemons(true);
        try {
          const data = await api.getPlatformerDemons();
          setPlatformerDemonsList(data.data || []);
        } catch (err) {
          console.error('Failed to fetch platformer demons:', err);
        } finally {
          setIsLoadingPlatformerDemons(false);
        }
      };
      fetchPlatformerDemons();
    }
  }, [demonListType]);

  // Instant search with debouncing - fetches fresh data from AREDL API
  useEffect(() => {
    if (demonListType === 'classic' && searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(async () => {
        setIsInstantSearching(true);
        try {
          const timestamp = Date.now();
          const response = await fetch(`https://api.aredl.net/v2/api/aredl/levels?_nocache=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          const data = await response.json();
          const query = searchQuery.toLowerCase();
          const results = data.filter((l: AREDLLevelData) =>
            l.name.toLowerCase().includes(query) ||
            l.level_id.toString().includes(query)
          );
          setInstantSearchResults(results);
        } catch (err) {
          console.error('Failed to fetch instant search results:', err);
        } finally {
          setIsInstantSearching(false);
        }
      }, 300); // 300ms debounce
      return () => clearTimeout(timeoutId);
    } else {
      setInstantSearchResults([]);
    }
  }, [searchQuery, demonListType]);

  // Combine HKGD levels and AREDL levels for search
  const hkgdLevels = useMemo(() => {
    return levels.map(l => ({ rank: l.aredlRank || 9999, name: l.name, id: l.levelId, isHKGD: true }))
      .sort((a, b) => a.rank - b.rank);
  }, [levels]);

  const allLevels = useMemo(() => {
    if (demonListType === 'classic') {
      const aredl = aredlLevelsList.map(l => ({ rank: l.position, name: l.name, id: l.level_id.toString(), isHKGD: false, position: l.position }));
      // Combine and deduplicate by ID, preferring HKGD levels
      const levelMap = new Map();
      [...hkgdLevels, ...aredl].forEach(level => {
        if (!levelMap.has(level.id)) {
          levelMap.set(level.id, level);
        }
      });
      return Array.from(levelMap.values()).sort((a, b) => a.rank - b.rank).map((level, index) => ({ ...level, displayRank: index + 1 }));
    } else {
      // Platformer demons
      const platformer = platformerDemonsList.map(l => ({ 
        rank: l.placement, 
        name: l.name, 
        id: l.level_id.toString(), 
        isHKGD: false, 
        position: l.placement,
        placement: l.placement,
        creator: l.creator,
        verifier: l.verifier.name
      }));
      return platformer.sort((a, b) => a.rank - b.rank).map((level, index) => ({ ...level, displayRank: index + 1 }));
    }
  }, [hkgdLevels, aredlLevelsList, platformerDemonsList, demonListType]);

  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return allLevels.slice(0, 20);

    const query = searchQuery.toLowerCase();

    // Filter from local allLevels (includes HKGD + AREDL cached data)
    const localResults = allLevels.filter(level =>
      level.name.toLowerCase().includes(query) ||
      level.id.toString().includes(query)
    );

    // Add instant search results from AREDL API, avoiding duplicates
    const instantResults = instantSearchResults.map(l => ({
      rank: l.position,
      name: l.name,
      id: l.level_id.toString(),
      isHKGD: false,
      position: l.position,
      displayRank: l.position
    }));

    // Combine and deduplicate by ID
    const levelMap = new Map();
    [...localResults, ...instantResults].forEach(level => {
      if (!levelMap.has(level.id)) {
        levelMap.set(level.id, level);
      }
    });

    return Array.from(levelMap.values()).sort((a, b) => a.rank - b.rank).slice(0, 50);
  }, [allLevels, searchQuery, instantSearchResults]);

  // Fetch level from AREDL API
  const fetchLevelFromAPI = async (searchTerm: string) => {
    setIsLoadingLevel(true);
    setApiError(null);
    
    try {
      // Check if search term is numeric (level ID) or text (level name)
      const isNumeric = /^\d+$/.test(searchTerm);
      
      if (demonListType === 'platformer') {
        // Handle platformer demons using Pemonlist API
        if (isNumeric) {
          // Search by level ID in Pemonlist
          const level = platformerDemonsList.find(l => l.level_id.toString() === searchTerm);
          if (level) {
            let creator = level.creator;
            let verifier = level.verifier.name;

            // Fetch additional data from GDBrowser
            let song = undefined;
            try {
              const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${level.level_id}`, {
                signal: AbortSignal.timeout(10000)
              });
              if (gdbResponse.ok) {
                const gdbData = await gdbResponse.json();
                if (gdbData.songName && gdbData.songAuthor) {
                  song = {
                    id: parseInt(gdbData.customSong || '0'),
                    name: gdbData.songName,
                    author: gdbData.songAuthor
                  };
                }
              }
            } catch (gdbError) {
              console.warn('Failed to fetch song from GDBrowser:', gdbError);
            }

            setSelectedLevelData({
              id: level.level_id,
              name: level.name,
              position: level.placement,
              video: `https://www.youtube.com/watch?v=${level.video_id}`,
              verifier: { id: 0, name: verifier, banned: false },
              publisher: { id: 0, name: creator, banned: false },
              level_id: level.level_id,
              song: song,
              tags: ['Platformer']
            });
            setSelectedLevelId(searchTerm);
            return;
          }

          // Fallback to GDBrowser for platformer level ID
          const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${searchTerm}`, {
            signal: AbortSignal.timeout(10000)
          });
          if (!gdbResponse.ok) {
            throw new Error('Platformer level not found');
          }
          const gdbData = await gdbResponse.json();

          if (!gdbData.name) {
            throw new Error('Level data not available');
          }

          setSelectedLevelData({
            id: parseInt(gdbData.id),
            name: gdbData.name,
            position: 0,
            verifier: undefined,
            publisher: { id: 0, name: gdbData.author || 'Unknown', banned: false },
            level_id: parseInt(gdbData.id),
            song: {
              id: parseInt(gdbData.customSong || '0'),
              name: gdbData.songName,
              author: gdbData.songAuthor
            },
            tags: ['Platformer']
          });
          setSelectedLevelId(searchTerm);
        } else {
          // Search by level name in Pemonlist
          const results = platformerDemonsList.filter(l => 
            l.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (results.length > 0) {
            setSearchResults(results);
            return;
          }

          // Fallback to GDBrowser for platformer level name
          const gdbResponse = await fetch(`https://gdbrowser.com/api/search?q=${encodeURIComponent(searchTerm)}`, {
            signal: AbortSignal.timeout(10000)
          });
          if (!gdbResponse.ok) {
            throw new Error('Platformer level not found');
          }
          const gdbData = await gdbResponse.json();

          if (!gdbData.length || !gdbData[0].name) {
            throw new Error('No platformer levels found with that name');
          }

          const level = gdbData[0];
          setSelectedLevelData({
            id: parseInt(level.id),
            name: level.name,
            position: 0,
            verifier: undefined,
            publisher: { id: 0, name: level.author || 'Unknown', banned: false },
            level_id: parseInt(level.id),
            song: {
              id: parseInt(level.customSong || '0'),
              name: level.songName,
              author: level.songAuthor
            },
            tags: ['Platformer']
          });
          setSelectedLevelId(level.id.toString());
        }
      } else {
        // Handle classic extreme demons using AREDL API
        if (isNumeric) {
          // Search by level ID in AREDL list
          const level = aredlLevelsList.find(l => l.level_id.toString() === searchTerm);
          if (level) {
            let creator = 'Unknown';
            let verifier = 'Unknown';

            // For levels below rank 150 (position > 150), fetch creator from GDBrowser instead of Pointercrate
            if (level.position > 150) {
              try {
                const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${level.level_id}`);
                if (gdbResponse.ok) {
                  const gdbData = await gdbResponse.json();
                  creator = gdbData.author || 'Unknown';
                }
              } catch (gdbError) {
                console.warn('Failed to fetch creator from GDBrowser:', gdbError);
              }
              verifier = undefined; // No verifier for levels below 150
            } else {
              // For levels 1-150 (top 150), fetch creator and verifier from Pointercrate
              try {
                const pcResponse = await fetch(`https://pointercrate.com/api/v2/demons/?name_contains=${encodeURIComponent(level.name)}`);
                if (pcResponse.ok) {
                  const pcData = await pcResponse.json();
                  if (pcData.length > 0) {
                    const pcLevel = pcData[0];
                    creator = pcLevel.publisher?.name || 'Unknown';
                    verifier = pcLevel.verifier?.name || 'Unknown';
                  }
                }
              } catch (pcError) {
                console.warn('Failed to fetch from Pointercrate:', pcError);
              }
            }

            // Fetch song from GDBrowser
            let song = undefined;
            try {
              const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${level.level_id}`);
              if (gdbResponse.ok) {
                const gdbData = await gdbResponse.json();
                if (gdbData.songName && gdbData.songAuthor) {
                  song = {
                    id: parseInt(gdbData.customSong || '0'),
                    name: gdbData.songName,
                    author: gdbData.songAuthor
                  };
                }
              }
            } catch (gdbError) {
              console.warn('Failed to fetch song from GDBrowser:', gdbError);
            }

            setSelectedLevelData({
              id: level.level_id,
              name: level.name,
              position: level.position,
              video: level.video,
              verifier: verifier ? { id: 0, name: verifier, banned: false } : undefined,
              publisher: { id: 0, name: creator, banned: false },
              level_id: level.level_id,
              song: song,
              tags: level.tags || ['Overall']
            });
            setSelectedLevelId(searchTerm);
            return;
          }

          // Fallback to GDBrowser API for level ID
          const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${searchTerm}`, {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          if (!gdbResponse.ok) {
            throw new Error('Level not found');
          }
          const gdbData = await gdbResponse.json();

          if (!gdbData.name) {
            throw new Error('Level data not available');
          }

          // Try to find the level in AREDL list to get position
          const aredlLevel = aredlLevelsList.find(l => l.level_id.toString() === searchTerm);
          const position = aredlLevel?.position || 0;

          // For levels below rank 150 (position > 150), only fetch creator from GDBrowser, no verifier
          // For levels 1-150 (top 150) or unknown rank, try to fetch from Pointercrate
          let creator = gdbData.author || 'Unknown';
          let verifier = undefined;

          if (position <= 150 && position > 0) {
            try {
              const pcResponse = await fetch(`https://pointercrate.com/api/v2/demons/?name_contains=${encodeURIComponent(gdbData.name)}`, {
                signal: AbortSignal.timeout(10000) // 10 second timeout
              });
              if (pcResponse.ok) {
                const pcData = await pcResponse.json();
                if (pcData.length > 0) {
                  const pcLevel = pcData[0];
                  creator = pcLevel.publisher?.name || gdbData.author || 'Unknown';
                  verifier = pcLevel.verifier?.name || 'Unknown';
                }
              }
            } catch (pcError) {
              console.warn('Failed to fetch from Pointercrate:', pcError);
            }
          }

          setSelectedLevelData({
            id: parseInt(gdbData.id),
            name: gdbData.name,
            position: position,
            verifier: verifier ? { id: 0, name: verifier, banned: false } : undefined,
            publisher: { id: 0, name: creator, banned: false },
            level_id: parseInt(gdbData.id),
            song: {
              id: parseInt(gdbData.customSong || '0'),
              name: gdbData.songName,
              author: gdbData.songAuthor
            },
            tags: aredlLevel?.tags || ['Overall']
          });
          setSelectedLevelId(searchTerm);
        } else {
          // Search by level name in AREDL list
          const results = aredlLevelsList.filter(l => 
            l.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (results.length > 0) {
            setSearchResults(results);
            return;
          }
          throw new Error('No AREDL levels found with that name');
        }
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to fetch level information');
      setSelectedLevelData(null);
      setSearchResults([]);
    } finally {
      setIsLoadingLevel(false);
    }
  };

  const [searchResults, setSearchResults] = useState<AREDLLevelData[]>([]);

  const handleSelectSearchResult = (level: AREDLLevelData) => {
    setSelectedLevelData(level);
    setSelectedLevelId(level.level_id.toString());
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSelectLevel = async (levelId: string) => {
    setSelectedLevelId(levelId);
    setApiError(null);
    // Check if it's a HKGD level
    const hkgdLevel = levels.find(l => l.levelId === levelId);
    if (hkgdLevel) {
      console.log('HKGD Level found:', hkgdLevel);
      console.log('Creator:', hkgdLevel.creator);
      console.log('Verifier:', hkgdLevel.verifier);

      // Fetch song from GDBrowser
      let song = undefined;
      try {
        const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${hkgdLevel.levelId}`);
        if (gdbResponse.ok) {
          const gdbData = await gdbResponse.json();
          if (gdbData.songName && gdbData.songAuthor) {
            song = {
              id: parseInt(gdbData.customSong || '0'),
              name: gdbData.songName,
              author: gdbData.songAuthor
            };
          }
        }
      } catch (gdbError) {
        console.warn('Failed to fetch song from GDBrowser:', gdbError);
      }

      setSelectedLevelData({
        id: parseInt(hkgdLevel.levelId),
        name: hkgdLevel.name,
        position: hkgdLevel.aredlRank || 0,
        video: hkgdLevel.records[0]?.videoUrl,
        verifier: { id: 0, name: hkgdLevel.verifier, banned: false },
        publisher: { id: 0, name: hkgdLevel.creator, banned: false },
        level_id: parseInt(hkgdLevel.levelId),
        song: song,
        description: hkgdLevel.description
      });
    } else {
      // It's an AREDL level, fetch from AREDL list
      const aredlLevel = aredlLevelsList.find(l => l.level_id.toString() === levelId);
      if (aredlLevel) {
        // Check if this level exists in HKGD database first
        const hkgdLevel = levels.find(l => l.levelId === levelId);
        let creator = hkgdLevel?.creator || 'Unknown';
        let verifier = hkgdLevel?.verifier;

        // For levels below rank 150 (position > 150), fetch creator from GDBrowser instead of Pointercrate
        if (aredlLevel.position > 150 && !hkgdLevel) {
          try {
            const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${aredlLevel.level_id}`, {
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            if (gdbResponse.ok) {
              const gdbData = await gdbResponse.json();
              if (gdbData.author) {
                creator = gdbData.author;
              }
            }
          } catch (gdbError) {
            console.warn('Failed to fetch creator from GDBrowser:', gdbError);
            // Fallback: try to fetch from Pointercrate as well
            try {
              const pcResponse = await fetch(`https://pointercrate.com/api/v2/demons/?name_contains=${encodeURIComponent(aredlLevel.name)}`, {
                signal: AbortSignal.timeout(10000)
              });
              if (pcResponse.ok) {
                const pcData = await pcResponse.json();
                if (pcData.length > 0 && pcData[0].publisher?.name) {
                  creator = pcData[0].publisher.name;
                }
              }
            } catch (pcError) {
              console.warn('Fallback to Pointercrate also failed:', pcError);
            }
          }
          verifier = undefined; // No verifier for levels below 150
        } else if (aredlLevel.position <= 150 && aredlLevel.position > 0 && !hkgdLevel) {
          // For levels 1-150 (top 150), fetch creator and verifier from Pointercrate
          try {
            const pcResponse = await fetch(`https://pointercrate.com/api/v2/demons/?name_contains=${encodeURIComponent(aredlLevel.name)}`, {
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            console.log('Pointercrate response status:', pcResponse.status);
            if (pcResponse.ok) {
              const pcData = await pcResponse.json();
              console.log('Pointercrate data:', pcData);
              if (pcData.length > 0) {
                const pcLevel = pcData[0];
                creator = pcLevel.publisher?.name || 'Unknown';
                verifier = pcLevel.verifier?.name || 'Unknown';
                console.log('Creator:', creator, 'Verifier:', verifier);
              }
            } else {
              // Fallback to GDBrowser if Pointercrate fails
              console.warn('Pointercrate returned non-OK status, trying GDBrowser fallback');
              try {
                const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${aredlLevel.level_id}`, {
                  signal: AbortSignal.timeout(10000)
                });
                if (gdbResponse.ok) {
                  const gdbData = await gdbResponse.json();
                  if (gdbData.author) {
                    creator = gdbData.author;
                  }
                }
              } catch (gdbError) {
                console.warn('GDBrowser fallback also failed:', gdbError);
              }
            }
          } catch (pcError) {
            console.warn('Failed to fetch from Pointercrate:', pcError);
            // Fallback to GDBrowser
            try {
              const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${aredlLevel.level_id}`, {
                signal: AbortSignal.timeout(10000)
              });
              if (gdbResponse.ok) {
                const gdbData = await gdbResponse.json();
                if (gdbData.author) {
                  creator = gdbData.author;
                }
              }
            } catch (gdbError) {
              console.warn('GDBrowser fallback also failed:', gdbError);
            }
          }
        }

        // Fetch song from GDBrowser
        let song = undefined;
        try {
          const gdbResponse = await fetch(`https://gdbrowser.com/api/level/${aredlLevel.level_id}`);
          if (gdbResponse.ok) {
            const gdbData = await gdbResponse.json();
            if (gdbData.songName && gdbData.songAuthor) {
              song = {
                id: parseInt(gdbData.customSong || '0'),
                name: gdbData.songName,
                author: gdbData.songAuthor
              };
            }
          }
        } catch (gdbError) {
          console.warn('Failed to fetch song from GDBrowser:', gdbError);
        }

        const levelData = {
          id: aredlLevel.level_id,
          name: aredlLevel.name,
          position: aredlLevel.position,
          video: aredlLevel.video,
          verifier: verifier ? { id: 0, name: verifier, banned: false } : undefined,
          publisher: { id: 0, name: creator, banned: false },
          level_id: aredlLevel.level_id,
          song: song,
          tags: aredlLevel.tags || ['Overall'],
          description: aredlLevel.description
        };
        console.log('Setting selected level data:', levelData);
        console.log('Creator from levelData:', levelData.publisher.name);
        setSelectedLevelData(levelData);
      } else {
        // Fallback to fetchLevelFromAPI
        fetchLevelFromAPI(levelId);
      }
    }
  };

  // Helper function to format date as YY/MM/DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // Auto-format date input as YY/MM/DD
  const handleDateChange = (value: string) => {
    // Remove non-digits
    let cleaned = value.replace(/\D/g, '');
    
    // Limit to 6 digits (YYMMDD)
    if (cleaned.length > 6) cleaned = cleaned.slice(0, 6);
    
    // Format as YY/MM/DD
    if (cleaned.length >= 5) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 6)}`;
    } else if (cleaned.length >= 3) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    
    setDate(cleaned);
  };

  // Validate date in YY/MM/DD format
  const isValidDate = (dateStr: string): boolean => {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    
    const [yy, mm, dd] = parts.map(p => parseInt(p, 10));
    
    // Check if all parts are numbers
    if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return false;
    
    // Check month range
    if (mm < 1 || mm > 12) return false;
    
    // Check day range based on month
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Handle leap year for February
    const fullYear = 2000 + yy;
    const isLeapYear = (fullYear % 4 === 0 && fullYear % 100 !== 0) || (fullYear % 400 === 0);
    if (isLeapYear && mm === 2) {
      if (dd < 1 || dd > 29) return false;
    } else {
      if (dd < 1 || dd > daysInMonth[mm - 1]) return false;
    }
    
    // Check if date is not in the future
    const inputDate = new Date(fullYear, mm - 1, dd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate > today) return false;
    
    return true;
  };

  // Helper function to get today's date in YY/MM/DD format
  const getTodayDate = (): string => {
    return formatDate(new Date());
  };

  const handleSubmit = () => {
    const newErrors: string[] = [];
    
    if (!isOtherLevel && !selectedLevelId) newErrors.push('Please select a level');
    if (isOtherLevel && !otherLevelName.trim()) newErrors.push('Level name is required for other levels');
    if (!playerName.trim()) newErrors.push('Player name is required');
    if (!videoUrl.trim()) newErrors.push('Video URL is required');
    
    // Validate date if provided
    if (date && !isValidDate(date)) {
      newErrors.push('Invalid date. Please use YY/MM/DD format (e.g., 26/02/06)');
    }
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const record: Record = {
      player: playerName.trim(),
      date: date || getTodayDate(),
      fps: fps.trim() || undefined,
      cbf: cbf,
      attempts: attempts ? parseInt(attempts) : undefined,
      videoUrl: videoUrl.trim()
    };

    let levelData: Partial<Level> | undefined;
    if (selectedLevelData) {
      const isPlatformer = selectedLevelData.tags && selectedLevelData.tags.some((t: string) => t.toLowerCase() === 'platformer');
      
      levelData = {
        levelId: selectedLevelId,
        name: selectedLevelData.name,
        hkgdRank: selectedLevelData.position,
        aredlRank: isPlatformer ? null : selectedLevelData.position,
        // Removed pemonlistRank - using manual ranking only
        // pemonlistRank: isPlatformer ? selectedLevelData.position : null,
        creator: selectedLevelData.publisher?.name || 'Unknown',
        verifier: isPlatformer 
          ? (selectedLevelData.verifier?.name || 'Unknown')
          : (selectedLevelData.position >= 150 ? 'Unknown' : (selectedLevelData.verifier?.name || 'Unknown')),
        description: isPlatformer ? undefined : selectedLevelData.description,
        songName: selectedLevelData.song ? `${selectedLevelData.song.name} by ${selectedLevelData.song.author}` : undefined,
        songId: selectedLevelData.song?.id?.toString(),
        thumbnail: `https://levelthumbs.prevter.me/thumbnail/${selectedLevelId}`,
        tags: selectedLevelData.tags || ['Overall']
      };
    }
    
    const finalLevelId = isOtherLevel ? otherLevelId || `new-${Date.now()}` : selectedLevelId;
    onSubmit(finalLevelId, record, levelData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-lg max-h-[90vh] bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden animate-fadeIn flex flex-col" style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Submit Record</h2>
              <p className="text-sm text-muted-foreground">Add your completion to the list</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Demon List Type Selection */}
          <div className="space-y-2">
            <Label>Demon List Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDemonListType('classic');
                  setSelectedLevelId('');
                  setSelectedLevelData(null);
                  setSearchQuery('');
                  setSearchResults([]);
                  setApiError(null);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  demonListType === 'classic'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-border/50 hover:border-border'
                }`}
              >
                <div className="text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-indigo-400" />
                  <div className="font-semibold text-foreground">Classic</div>
                  <div className="text-xs text-muted-foreground mt-1">Classic Extreme Demons</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDemonListType('platformer');
                  setSelectedLevelId('');
                  setSelectedLevelData(null);
                  setSearchQuery('');
                  setSearchResults([]);
                  setApiError(null);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  demonListType === 'platformer'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-border/50 hover:border-border'
                }`}
              >
                <div className="text-center">
                  <Gamepad2 className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <div className="font-semibold text-foreground">Platformer</div>
                  <div className="text-xs text-muted-foreground mt-1">Platformer Extreme Demons</div>
                </div>
              </button>
            </div>
          </div>

          {/* Level Selection */}
          <div className="space-y-2">
            <Label>{demonListType === 'classic' ? 'Level' : 'Platformer Demon'} *</Label>
            
            {/* Other Level Toggle - only show for classic demons */}
            {demonListType === 'classic' && (
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="other-level"
                  checked={isOtherLevel}
                  onCheckedChange={(checked) => {
                    setIsOtherLevel(checked as boolean);
                    setSelectedLevelId('');
                    setSelectedLevelData(null);
                    setApiError(null);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                />
                <Label htmlFor="other-level" className="cursor-pointer text-sm text-muted-foreground">
                  My level is not on the list
                </Label>
              </div>
            )}

            {isOtherLevel ? (
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <div>
                  <Label htmlFor="other-name" className="text-sm">Level Name *</Label>
                  <Input
                    id="other-name"
                    value={otherLevelName}
                    onChange={(e) => setOtherLevelName(e.target.value)}
                    placeholder="Enter level name"
                  />
                </div>
                <div>
                  <Label htmlFor="other-id" className="text-sm">Level ID (optional)</Label>
                  <Input
                    id="other-id"
                    value={otherLevelId}
                    onChange={(e) => setOtherLevelId(e.target.value)}
                    placeholder="Geometry Dash level ID"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Level ID/Name Input for Pointercrate */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchResults([]); // Clear previous search results when typing
                    }}
                    placeholder={`Enter level ID or name to search ${demonListType === 'classic' ? 'Extreme Demons' : 'Platformer Demons'}...`}
                    className="pl-10"
                  />
                </div>

                {apiError && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                )}

                {/* Search Results (multiple levels found) */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Found {searchResults.length} {demonListType === 'platformer' ? 'Platformer Demon(s)' : 'Extreme Demon(s)'}:
                    </p>
                    <div className="max-h-64 overflow-y-auto border border-border/50 rounded-lg">
                      {/* Show selected level first with highlight */}
                      {selectedLevelData && (
                        <div className={`p-3 border-b-2 ${demonListType === 'platformer' ? 'bg-purple-500/20 border-purple-500' : 'bg-indigo-500/20 border-indigo-500'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground">{selectedLevelData.name}</h4>
                                <Badge variant="default" className="text-xs">Selected</Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">ID: {selectedLevelData.level_id}</Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {demonListType === 'platformer' 
                                    ? `Pemonlist #${selectedLevelData.position}`
                                    : (selectedLevelData.position <= 150 ? `Pointercrate #${selectedLevelData.position}` : `AREDL #${selectedLevelData.position}`)
                                  }
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Show other search results */}
                      {searchResults
                        .filter(level => selectedLevelData?.level_id !== level.level_id)
                        .map((level) => (
                        <button
                          key={level.id || level.level_id}
                          onClick={() => handleSelectSearchResult(level)}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-muted transition-colors border-b border-border/30 last:border-b-0"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{level.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">ID: {level.level_id}</Badge>
                              <Badge variant="secondary" className="text-xs">
                                {demonListType === 'platformer' 
                                  ? `Pemonlist #${level.position}`
                                  : (level.position <= 150 ? `Pointercrate #${level.position}` : `AREDL #${level.position}`)
                                }
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="default" className={demonListType === 'platformer' ? 'bg-purple-500 hover:bg-purple-600' : ''}>
                            Select
                          </Button>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pointercrate Level Result - Currently Selected */}
                {selectedLevelData && (
                  <div className={`p-4 rounded-lg ${demonListType === 'platformer' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-indigo-500/10 border-indigo-500/20'} border space-y-3`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{selectedLevelData.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">ID: {selectedLevelData.level_id}</Badge>
                          <Badge variant="secondary">
                            {(() => {
                              if (demonListType === 'platformer') {
                                return `Pemonlist #${selectedLevelData.position}`;
                            }
                            
                            // For classic demons
                            // Calculate HKGD rank based on all levels sorted by AREDL rank
                            const allWithNew = [...hkgdLevels, {
                              rank: selectedLevelData.position,
                              name: selectedLevelData.name,
                              id: selectedLevelData.level_id.toString(),
                              isHKGD: false
                            }];
                            const sorted = allWithNew.sort((a, b) => a.rank - b.rank);
                            const hkgdRank = sorted.findIndex(l => l.id === selectedLevelData.level_id.toString()) + 1;
                            
                            if (selectedLevelData.position === 0) return 'Not on Pointercrate';
                            if (selectedLevelData.position <= 150) return `Pointercrate #${selectedLevelData.position}`;
                            return `HKGD #${hkgdRank} (AREDL #${selectedLevelData.position})`;
                          })()}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLevelId('');
                          setSelectedLevelData(null);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedLevelData.publisher?.name && selectedLevelData.publisher.name.trim() !== '' && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Creator:</span>
                          <span className="font-medium">{selectedLevelData.publisher.name}</span>
                        </div>
                      )}
                      {selectedLevelData.verifier?.name && selectedLevelData.verifier.name.trim() !== '' && selectedLevelData.position <= 150 && selectedLevelData.position > 0 && (
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span className="text-muted-foreground">Verifier:</span>
                          <span className="font-medium">{selectedLevelData.verifier.name}</span>
                        </div>
                      )}
                      {selectedLevelData.song?.name && selectedLevelData.song.name.trim() !== '' && selectedLevelData.song?.author && selectedLevelData.song.author.trim() !== '' && (
                        <div className="flex items-center gap-2 col-span-2">
                          <Music className="w-4 h-4 text-indigo-400" />
                          <span className="text-muted-foreground">Song:</span>
                          <span className="font-medium">{selectedLevelData.song.name} by {selectedLevelData.song.author}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* HKGD Level List */}
                {!selectedLevelData && searchResults.length === 0 && (
                  <div className="max-h-48 overflow-y-auto border border-border/50 rounded-lg">
                    {filteredLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => handleSelectLevel(level.id)}
                        className={`w-full flex items-center justify-between p-3 text-left hover:bg-muted transition-colors ${
                          selectedLevelId === level.id ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''
                        }`}
                      >
                        <div>
                          <span className="font-medium text-foreground">{level.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">ID: {level.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {demonListType === 'platformer' 
                              ? `Pemonlist #${level.rank}`
                              : (level.rank <= 150 ? `Pointercrate #${level.rank}` : `AREDL #${level.displayRank}`)
                            }
                          </span>
                          {level.isHKGD && (
                            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">HKGD</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Player Name */}
          <div className="space-y-2">
            <Label htmlFor="player">Player Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="player"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your GD username"
                className="pl-10"
              />
            </div>
          </div>

          {/* Video URL - REQUIRED */}
          <div className="space-y-2">
            <Label htmlFor="video">Video URL *</Label>
            <div className="relative">
              <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="video"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="YouTube video link (required)"
                className="pl-10"
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Optional Information</p>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm">Completion Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="text"
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    placeholder="YY/MM/DD"
                    className={`pl-10 ${date && !isValidDate(date) ? 'border-red-500' : ''}`}
                    maxLength={8}
                  />
                </div>
                {date && !isValidDate(date) && (
                  <p className="text-xs text-red-500">Invalid date (e.g., 26/02/06)</p>
                )}
              </div>
              
              {/* FPS */}
              <div className="space-y-2">
                <Label htmlFor="fps" className="text-sm">FPS</Label>
                <div className="relative">
                  <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fps"
                    value={fps}
                    onChange={(e) => setFps(e.target.value)}
                    placeholder="e.g. 60fps, 240fps"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* CBF & Attempts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center h-10 px-3 rounded-lg bg-muted/50 border border-border/50">
                <Checkbox
                  id="cbf"
                  checked={cbf}
                  onCheckedChange={(checked) => setCbf(checked as boolean)}
                  className="mr-3"
                />
                <Label htmlFor="cbf" className="flex items-center gap-2 cursor-pointer mb-0 text-sm">
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                  CBF Used
                </Label>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="attempts"
                    type="number"
                    value={attempts}
                    onChange={(e) => setAttempts(e.target.value)}
                    placeholder="Attempts"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-sm text-indigo-300">
              <strong>What is CBF?</strong> Click Between Frames (CBF) is a mod that allows players to click between rendered frames, potentially improving performance on high-refresh-rate monitors. Records using CBF are marked with a CBF tag.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Submit Record
          </Button>
        </div>
      </div>
    </div>
  );
}
