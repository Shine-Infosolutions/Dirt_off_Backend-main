const express = require('express');
const router = express.Router();
const {createStaff,
getAllStaff,
getStaffById,
updateStaff,
deleteStaff,getPaginatedStaff,searchStaff}= require('../controllers/StaffController');

// Routes
router.post('/create', createStaff);
router.get('/pagination',getPaginatedStaff)
router.get('/', getAllStaff);
router.get('/search',searchStaff);
router.get('/:id', getStaffById);
router.put('/update/:id', updateStaff);
router.delete('/delete/:id', deleteStaff);

module.exports = router;
