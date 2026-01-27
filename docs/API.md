# FreshTrack API Reference

Base URL: `http://localhost:3001/api`

## Authentication

All endpoints except `/auth/register`, `/auth/login`, and `/groceries/suggestions` require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens expire after 24 hours.

---

## Endpoints

### Health Check

#### GET /health

Check if the API is running.

```bash
curl http://localhost:3001/api/health
```

**Response** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Auth

### POST /auth/register

Create a new user account.

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }'
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Minimum 6 characters |
| name | string | Yes | User's display name |

**Response** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors**
- `400` - Validation error (missing fields, invalid email, password too short)
- `409` - User with this email already exists

---

### POST /auth/login

Authenticate and receive a JWT token.

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email |
| password | string | Yes | User's password |

**Response** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors**
- `400` - Missing email or password
- `401` - Invalid email or password

---

### GET /auth/me

Get the current authenticated user's information.

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors**
- `401` - Invalid or missing token
- `404` - User not found

---

## Groceries

### GET /groceries

List the user's groceries (not consumed).

```bash
curl http://localhost:3001/api/groceries \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "groceries": [
    {
      "id": 1,
      "name": "Milk",
      "category": "dairy",
      "quantity": 1,
      "unit": "gallon",
      "expiryDate": "2024-01-20",
      "isConsumed": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### POST /groceries

Add a new grocery item.

```bash
curl -X POST http://localhost:3001/api/groceries \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Milk",
    "category": "dairy",
    "quantity": 1,
    "unit": "gallon",
    "expiryDate": "2024-01-20"
  }'
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Item name |
| category | string | No | Category (dairy, produce, meat, pantry, etc.) |
| quantity | number | No | Amount (default: 1) |
| unit | string | No | Unit of measurement |
| expiryDate | string | No | ISO date (YYYY-MM-DD) |

**Response** `201 Created`
```json
{
  "message": "Grocery item added successfully",
  "grocery": {
    "id": 1,
    "name": "Milk",
    "category": "dairy",
    "quantity": 1,
    "unit": "gallon",
    "expiryDate": "2024-01-20",
    "isConsumed": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors**
- `400` - Name is required

---

### PUT /groceries/:id

Update a grocery item.

```bash
curl -X PUT http://localhost:3001/api/groceries/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 2,
    "expiryDate": "2024-01-25"
  }'
