import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  state: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  profilePhoto: String,
  notificationPreferences: { landslideAlerts: { type: Boolean, default: true }, emergencyAlerts: { type: Boolean, default: true }, safetyTips: { type: Boolean, default: true } },
}, { timestamps: true })
export default mongoose.model('User', userSchema)
