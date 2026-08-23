import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { logger } from './utils/logger.js';
import { requestLogger } from './middleware/logger.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/officer-roles', roleRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/permissions', permissionRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: "Association API is running successfully" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandler error during request ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ message: err.message || 'Something went wrong on the server' });
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.success(`Server running on port ${PORT}`);
});

