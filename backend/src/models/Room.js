const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    unique: true,
    required: true,
    length: 6
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  type: {
    type: String,
    enum: ['document', 'whiteboard'],
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activeUsers: [{
    userId: String,
    name: String,
    socketId: String,
    color: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);
