import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import groceriesRoutes from './routes/groceries.js';
import recipesRoutes from './routes/recipes.js';
import mealPlansRoutes from './routes/meal-plans.js';
import preferencesRoutes from './routes/preferences.js';
import notificationsRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';
import receiptsRoutes from './routes/receipts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/groceries', groceriesRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/meal-plans', mealPlansRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/receipts', receiptsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
