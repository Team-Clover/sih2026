import { Router } from 'express'
import Alert from '../models/Alert.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = Router()

const query = (req) => {
  const q = { isActive: true, expiresAt: { $gt: new Date() } }
  if (req.user?.state) {
    q.state = { $regex: new RegExp(`^${req.user.state.trim()}$`, 'i') }
  }
  return q
}

const severity = { 'VERY HIGH': 4, HIGH: 3, MODERATE: 2, LOW: 1 }

const sortAlerts = (alerts) =>
  alerts.sort(
    (a, b) =>
      (severity[b.riskLevel] || 0) - (severity[a.riskLevel] || 0) ||
      new Date(b.createdAt) - new Date(a.createdAt)
  )

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const alerts = await Alert.find(query(req)).sort({ createdAt: -1 }).limit(50)
    res.json({ alerts: sortAlerts(alerts) })
  } catch (e) {
    next(e)
  }
})

router.get('/active', optionalAuth, async (req, res, next) => {
  try {
    const alerts = await Alert.find(query(req)).sort({ createdAt: -1 }).limit(20)
    res.json({ alerts: sortAlerts(alerts) })
  } catch (e) {
    next(e)
  }
})

router.get('/unread', requireAuth, async (req, res, next) => {
  try {
    res.json({
      alerts: await Alert.find({
        ...query(req),
        isReadBy: { $ne: req.user._id },
      }).sort({ createdAt: -1 }),
    })
  } catch (e) {
    next(e)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
    if (!alert) return res.status(404).json({ message: 'Alert not found.' })
    res.json({ alert })
  } catch (e) {
    next(e)
  }
})

router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    await Alert.findByIdAndUpdate(req.params.id, {
      $addToSet: { isReadBy: req.user._id },
    })
    res.json({ message: 'Alert marked as read.' })
  } catch (e) {
    next(e)
  }
})

router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await Alert.updateMany(query(req), {
      $addToSet: { isReadBy: req.user._id },
    })
    res.json({ message: 'Alerts marked as read.' })
  } catch (e) {
    next(e)
  }
})

export default router
