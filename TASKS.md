# FreshTrack Project Tasks

## Overview

This document contains tasks for 5 parallel agents working on the FreshTrack SaaS Dashboard.
Each agent should claim their task, mark it in-progress, and mark complete when done.

**Project:** FreshTrack - Grocery tracking app to reduce food waste with expiration alerts and smart meal planning
**Stack:** React 19 + TypeScript + Vite (frontend), Express 5 + PostgreSQL (backend), JWT auth

---

## Task #1: Fix UI Polish and Empty States

**Status:** pending
**Assigned to:** Agent 1

### Goal
Improve empty state messages and verify responsive design at 375px mobile width.

### Files to modify
- `frontend/src/pages/Pantry.tsx` - Update "no items" empty state message
- `frontend/src/pages/MealPlan.tsx` - Update "no meal plan generated" empty state
- `frontend/src/components/common/EmptyState.tsx` - Review component for consistency
- `frontend/src/components/common/LoadingSpinner.tsx` - Standardize loading messages

### Acceptance criteria
- [ ] Empty state in Pantry shows helpful message like "Your pantry is empty. Add your first grocery item to start tracking expiration dates!"
- [ ] Empty state in MealPlan shows helpful message like "No meal plan for this week. Generate one based on your preferences and expiring groceries!"
- [ ] All pages render correctly at 375px mobile width
- [ ] Spacing and layout are correct on mobile screens
- [ ] Empty state icons render correctly on small screens
- [ ] Loading spinner messages are consistent across pages

---

## Task #2: Fix TypeScript Type Mismatches in MealPlan Components

**Status:** pending
**Assigned to:** Agent 2

### Goal
Fix type errors and improve type safety in MealPlan-related components.

### Files to modify
- `frontend/src/components/MealPlan/WeeklyCalendar.tsx`
- `frontend/src/components/MealPlan/DayColumn.tsx`
- `frontend/src/components/MealPlan/MealSlot.tsx`
- `frontend/src/services/mealPlanService.ts` - Review meal type definitions

### Acceptance criteria
- [ ] All `any` types replaced with proper TypeScript interfaces
- [ ] Meal object types match between mealPlanService and components
- [ ] Proper typing for meal structure: `{ recipeId, recipeName, prepTime, usesExpiring }`
- [ ] TypeScript compiler (`npx tsc --noEmit`) passes with no errors in MealPlan components
- [ ] Props interfaces are properly defined and exported for reuse
- [ ] No implicit any warnings in the codebase

---

## Task #3: Audit and Improve Error Handling

**Status:** pending
**Assigned to:** Agent 3

### Goal
Replace generic errors with user-friendly messages and add error recovery options.

