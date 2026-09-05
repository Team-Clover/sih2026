import { Router } from 'express'
import SavedLocation from '../models/SavedLocation.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
router.use(requireAuth)
router.get('/', async (req, res, next) => { try { res.json({ locations: await SavedLocation.find({ userId: req.user._id }) }) } catch (e) { next(e) } })
router.post('/', async (req, res, next) => { try { res.status(201).json({ location: await SavedLocation.create({ ...req.body, userId: req.user._id }) }) } catch (e) { next(e) } })
router.delete('/:id', async (req, res, next) => { try { await SavedLocation.deleteOne({ _id: req.params.id, userId: req.user._id }); res.json({ message: 'Location removed.' }) } catch (e) { next(e) } })
export default router
