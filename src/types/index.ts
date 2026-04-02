export interface Level {
  id: string;
  hkgdRank: number;
  aredlRank: number | null;
  pemonlistRank?: number | null;
  name: string;
  creator: string;
  verifier: string;
  levelId: string;
  description: string;
  thumbnail?: string;
  songId?: string;
  songName?: string;
  tags: string[];
  dateAdded: string;
  records: Record[];
  pack?: string;
  gddlTier?: number;
  nlwTier?: string;
  edelEnjoyment?: number | null;
}

export interface Record {
  id?: number;
  player: string;
  date: string;
  videoUrl?: string;
  fps?: string;
  cbf?: boolean;
  attempts?: number;
}

export interface ChangelogEntry {
  id: string;
  date: string;
  levelName: string;
  levelId: string;
  change: 'added' | 'moved_up' | 'moved_down' | 'removed';
  oldRank: number | null;
  newRank: number | null;
  description: string;
  listType?: 'classic' | 'platformer';
}

export interface Member {
  name: string;
  country?: string;
  levelsBeaten: number;
  avatar?: string;
}

export interface PendingSubmission {
  id: string;
  levelId: string;
  levelName?: string;
  isNewLevel: boolean;
  record: Record;
  submittedAt: string;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  levelData?: Partial<Level>;
}

export interface AREDLLevel {
  rank: number;
  name: string;
  id: string;
}

// Website content that can be edited via admin
export interface WebsiteContent {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    ctaButton: string;
  };
  stats: {
    levelsLabel: string;
    playersLabel: string;
    hardestLabel: string;
  };
  listPage: {
    title: string;
    description: string;
    searchPlaceholder: string;
  };
  platformerPage: {
    title: string;
    description: string;
    emptyMessage: string;
  };
  submitPage: {
    title: string;
    description: string;
    cbfInfo: string;
  };
  footer: {
    description: string;
    credits: string;
  };
}
