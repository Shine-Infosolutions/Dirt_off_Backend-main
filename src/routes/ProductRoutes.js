const express = require('express');
const router = express.Router();
const {createProduct,
getAllProducts,
getProductById,
updateProduct,
deleteProduct,getPaginatedProducts,searchProduct}= require('../controllers/ProductController');

// Routes
router.post('/create', createProduct);
router.get('/pagination',getPaginatedProducts)
router.get('/', getAllProducts);
router.get('/search',searchProduct);
router.get('/:id', getProductById);
router.put('/update/:id', updateProduct);
router.delete('/delete/:id', deleteProduct);

module.exports = router;
