const express = require('express');
const router = express.Router();

const {createService,getAllServices,getServiceById,updateService,deleteService,getPaginatedServices,searchService}=require('../controllers/ServiceController');
// Routes
router.post('/create',createService);
router.get('/pagination',getPaginatedServices)
router.get('/',getAllServices);
router.get('/search',searchService);
router.get('/:id',getServiceById);
router.put('/update/:id',updateService);
router.delete('/delete/:id',deleteService);

module.exports = router;
