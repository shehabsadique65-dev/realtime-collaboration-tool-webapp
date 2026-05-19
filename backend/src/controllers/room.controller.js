const Room = require('../models/Room');
const Document = require('../models/Document');

const createRoom = async (req, res) => {
  try {
    const { documentId } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    let room = await Room.findOne({ roomCode: document.roomCode });
    if (!room) {
      room = await Room.create({
        roomCode: document.roomCode,
        document: document._id,
        type: document.type,
        owner: req.user._id,
        activeUsers: []
      });
    }

    res.status(200).json({
      success: true,
      data: {
        roomCode: room.roomCode,
        type: room.type,
        documentId: room.document
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating room'
    });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({
        success: false,
        message: 'Room code is required'
      });
    }

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() })
      .populate('document');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found. Please check the room code.'
      });
    }

    const document = await Document.findById(room.document._id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document associated with this room no longer exists'
      });
    }

    if (!document.collaborators.includes(req.user._id) && document.owner.toString() !== req.user._id.toString()) {
      document.collaborators.push(req.user._id);
      await document.save();
    }

    res.status(200).json({
      success: true,
      data: {
        roomCode: room.roomCode,
        type: room.type,
        documentId: room.document._id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error joining room'
    });
  }
};

const getActiveUsers = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: room.activeUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching active users'
    });
  }
};

module.exports = { createRoom, joinRoom, getActiveUsers };
