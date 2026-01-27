# FreshTrack

A SaaS dashboard for tracking groceries, reducing food waste through expiration alerts, and smart meal planning.

## Features

- **Grocery Tracking**: Add and manage groceries with expiration dates
- **Expiration Alerts**: Get notified when items are about to expire
- **Smart Recipe Suggestions**: Receive recipe recommendations based on expiring ingredients
- **Weekly Meal Planning**: Generate meal plans that prioritize using soon-to-expire groceries
- **Food Waste Analytics**: Track consumption patterns and potential savings
- **Dietary Preferences**: Customize recommendations based on allergies, restrictions, and preferences

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, React Router 7 |
| Backend | Express 5, Node.js (ES Modules) |
| Database | PostgreSQL 14+ |
| Authentication | JWT (JSON Web Tokens) |

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd freshtrack

# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Run database migrations
npm run migrate --workspace=backend

# Seed the database (optional, for demo data)
npm run seed --workspace=backend

# Start development servers
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend API on `http://localhost:3001`.

## Project Structure

```
freshtrack/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── common/       # Shared components (LoadingSpinner, EmptyState, etc.)
│   │   │   ├── Groceries/    # Grocery-related components
│   │   │   ├── Layout/       # App layout (Header, Sidebar)
│   │   │   ├── MealPlan/     # Meal planning components
│   │   │   ├── Notifications/# Notification components
│   │   │   └── Recipes/      # Recipe browsing components
│   │   ├── context/          # React Context providers (Auth, Grocery, etc.)
│   │   ├── pages/            # Page components (Dashboard, Pantry, Recipes, etc.)
│   │   └── services/         # API service layer
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Express API
│   ├── src/
│   │   ├── db/               # Database setup, migrations, seeds
│   │   ├── jobs/             # Background jobs (expiry checker)
│   │   ├── middleware/       # Express middleware (auth)
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic (meal plan generator)
│   │   └── index.js          # Server entry point
│   ├── .env                  # Environment variables (not in git)
│   └── package.json
├── docs/                     # Documentation
│   └── API.md                # API endpoint reference
├── SETUP.md                  # Detailed setup guide
└── package.json              # Root monorepo config
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start only the frontend |
| `npm run dev:backend` | Start only the backend |
| `npm run build` | Build the frontend for production |
| `npm run migrate --workspace=backend` | Run database migrations |
| `npm run seed --workspace=backend` | Seed database with demo data |

## Documentation

- [Detailed Setup Guide](./SETUP.md) - Step-by-step environment setup
- [API Reference](./docs/API.md) - Complete API documentation with examples

## Demo Account

After running seeds, you can log in with:
- Email: `demo@freshtrack.com`
- Password: `password123`

## License

MIT
