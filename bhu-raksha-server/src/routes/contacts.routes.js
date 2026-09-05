import { Router } from 'express'
import EmergencyContact from '../models/EmergencyContact.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
router.use(requireAuth)
router.get('/', async (req, res, next) => { try { res.json({ contacts: await EmergencyContact.find({ userId: req.user._id }).limit(5) }) } catch (e) { next(e) } })
router.post('/', async (req, res, next) => { try { if (await EmergencyContact.countDocuments({ userId: req.user._id }) >= 5) return res.status(422).json({ message: 'You can save up to 5 contacts.' }); res.status(201).json({ contact: await EmergencyContact.create({ ...req.body, userId: req.user._id }) }) } catch (e) { next(e) } })
router.delete('/:id', async (req, res, next) => { try { await EmergencyContact.deleteOne({ _id: req.params.id, userId: req.user._id }); res.json({ message: 'Contact removed.' }) } catch (e) { next(e) } })
export default router
