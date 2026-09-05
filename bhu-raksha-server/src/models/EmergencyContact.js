import mongoose from 'mongoose'
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, name: { type: String, required: true }, relationship: String, phone: { type: String, required: true } }, { timestamps: true })
export default mongoose.model('EmergencyContact', schema)
