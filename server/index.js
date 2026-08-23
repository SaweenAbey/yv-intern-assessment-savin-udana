import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { logger } from './utils/logger.js';
import { requestLogger } from './middleware/logger.js';


import authRoutes from './routes/authRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';


connectDB();

const app = express();


app.use(cors());
app.use(express.json());
app.use(requestLogger);


app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/officer-roles', roleRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/permissions', permissionRoutes);


app.get('/', (req, res) => {
  res.json({ message: "Association API is running successfully" });
});


app.use((err, req, res, next) => {
  logger.error(`Unhandler error during request ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ message: err.message || 'Something went wrong on the server' });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.success(`Server running on port ${PORT}`);
});

