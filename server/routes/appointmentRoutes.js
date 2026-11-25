const express = require('express');
const { book, list, reschedule, cancel } = require('../controllers/appointmentController');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', allowRoles('patient', 'doctor', 'admin'), list);
router.post('/', allowRoles('patient'), book);
router.put('/:id/reschedule', allowRoles('patient'), reschedule);
router.put('/:id/cancel', allowRoles('patient', 'doctor', 'admin'), cancel);

module.exports = router;
