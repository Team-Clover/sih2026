import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { connectDB } from './config/db.js'
import User from './models/User.js'

const demo = { name: 'Demo Citizen', email: 'demo@bhuraksha.app', phone: '+919999999999', state: 'ASSAM', district: 'Kamrup' }
await connectDB()
const passwordHash = await bcrypt.hash('BhuRakshaDemo2026!', 12)
await User.findOneAndUpdate({ email: demo.email }, { ...demo, passwordHash }, { upsert: true, new: true, setDefaultsOnInsert: true })
console.log(`Demo account ready: ${demo.email}`)
console.log('Demo password: BhuRakshaDemo2026!')
process.exit(0)
