import { Router } from 'express'
import Prediction from '../models/Prediction.js'
import Alert from '../models/Alert.js'
import { requireAdminApi } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAdminApi, async (req, res, next) => {
  try {
    const body = req.body;
    const required = ['state', 'aiProbability', 'finalProbability', 'riskLevel'];
    if (required.some((key) => body[key] === undefined)) {
      return res.status(422).json({ message: 'Missing prediction fields.' });
    }

    if (body.sourceId) {
      const existing = await Prediction.findOne({ sourceId: body.sourceId });
      if (existing) {
        return res.status(200).json({
          prediction: existing,
          alert: await Alert.findOne({ predictionId: existing._id }),
          duplicate: true,
        });
      }
    }

    const prediction = await Prediction.create(body);

    const alert = await Alert.create({
      predictionId: prediction._id,
      title: `${body.riskLevel} LANDSLIDE RISK`,
      state: body.state,
      district: body.district,
      riskLevel: body.riskLevel,
      probability: body.finalProbability,
      message: body.riskLevel === 'LOW'
        ? 'Environmental conditions indicate low landslide risk.'
        : body.riskLevel === 'MODERATE'
        ? 'Environmental conditions indicate moderate landslide risk. Stay informed.'
        : 'Environmental conditions indicate elevated landslide risk. This is an AI-based assessment.',
      data: body,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    req.app.get('io')?.emit('new-alert', alert);

    res.status(201).json({ prediction, alert });
  } catch (e) {
    next(e);
  }
});

export default router

