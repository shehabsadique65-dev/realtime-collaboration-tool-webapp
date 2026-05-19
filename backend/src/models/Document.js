const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Untitled Document',
    trim: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomCode: {
    type: String,
    unique: true,
    required: true,
    length: 6
  },
  type: {
    type: String,
    enum: ['document', 'whiteboard'],
    default: 'document'
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  whiteboardData: {
    type: Array,
    default: []
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

documentSchema.pre('save', function (next) {
  this.lastModified = Date.now();
  next();
});

module.exports = mongoose.model('Document', documentSchema);
