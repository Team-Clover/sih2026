import { Router } from 'express'
import SOSEvent from '../models/SOSEvent.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
router.use(requireAuth)
router.post('/', async (req, res, next) => { try { const recent = await SOSEvent.findOne({ userId: req.user._id, timestamp: { $gt: new Date(Date.now() - 60000) } }); if (recent) return res.status(429).json({ message: 'Please wait before sending another SOS.' }); res.status(201).json({ event: await SOSEvent.create({ ...req.body, userId: req.user._id }) }) } catch (e) { next(e) } })
router.get('/my', async (req, res, next) => { try { res.json({ events: await SOSEvent.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(20) }) } catch (e) { next(e) } })
export default router
