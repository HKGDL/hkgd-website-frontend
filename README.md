# HKGD Frontend

Frontend for the HKGD (Hong Kong Geometry Dash) Demon List website.

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (shadcn/ui)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (proxies API to localhost:8787)
npm run dev
```

The app runs on http://localhost:5173

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `/api` (relative path) |

For local development, the Vite dev server proxies `/api` requests to the API running on port 8787.

## Features

- **Demon List** - Browse extreme demon levels with AREDL rankings
- **Platformer List** - Platformer extreme demons from Pemonlist
- **Record Submission** - Submit your level completions for admin review
- **Player Profiles** - View player statistics and completion history
- **Leaderboard** - Community rankings
- **Admin CMS** - Full content management system
  - Level management (CRUD operations)
  - Record management with FPS, CBF, attempts tracking
  - Pending submissions approval workflow
  - Changelog management
  - AREDL sync integration
  - IP ban management for security
  - Website settings configuration
- **Responsive Design** - Works on all devices

## Project Structure

```
src/
├── components/
│   ├── admin/              # Admin CMS components
│   │   ├── AddLevelModal.tsx
│   │   ├── AdminAuth.tsx
│   │   ├── AdminCMSRefactored.tsx
│   │   ├── AREDLSync.tsx
│   │   ├── ChangelogManagement.tsx
│   │   ├── EditLevelModal.tsx
│   │   ├── LevelManagement.tsx
│   │   ├── PendingSubmissions.tsx
│   │   └── SettingsManagement.tsx
│   ├── ui/                 # Radix UI / shadcn components
│   ├── Changelog.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Leaderboard.tsx
│   ├── LevelCard.tsx
│   ├── LevelDetail.tsx
│   ├── LevelList.tsx
│   ├── PlatformerList.tsx
│   ├── PlayerDetail.tsx
│   ├── SubmitRecord.tsx
│   └── UserSettings.tsx
├── data/                   # Static data
├── hooks/                  # Custom React hooks
├── lib/
│   ├── api.ts             # API client with authentication
│   └── utils.ts           # Utility functions
├── types/                  # TypeScript types
├── App.tsx                 # Main app component
├── main.tsx               # Entry point
└── index.css              # Global styles
```

## Development

The development server can optionally use HTTPS with self-signed certificates:

```bash
# Generate certificates (if needed)
./generate-certs.sh

# The dev server will automatically use HTTPS if certs exist
npm run dev
```

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` folder, ready for deployment to Cloudflare Pages.

## Deployment

The frontend is deployed as a Cloudflare Pages site. The `wrangler.toml` configures it as a static asset deployment from the `dist` directory.

```bash
# Deploy to Cloudflare Pages
npm run build
wrangler pages deploy dist
```

## API Integration

The frontend communicates with the HKGD API (Cloudflare Workers + D1). See the `api/` directory for API documentation.

## License

[Dont Be A Dick (DBAD) Public License](DBAD.md)