```

**Request Body**

All fields are optional. Only provided fields will be updated.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Item name |
| category | string | Category |
| quantity | number | Amount |
| unit | string | Unit of measurement |
| expiryDate | string | ISO date (YYYY-MM-DD) |

**Response** `200 OK`
```json
{
  "message": "Grocery item updated successfully",
  "grocery": {
    "id": 1,
    "name": "Milk",
    "category": "dairy",
    "quantity": 2,
    "unit": "gallon",
    "expiryDate": "2024-01-25",
    "isConsumed": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors**
- `404` - Grocery item not found

---

### DELETE /groceries/:id

Delete a grocery item.

```bash
curl -X DELETE http://localhost:3001/api/groceries/1 \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "message": "Grocery item deleted successfully"
}
```

**Errors**
- `404` - Grocery item not found

---

### POST /groceries/:id/consume

Mark a grocery item as consumed.

```bash
curl -X POST http://localhost:3001/api/groceries/1/consume \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "message": "Grocery item marked as consumed",
  "grocery": {
    "id": 1,
    "name": "Milk",
    "category": "dairy",
    "quantity": 1,
    "unit": "gallon",
    "expiryDate": "2024-01-20",
    "isConsumed": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors**
- `404` - Grocery item not found

---

### GET /groceries/suggestions

Search grocery suggestions for autocomplete. Does not require authentication.

```bash
curl "http://localhost:3001/api/groceries/suggestions?q=mil"
```

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | No | Search term (returns top 20 if empty) |

**Response** `200 OK`
```json
{
  "suggestions": [
    {
      "id": 1,
      "name": "Milk",
      "category": "dairy",
      "defaultExpiryDays": 7
    },
    {
      "id": 2,
      "name": "Almond Milk",
      "category": "dairy",
      "defaultExpiryDays": 14
    }
  ]
}
```

---

## Recipes

### GET /recipes

List recipes with optional dietary filter.

```bash
# All recipes
curl http://localhost:3001/api/recipes \
  -H "Authorization: Bearer <token>"

# Filtered by dietary tags
curl "http://localhost:3001/api/recipes?dietary=vegetarian,gluten-free&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dietary | string | No | Comma-separated dietary tags |
| limit | number | No | Results per page (default: 20, max: 100) |
| offset | number | No | Pagination offset (default: 0) |

**Response** `200 OK`
```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Vegetable Stir Fry",
      "ingredients": [
        {"name": "broccoli", "amount": "2 cups"},
        {"name": "carrots", "amount": "1 cup"}
      ],
      "instructions": [
        "Heat oil in a wok",
        "Add vegetables and stir fry for 5 minutes"
      ],
      "prepTime": 20,
      "dietaryTags": ["vegetarian", "vegan", "gluten-free"]
    }
  ],
  "total": 25,
  "limit": 20,
  "offset": 0
}
```

---

### GET /recipes/:id

Get a single recipe by ID.

```bash
curl http://localhost:3001/api/recipes/1 \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "recipe": {
    "id": 1,
    "name": "Vegetable Stir Fry",
    "ingredients": [
      {"name": "broccoli", "amount": "2 cups"},
      {"name": "carrots", "amount": "1 cup"}
    ],
    "instructions": [
      "Heat oil in a wok",
      "Add vegetables and stir fry for 5 minutes"
    ],
    "prepTime": 20,
    "dietaryTags": ["vegetarian", "vegan", "gluten-free"]
  }
}
```

**Errors**
- `404` - Recipe not found

---

### GET /recipes/suggestions

Get recipes that use ingredients expiring within 7 days. Respects user dietary preferences.

```bash
curl http://localhost:3001/api/recipes/suggestions \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Vegetable Stir Fry",
      "ingredients": [...],
      "instructions": [...],
      "prepTime": 20,
      "dietaryTags": ["vegetarian"],
      "matchingIngredientsCount": 3
    }
  ],
  "expiringGroceries": [
    {"name": "Broccoli", "expiryDate": "2024-01-17"},
    {"name": "Carrots", "expiryDate": "2024-01-18"}
  ]
}
```

---

## Meal Plans

### GET /meal-plans

Get user's meal plans.

```bash
# Get all recent meal plans
curl http://localhost:3001/api/meal-plans \
  -H "Authorization: Bearer <token>"

# Get meal plan for a specific week
curl "http://localhost:3001/api/meal-plans?weekStart=2024-01-15" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| weekStart | string | No | Week start date (YYYY-MM-DD, Monday) |

**Response** `200 OK`
```json
{
  "mealPlans": [
    {
      "id": 1,
      "weekStart": "2024-01-15",
      "meals": {
        "monday": {
          "breakfast": {"recipeId": 1, "recipeName": "Oatmeal"},
          "lunch": {"recipeId": 2, "recipeName": "Salad"},
          "dinner": {"recipeId": 3, "recipeName": "Stir Fry"}
        },
        "tuesday": {...}
      }
    }
  ]
}
```

---

### POST /meal-plans/generate

Generate a new meal plan based on expiring groceries and user preferences.

```bash
curl -X POST http://localhost:3001/api/meal-plans/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"weekStart": "2024-01-15"}'
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| weekStart | string | No | Week start date (defaults to current Monday) |

**Response** `201 Created`
```json
{
  "message": "Meal plan generated successfully",
  "mealPlan": {
    "id": 1,
    "weekStart": "2024-01-15",
    "meals": {
      "monday": {
        "breakfast": {"recipeId": 1, "recipeName": "Oatmeal", "prepTime": 10, "usesExpiring": true},
        "lunch": {"recipeId": 2, "recipeName": "Salad", "prepTime": 15, "usesExpiring": false},
        "dinner": {"recipeId": 3, "recipeName": "Stir Fry", "prepTime": 25, "usesExpiring": true}
      }
    }
  }
}
```

---

### PUT /meal-plans/:id

Update a meal plan.

```bash
curl -X PUT http://localhost:3001/api/meal-plans/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "meals": {
      "monday": {
        "breakfast": {"recipeId": 5, "recipeName": "Pancakes"}
      }
    }
  }'
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| meals | object | Yes | Meal plan object by day and meal type |

**Response** `200 OK`
```json
{
  "message": "Meal plan updated successfully",
  "mealPlan": {
    "id": 1,
    "weekStart": "2024-01-15",
    "meals": {...}
  }
}
```

**Errors**
- `400` - Meals object is required
- `404` - Meal plan not found

---

## Preferences

### GET /preferences

Get user dietary preferences.

```bash
curl http://localhost:3001/api/preferences \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "preferences": {
    "id": 1,
    "dietaryRestrictions": ["vegetarian"],
    "allergies": ["peanuts", "shellfish"],
    "dislikedIngredients": ["cilantro", "olives"]
  }
}
```

---

### PUT /preferences

Update user dietary preferences.

```bash
curl -X PUT http://localhost:3001/api/preferences \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dietaryRestrictions": ["vegetarian", "gluten-free"],
    "allergies": ["peanuts"],
    "dislikedIngredients": ["cilantro"]
  }'
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dietaryRestrictions | string[] | No | Diet types (vegetarian, vegan, keto, etc.) |
| allergies | string[] | No | Food allergies |
| dislikedIngredients | string[] | No | Ingredients to avoid |

