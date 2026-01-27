# FreshTrack Setup Guide

This guide walks you through setting up FreshTrack for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14.0 or higher ([Download](https://www.postgresql.org/download/))
- **npm** 9.0 or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

Verify your installations:

```bash
node --version    # Should output v18.x.x or higher
npm --version     # Should output 9.x.x or higher
psql --version    # Should output 14.x or higher
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd freshtrack
```

### 2. Install Dependencies

Install all workspace dependencies from the root:

```bash
npm install
```

This installs dependencies for the root, frontend, and backend workspaces.

## Database Setup

### 1. Create the Database

Connect to PostgreSQL and create the database:

```bash
# Using psql
psql -U postgres

# In the PostgreSQL shell
CREATE DATABASE freshtrack;
\q
```

Or using createdb:

```bash
createdb -U postgres freshtrack
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your database credentials:

```env
# Local PostgreSQL
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/freshtrack

# Or Supabase (if using cloud database)
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server port (optional, defaults to 3001)
PORT=3001
```

### 3. Run Migrations

Create the database tables:

```bash
npm run migrate --workspace=backend
```

Expected output:

```
Migration 001: Created initial schema
Migration 002: Added constraints
All migrations completed successfully
```

### 4. Seed the Database (Optional)

Populate the database with demo data:

```bash
npm run seed --workspace=backend
```

This creates:
- A demo user account (`demo@freshtrack.com` / `password123`)
- Sample groceries with various expiry dates
- 20+ recipes with dietary tags
- 50+ grocery suggestions for autocomplete

## Running the Application

### Development Mode

Start both frontend and backend:

```bash
npm run dev
```

Or start them separately in different terminals:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

### Production Build

Build the frontend for production:

```bash
npm run build
```

The build output will be in `frontend/dist/`.

## Project Configuration

### Monorepo Structure

This project uses npm workspaces. The root `package.json` defines:

```json
{
  "workspaces": ["frontend", "backend", "shared"]
}
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT signing |
| `PORT` | No | `3001` | Backend server port |

## Troubleshooting

### Common Issues

#### "ECONNREFUSED" when starting the backend

**Problem**: Cannot connect to PostgreSQL.

**Solutions**:
1. Verify PostgreSQL is running:
   ```bash
   # Linux
   sudo systemctl status postgresql

   # macOS (Homebrew)
   brew services list
   ```
2. Check your `DATABASE_URL` credentials
3. Ensure the database exists: `psql -U postgres -l`

#### "relation does not exist" errors

**Problem**: Database tables haven't been created.

**Solution**: Run migrations:
```bash
npm run migrate --workspace=backend
```

#### Port 3001 or 5173 already in use

**Problem**: Another process is using the port.

**Solution**: Kill the process or change the port:
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

Or change the backend port in `backend/.env`:
```env
PORT=3002
```

#### "Module not found" errors

**Problem**: Dependencies not installed properly.

**Solution**: Clean install:
```bash
rm -rf node_modules frontend/node_modules backend/node_modules
npm install
```

#### JWT Token errors

**Problem**: Invalid or missing JWT_SECRET.

**Solution**: Ensure `JWT_SECRET` is set in `backend/.env` and restart the backend.

### Database Reset

To completely reset the database:

```bash
# Drop and recreate the database
psql -U postgres -c "DROP DATABASE freshtrack;"
psql -U postgres -c "CREATE DATABASE freshtrack;"

# Run migrations and seeds
npm run migrate --workspace=backend
npm run seed --workspace=backend
```

## Development Tips

### API Testing

Use the health check endpoint to verify the backend is running:

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

### Database Inspection

Connect to the database to inspect tables:

```bash
psql -U postgres -d freshtrack

# List tables
\dt

# Describe a table
\d users

# Query data
SELECT * FROM users;
```

### Logs

The backend logs requests and errors to the console. Watch for:
- Database connection messages
- Authentication errors
- API request logs

### Hot Reloading

- **Frontend**: Vite provides instant hot module replacement
- **Backend**: Uses Node.js `--watch` flag for automatic restarts

## Next Steps

1. Log in with the demo account or create a new account
2. Add some groceries to your pantry
3. Set your dietary preferences
4. Generate a meal plan
5. Explore the dashboard for food waste statistics

For API documentation, see [docs/API.md](./docs/API.md).
