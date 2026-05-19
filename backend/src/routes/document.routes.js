const express = require('express');
const router = express.Router();
const {
  getDocuments,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument
} = require('../controllers/document.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/').get(getDocuments).post(createDocument);
router.route('/:id').get(getDocument).put(updateDocument).delete(deleteDocument);

module.exports = router;
