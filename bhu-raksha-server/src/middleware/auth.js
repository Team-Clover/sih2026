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

export function requireAdminApi(req, res, next) {
  const secret = process.env.ADMIN_API_SECRET || 'bhu-raksha-local-admin-secret-2026';
  if (req.get('x-admin-api-secret') !== secret) return res.status(401).json({ message: 'Unauthorized.' })
  next()
}

