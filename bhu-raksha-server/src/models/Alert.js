import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema(
  {
    predictionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction', unique: true, sparse: true },
    title: String,
    state: String,
    district: String,
    riskLevel: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'VERY HIGH'] },
    probability: Number,
    aiProbability: Number,
    terrainAdjustment: Number,
    finalProbability: Number,
    message: String,
    data: mongoose.Schema.Types.Mixed,
    isReadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    expiresAt: Date,
  },
  { timestamps: true }
)

export default mongoose.model('Alert', alertSchema)
