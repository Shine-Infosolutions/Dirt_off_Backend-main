const express=require('express');
const router=express.Router();
const{createCustomerDetails,getCustomerDetails, updateCustomerDetails, getCustomerById, deleteCustomerById, searchCustomer, getAllCustomerPgination}=require('../controllers/CustomerController');

router.post('/create', createCustomerDetails);
router.get('/all', getCustomerDetails);

// ✅ Place static routes FIRST
router.get('/search', searchCustomer);
router.get('/pagination', getAllCustomerPgination);

// ✅ Then the dynamic ID-based routes LAST
router.put('/:id', updateCustomerDetails);
router.get('/:id', getCustomerById);
router.delete('/:id', deleteCustomerById);

module.exports=router;