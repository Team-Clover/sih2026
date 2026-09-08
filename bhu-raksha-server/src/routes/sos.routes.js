import { Router } from 'express'
import SOSEvent from '../models/SOSEvent.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const event = await SOSEvent.create({
      ...req.body,
      userId: req.user?._id || null,
    })
    req.app.get('io')?.emit('new-sos', event)
    res.status(201).json({ event })
  } catch (e) {
    next(e)
  }
})

router.get('/my', requireAuth, async (req, res, next) => {
  try {
    res.json({
      events: await SOSEvent.find({ userId: req.user._id })
        .sort({ timestamp: -1 })
        .limit(20),
    })
  } catch (e) {
    next(e)
  }
})

export default router
