import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import clientRoutes from './routes/clientRoutes';
import personRoutes from './routes/personRoutes';
import settingsRoutes from './routes/settingsRoutes';
import bonusRoutes from './routes/bonusRoutes';
import authRoutes from './routes/authRoutes';
import { protect } from './middleware/authMiddleware';

const app = express();
const port = process.env.PORT || 3000;

// Trust proxy is required for secure cookies to work behind a load balancer (like on Vercel/Heroku/Railway)
app.set('trust proxy', 1);

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080','https://bonuscalc-nu.vercel.app'], // Frontend URLs
  credentials: true, // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello from Backend!');
});

// Auth Routes (Public)
app.use('/api/auth', authRoutes);

// Protected API Routes
app.use('/api/clients', protect, clientRoutes);
app.use('/api/people', protect, personRoutes);
app.use('/api/settings', protect, settingsRoutes);
app.use('/api/bonus', protect, bonusRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
