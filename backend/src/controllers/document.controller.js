const Document = require('../models/Document');
const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');

const generateRoomCode = () => {
  return uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
};

const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ owner: req.user._id })
      .sort({ lastModified: -1 })
      .populate('owner', 'name email');

    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching documents'
    });
  }
};

const createDocument = async (req, res) => {
  try {
    const { title, type } = req.body;
    const roomCode = generateRoomCode();

    const document = await Document.create({
      title: title || (type === 'whiteboard' ? 'Untitled Whiteboard' : 'Untitled Document'),
      type: type || 'document',
      owner: req.user._id,
      roomCode,
      content: type === 'whiteboard' ? null : { ops: [{ insert: '\n' }] },
      whiteboardData: []
    });

    const room = await Room.create({
      roomCode,
      document: document._id,
      type: document.type,
      owner: req.user._id,
      activeUsers: []
    });

    const populatedDoc = await Document.findById(document._id).populate('owner', 'name email');

    res.status(201).json({
      success: true,
      data: populatedDoc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating document'
    });
  }
};

const getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators', 'name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching document'
    });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { title, content, whiteboardData } = req.body;
    const updateData = { lastModified: Date.now() };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (whiteboardData !== undefined) updateData.whiteboardData = whiteboardData;

    const document = await Document.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating document'
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }

    await Room.findOneAndDelete({ roomCode: document.roomCode });
    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting document'
    });
  }
};

module.exports = { getDocuments, createDocument, getDocument, updateDocument, deleteDocument };
