import mongoose from 'mongoose'
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, timestamp: { type: Date, default: Date.now }, latitude: Number, longitude: Number, state: String, district: String, status: { type: String, enum: ['ACTIVE', 'RESOLVED', 'CANCELLED'], default: 'ACTIVE' } })
export default mongoose.model('SOSEvent', schema)
