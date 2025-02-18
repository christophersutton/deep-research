import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import research from './controllers/research';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.route('/api', research);

// Health check
app.get('/', (c) => c.text('OK'));

export default app; 