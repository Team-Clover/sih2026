import { Router } from 'express'
import Prediction from '../models/Prediction.js'
import Alert from '../models/Alert.js'
import { requireAdminApi } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAdminApi, async (req, res, next) => {
  try {
    const body = req.body
    const required = ['state', 'aiProbability', 'finalProbability', 'riskLevel']
    if (required.some((key) => body[key] === undefined)) {
      return res.status(422).json({ message: 'Missing prediction fields.' })
    }

    if (body.sourceId) {
      const existing = await Prediction.findOne({ sourceId: body.sourceId })
      if (existing) {
        return res.status(200).json({
          prediction: existing,
          alert: await Alert.findOne({ predictionId: existing._id }),
          duplicate: true,
        })
      }
    }

    const prediction = await Prediction.create(body)

    const messages = {
      LOW: `Environmental conditions in ${body.state} indicate low landslide risk (${body.finalProbability}% probability).`,
      MODERATE: `Moderate risk detected in ${body.state} (${body.finalProbability}% probability). Stay attentive.`,
      HIGH: `HIGH RISK: Environmental conditions in ${body.state} indicate elevated landslide risk (${body.finalProbability}% probability). Follow guidelines.`,
      'VERY HIGH': `CRITICAL RISK: Environmental conditions in ${body.state} indicate severe landslide risk (${body.finalProbability}% probability). Stay alert.`,
    }

    const alert = await Alert.create({
      predictionId: prediction._id,
      title: `${body.riskLevel} LANDSLIDE RISK`,
      state: body.state,
      district: body.district || body.state,
      riskLevel: body.riskLevel,
      probability: body.finalProbability,
      aiProbability: body.aiProbability,
      terrainAdjustment: body.terrainAdjustment || 0,
      finalProbability: body.finalProbability,
      message: messages[body.riskLevel] || `Environmental risk assessed at ${body.finalProbability}%.`,
      data: body,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    })

    const io = req.app.get('io')
    if (io) {
      io.emit('new-alert', alert)
      io.emit('new-prediction', prediction)
    }

    res.status(201).json({ prediction, alert })
  } catch (e) {
    next(e)
  }
})

export default router
