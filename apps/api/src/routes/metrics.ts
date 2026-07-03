import { Router } from 'express';
import { register } from '../lib/metrics.js';

const router = Router();

router.get('/', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const expectedToken = process.env.METRICS_TOKEN || 'replaysafe-metrics-token';
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    res.status(401).json({ error: 'Unauthorized metrics access' });
    return;
  }

  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

export default router;
