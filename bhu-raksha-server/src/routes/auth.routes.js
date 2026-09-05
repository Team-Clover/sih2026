import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24 * 7 }
function issue(res, user) { const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' }); res.cookie('bhu_token', token, cookieOptions) }
router.post('/signup', async (req, res, next) => { try { const { name, email, phone, password, confirmPassword, state, district } = req.body; if (!name || !email || !phone || !password || password !== confirmPassword || !state || !district || password.length < 8) return res.status(422).json({ message: 'Please complete all fields. Passwords must match and be at least 8 characters.' }); const exists = await User.exists({ email: email.toLowerCase().trim() }); if (exists) return res.status(409).json({ message: 'An account with this email already exists.' }); const user = await User.create({ name, email, phone, state, district, passwordHash: await bcrypt.hash(password, 12) }); issue(res, user); res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, state: user.state, district: user.district } }) } catch (error) { next(error) } })
router.post('/login', async (req, res, next) => { try { const user = await User.findOne({ email: req.body.email?.toLowerCase().trim() }).select('+passwordHash'); if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password.' }); issue(res, user); res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, state: user.state, district: user.district } }) } catch (error) { next(error) } })
router.post('/logout', (req, res) => { res.clearCookie('bhu_token', cookieOptions); res.json({ message: 'Logged out.' }) })
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))
export default router