### Files to modify
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Pantry.tsx`
- `frontend/src/pages/Recipes.tsx`
- `frontend/src/pages/MealPlan.tsx`
- `frontend/src/context/*.tsx` - Review error handling in context providers
- `backend/src/routes/*.js` - Ensure consistent error response format

### Acceptance criteria
- [ ] Generic "Something went wrong" errors replaced with specific, actionable messages
- [ ] All error states include retry buttons where appropriate
- [ ] API errors return consistent JSON format: `{ error: string, code: string, details?: object }`
- [ ] Add React Error Boundary component to catch component crashes
- [ ] Console errors are meaningful for debugging (no spammy logs)
- [ ] Network timeout errors show "Connection issue. Check your internet and try again."
- [ ] 401 errors redirect to login with message "Session expired. Please log in again."

---

## Task #4: Create Database Migrations and Seed Data

**Status:** pending
**Assigned to:** Agent 4

### Goal
Create comprehensive database setup with migrations, seed data, and runner scripts.

### Files to create/modify
- `backend/src/db/migrations/001_initial_schema.js` - Create initial schema migration
- `backend/src/db/seed.js` - Create seed data script
- `backend/src/db/migrate.js` - Create migration runner if missing

### Database schema to implement
```sql
users (id SERIAL PRIMARY KEY, email VARCHAR UNIQUE, password_hash VARCHAR, name VARCHAR, created_at TIMESTAMP DEFAULT NOW())

groceries (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), name VARCHAR, category VARCHAR, quantity DECIMAL, unit VARCHAR, expiry_date DATE, is_consumed BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW())

recipes (id SERIAL PRIMARY KEY, name VARCHAR, ingredients JSONB, instructions JSONB, prep_time INT, dietary_tags TEXT[])

grocery_suggestions (id SERIAL PRIMARY KEY, name VARCHAR, category VARCHAR, default_expiry_days INT)

user_preferences (user_id INT PRIMARY KEY REFERENCES users(id), dietary_restrictions TEXT[], allergies TEXT[], disliked_ingredients TEXT[])

meal_plans (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), week_start DATE, meals JSONB)

notifications (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), type VARCHAR, title VARCHAR, message TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW())
```

### Seed data to include
- 20+ recipes with various dietary tags (vegetarian, vegan, keto, gluten-free, etc.)
- 50+ grocery suggestions with categories (dairy, produce, meat, pantry, etc.)
- 1 demo user: `demo@freshtrack.com` / `password123`
- Sample groceries with various expiry dates for demo user

### Acceptance criteria
- [ ] Migration creates all tables with proper constraints and indexes
- [ ] Seed script populates meaningful test data
- [ ] `npm run migrate` runs migrations successfully
- [ ] `npm run seed` populates database with test data
- [ ] Idempotent migrations (safe to run multiple times)
- [ ] Foreign key relationships properly defined
- [ ] Add npm scripts to package.json for migrate/seed commands

---

## Task #5: Create Developer Documentation and Setup Guides

**Status:** pending
**Assigned to:** Agent 5

### Goal
Create comprehensive documentation for developers to onboard quickly.

### Files to create
- `README.md` - Project overview, features, tech stack, quick start
- `SETUP.md` - Detailed environment setup guide
- `backend/.env.example` - Environment variable template
- `docs/API.md` - API endpoint documentation with curl examples

### README.md should include
- Project name and description (FreshTrack SaaS Dashboard)
- Key features list (grocery tracking, expiration alerts, meal planning, recipe suggestions)
- Tech stack (React 19, Express 5, PostgreSQL, JWT)
- Quick start commands
- Project structure overview
- Link to detailed setup guide

### SETUP.md should include
- Prerequisites (Node 18+, PostgreSQL 14+)
- Clone and install steps
- Database setup instructions
- Environment variable configuration
- Running development servers
- Running migrations and seeds
- Troubleshooting common issues

### API.md should document all 18 endpoints
```
Auth:
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me

Groceries:
  GET    /api/groceries
  POST   /api/groceries
  PUT    /api/groceries/:id
  DELETE /api/groceries/:id
  POST   /api/groceries/:id/consume
  GET    /api/groceries/suggestions

Recipes:
  GET /api/recipes
  GET /api/recipes/:id
  GET /api/recipes/suggestions

Meal Plans:
  GET  /api/meal-plans
  POST /api/meal-plans/generate
  PUT  /api/meal-plans/:id

Preferences:
  GET /api/preferences
  PUT /api/preferences

Dashboard:
  GET /api/dashboard/stats

Notifications:
  GET  /api/notifications
  PUT  /api/notifications/:id/read
  PUT  /api/notifications/read-all
```

### Acceptance criteria
- [ ] New developer can set up project in <15 minutes following docs
- [ ] All API endpoints documented with request/response examples
- [ ] Environment variables fully documented with descriptions
- [ ] Database schema documented with ER diagram (text-based)
- [ ] Common errors and their solutions documented
- [ ] Include curl examples for testing each endpoint

---

## Task Status Legend

- **pending** - Not started
- **in_progress** - Being worked on
- **completed** - Done and verified

## How to Claim a Task

1. Change the status from `pending` to `in_progress`
2. Add your name/identifier to "Assigned to"
3. Work through the acceptance criteria
4. Check off items as you complete them
5. Change status to `completed` when done
