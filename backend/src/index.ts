import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { publicLimiter } from './middleware/rateLimit';
import pricingRouter from './routes/pricing';
import healthRouter from './routes/health';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Security headers
app.use(helmet());

// CORS — allow the Expo app and any future web client
app.use(cors({
  origin: [
    /^https?:\/\/localhost/,
    /^exp:\/\//,
    // Add your production domain here when known, e.g.:
    // 'https://tokenwise.app',
  ],
  methods: ['GET'],
}));

app.use(express.json({ limit: '16kb' }));
app.use(publicLimiter);

// Routes
app.use('/health', healthRouter);
app.use('/api/pricing', pricingRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`TokenWise API running on port ${PORT}`);
});

export default app;
