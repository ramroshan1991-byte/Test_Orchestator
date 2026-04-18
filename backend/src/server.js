import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
console.log('Starting backend server...');
// Load environment variables
dotenv.config();
console.log('Loaded environment variables:', process.env);

// Import routes
import jiraRoutes from './routes/jiraRoutes.js';
import testPlanRoutes from './routes/testPlanRoutes.js';
import testCaseRoutes from './routes/testCaseRoutes.js';
import codeGeneratorRoutes from './routes/codeGeneratorRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test Orchestrator Backend is running' });
});

// Routes
app.use('/api/jira', jiraRoutes);
app.use('/api/test-plans', testPlanRoutes);
app.use('/api/test-cases', testCaseRoutes);
app.use('/api/code-generator', codeGeneratorRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Test Orchestrator Backend running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});
