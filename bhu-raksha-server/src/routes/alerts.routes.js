import { Router } from 'express'
import Alert from '../models/Alert.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
const query = (req) => ({ isActive: true, expiresAt: { $gt: new Date() }, ...(req.user?.state ? { state: req.user.state } : {}) })
router.get('/', requireAuth, async (req, res, next) => { try { res.json({ alerts: await Alert.find(query(req)).sort({ riskLevel: -1, createdAt: -1 }).limit(50) }) } catch (e) { next(e) } })
router.get('/active', requireAuth, async (req, res, next) => { try { res.json({ alerts: await Alert.find(query(req)).sort({ createdAt: -1 }).limit(20) }) } catch (e) { next(e) } })
router.get('/unread', requireAuth, async (req, res, next) => { try { res.json({ alerts: await Alert.find({ ...query(req), isReadBy: { $ne: req.user._id } }).sort({ createdAt: -1 }) }) } catch (e) { next(e) } })
router.get('/:id', requireAuth, async (req, res, next) => { try { const alert = await Alert.findById(req.params.id); if (!alert) return res.status(404).json({ message: 'Alert not found.' }); res.json({ alert }) } catch (e) { next(e) } })
router.patch('/:id/read', requireAuth, async (req, res, next) => { try { await Alert.findByIdAndUpdate(req.params.id, { $addToSet: { isReadBy: req.user._id } }); res.json({ message: 'Alert marked as read.' }) } catch (e) { next(e) } })
router.patch('/read-all', requireAuth, async (req, res, next) => { try { await Alert.updateMany(query(req), { $addToSet: { isReadBy: req.user._id } }); res.json({ message: 'Alerts marked as read.' }) } catch (e) { next(e) } })
export default router
