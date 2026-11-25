const express = require('express');
const { listSlots, createSlot, deleteSlot } = require('../controllers/slotController');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', listSlots);
router.post('/', protect, allowRoles('doctor', 'admin'), createSlot);
router.delete('/:id', protect, allowRoles('doctor', 'admin'), deleteSlot);

module.exports = router;
