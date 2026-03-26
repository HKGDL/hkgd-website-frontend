import type { WebsiteContent } from '@/types';

// Default website content - can be edited via admin panel
export const defaultContent: WebsiteContent = {
  hero: {
    title: "HKGD DEMON LIST",
    subtitle: "Hong Kong Geometry Dash Community",
    description: "Welcome to the official HKGD Demon List! We track and rank the hardest Extreme Demon levels beaten by members of the Hong Kong Geometry Dash community.",
    ctaButton: "View Demon List"
  },
  stats: {
    levelsLabel: "Levels Listed",
    playersLabel: "Players",
    hardestLabel: "Hardest AREDL"
  },
  listPage: {
    title: "Demon List",
    description: "All Extreme Demon levels beaten by HKGD members, ranked by difficulty.",
    searchPlaceholder: "Search levels..."
  },
  platformerPage: {
    title: "Platformer Demon List",
    description: "Platformer Extreme Demon levels beaten by HKGD members.",
    emptyMessage: "The platformer demon list is currently empty. Be the first HKGD member to beat a platformer extreme demon!"
  },
  submitPage: {
    title: "Submit Record",
    description: "Add your completion to the list",
    cbfInfo: "Click Between Frames (CBF) is a mod that allows players to click between rendered frames, potentially improving performance on high-refresh-rate monitors. Records using CBF are marked with a CBF tag."
  },
  footer: {
    description: "The official demon list for the Hong Kong Geometry Dash community. Tracking the hardest Extreme Demon levels beaten by our members.",
    credits: "Made with love by HKGD Community"
  }
};

// Load content from API or use default
export async function loadContent(): Promise<WebsiteContent> {
  try {
    const response = await fetch('/api/content');
    if (response.ok) {
      const content = await response.json();
      return content;
    }
  } catch (error) {
    console.error('Failed to load content from API:', error);
  }
  return defaultContent;
}

// Save content to API (requires authentication)
export async function saveContent(content: WebsiteContent): Promise<void> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch('/api/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(content)
  });

  if (!response.ok) {
    throw new Error('Failed to save content');
  }
}
