const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const isLoggedIn = require('../middlewares/isLoggedIn.middleware');

// @route   POST /api/support/suggest
// @desc    Submit a feature suggestion
// @access  Private (logged-in users only)
router.post('/suggest', isLoggedIn, supportController.suggestFeature);

module.exports = router;
