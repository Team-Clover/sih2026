import mongoose from 'mongoose'
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, name: String, state: String, district: String, latitude: Number, longitude: Number }, { timestamps: true })
export default mongoose.model('SavedLocation', schema)
