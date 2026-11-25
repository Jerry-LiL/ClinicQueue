const express = require('express');
const { listDoctors, getDoctor, getMyDoctor, createDoctor } = require('../controllers/doctorController');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', listDoctors);
// /me must stay above /:id, otherwise Express treats "me" as an id.
router.get('/me', protect, allowRoles('doctor'), getMyDoctor);
router.get('/:id', getDoctor);
router.post('/', protect, allowRoles('admin'), createDoctor);

module.exports = router;
