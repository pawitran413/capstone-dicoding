const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  prediction: {
    class: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      required: true
    },
    allPredictions: [{
      class: String,
      confidence: Number
    }]
  },
  processingTime: {
    type: Number, // in milliseconds
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index untuk query yang efisien
predictionSchema.index({ userId: 1, createdAt: -1 });

const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = Prediction;
