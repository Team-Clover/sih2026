import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.bhu_token
    if (!token) return res.status(401).json({ message: 'Authentication required.' })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('-passwordHash')
    if (!user) return res.status(401).json({ message: 'Authentication required.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Authentication required.' })
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.bhu_token
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(payload.sub).select('-passwordHash')
      if (user) req.user = user
    }
  } catch {}
  next()
}

export function requireAdminApi(req, res, next) {
  if (!process.env.ADMIN_API_SECRET || req.get('x-admin-api-secret') !== process.env.ADMIN_API_SECRET)
    return res.status(401).json({ message: 'Unauthorized.' })
  next()
}
