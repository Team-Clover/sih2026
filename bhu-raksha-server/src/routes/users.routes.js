import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
router.get('/profile', requireAuth, (req, res) => res.json({ user: req.user }))
router.patch('/profile', requireAuth, async (req, res, next) => { try { const allowed = ['name', 'phone', 'state', 'district']; Object.assign(req.user, Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]))); await req.user.save(); res.json({ user: req.user }) } catch (e) { next(e) } })
export default router