**Response** `200 OK`
```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "id": 1,
    "dietaryRestrictions": ["vegetarian", "gluten-free"],
    "allergies": ["peanuts"],
    "dislikedIngredients": ["cilantro"]
  }
}
```

---

## Dashboard

### GET /dashboard/stats

Get food waste statistics.

```bash
curl http://localhost:3001/api/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "expiringCount": 5,
  "expiredThisWeek": 2,
  "consumedCount": 15,
  "potentialSavings": 45
}
```

| Field | Description |
|-------|-------------|
| expiringCount | Items expiring within 3 days |
| expiredThisWeek | Items that expired in the last 7 days (not consumed) |
| consumedCount | Items consumed this month |
| potentialSavings | Estimated savings in USD ($3 per consumed item) |

---

### GET /dashboard/expiring-soon

Get top 5 items expiring soonest.

```bash
curl http://localhost:3001/api/dashboard/expiring-soon \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "name": "Milk",
      "category": "dairy",
      "quantity": 1,
      "unit": "gallon",
      "expiryDate": "2024-01-17"
    }
  ]
}
```

---

### GET /dashboard/suggested-recipes

Get top 3 recipes using expiring ingredients.

```bash
curl http://localhost:3001/api/dashboard/suggested-recipes \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Vegetable Stir Fry",
      "ingredients": [...],
      "instructions": [...],
      "prepTime": 20,
      "dietaryTags": ["vegetarian"],
      "matchingIngredientsCount": 3,
      "matchingIngredients": ["broccoli", "carrots", "bell pepper"]
    }
  ]
}
```

---

## Notifications

### GET /notifications

List user notifications.

```bash
curl "http://localhost:3001/api/notifications?limit=10&offset=0" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Results per page (default: 20, max: 100) |
| offset | number | No | Pagination offset (default: 0) |

**Response** `200 OK`
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "expiry_warning",
      "title": "Items Expiring Soon",
      "message": "3 items in your pantry are expiring within 3 days",
      "isRead": false,
      "createdAt": "2024-01-15T08:00:00.000Z"
    }
  ],
  "total": 15,
  "limit": 10,
  "offset": 0
}
```

---

### GET /notifications/unread/count

Get count of unread notifications.

```bash
curl http://localhost:3001/api/notifications/unread/count \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "unreadCount": 5
}
```

---

### PUT /notifications/:id/read

Mark a single notification as read.

```bash
curl -X PUT http://localhost:3001/api/notifications/1/read \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": 1,
    "type": "expiry_warning",
    "title": "Items Expiring Soon",
    "message": "3 items in your pantry are expiring within 3 days",
    "isRead": true,
    "createdAt": "2024-01-15T08:00:00.000Z"
  }
}
```

**Errors**
- `404` - Notification not found

---

### PUT /notifications/read-all

Mark all notifications as read.

```bash
curl -X PUT http://localhost:3001/api/notifications/read-all \
  -H "Authorization: Bearer <token>"
```

**Response** `200 OK`
```json
{
  "message": "All notifications marked as read",
  "updatedCount": 5
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate email) |
| 500 | Internal Server Error |

---

## Database Schema

```
┌─────────────────┐     ┌─────────────────────┐
│     users       │     │   user_preferences  │
├─────────────────┤     ├─────────────────────┤
│ id (PK)         │────<│ user_id (PK, FK)    │
│ email           │     │ dietary_restrictions│
│ password_hash   │     │ allergies           │
│ name            │     │ disliked_ingredients│
│ created_at      │     └─────────────────────┘
└────────┬────────┘
         │
         │     ┌─────────────────┐
         ├────<│   groceries     │
         │     ├─────────────────┤
         │     │ id (PK)         │
         │     │ user_id (FK)    │
         │     │ name            │
         │     │ category        │
         │     │ quantity        │
         │     │ unit            │
         │     │ expiry_date     │
         │     │ is_consumed     │
         │     │ created_at      │
         │     └─────────────────┘
         │
         │     ┌─────────────────┐
         ├────<│   meal_plans    │
         │     ├─────────────────┤
         │     │ id (PK)         │
         │     │ user_id (FK)    │
         │     │ week_start      │
         │     │ meals (JSONB)   │
         │     └─────────────────┘
         │
         │     ┌─────────────────┐
         └────<│  notifications  │
               ├─────────────────┤
               │ id (PK)         │
               │ user_id (FK)    │
               │ type            │
               │ title           │
               │ message         │
               │ is_read         │
               │ created_at      │
               └─────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│      recipes        │     │ grocery_suggestions │
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)             │
│ name                │     │ name (UNIQUE)       │
│ ingredients (JSONB) │     │ category            │
│ instructions (JSONB)│     │ default_expiry_days │
│ prep_time           │     └─────────────────────┘
│ dietary_tags        │
└─────────────────────┘
```
