const express = require('express');
const router = express.Router();
const {createCustomer,
getAllCustomers,
getCustomerById,
updateCustomer,
deleteCustomer,getPaginatedCustomers,searchCustomer} = require('../controllers/CustomerdController');

router.post('/create', createCustomer);
router.get('/pagination',getPaginatedCustomers)
router.get('/', getAllCustomers);
router.get('/search',searchCustomer);
router.get('/:id', getCustomerById);
router.put('/update/:id', updateCustomer);
router.delete('/delete/:id', deleteCustomer);

module.exports = router;
