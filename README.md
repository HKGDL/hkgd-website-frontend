# HKGD Frontend

Frontend for the HKGD (Hong Kong Geometry Dash) Demon List website.

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## Quick Start

```bash
# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:19132" > .env

# Start development server
npm run dev
```

The app runs on http://localhost:5173

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | https://localhost:8081/api |

## Features

- **Demon List** - Browse extreme demon levels with rankings
- **Platformer List** - Platformer extreme demons from Pemonlist
- **Record Submission** - Submit your level completions
- **Admin CMS** - Full content management system
  - Level management (CRUD)
  - Record management
  - Pending submissions approval
  - Changelog management
  - AREDL sync
- **Member Tracking** - Track players and their completions
- **Responsive Design** - Works on all devices

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin CMS components
│   └── ui/            # Radix UI components
├── data/              # Static data
├── hooks/             # Custom React hooks
├── lib/               # Utilities and API client
├── types/             # TypeScript types
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## License

[Dont Be A Dick (DBAD) Public License](DBAD.md)
