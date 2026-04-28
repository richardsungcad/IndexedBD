// Products Module - CRUD Operations

// Convert image file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Add new product
async function addProduct(productData) {
    try {
        if (!currentUser) {
            return { success: false, message: 'User not logged in' };
        }

        // Validate required fields
        if (!productData.name || !productData.category || productData.price === '' || productData.quantity === '') {
            return { success: false, message: 'Please fill all required fields' };
        }

        // Create product object
        const newProduct = {
            name: productData.name.trim(),
            category: productData.category,
            price: parseFloat(productData.price),
            quantity: parseInt(productData.quantity),
            description: productData.description.trim(),
            image: productData.image || null,
            ownerUsername: currentUser.username,
            ownerName: `${currentUser.firstName} ${currentUser.lastName}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const productId = await ProductDB.addProduct(newProduct);
        newProduct.id = productId;

        return { success: true, message: 'Product added successfully', product: newProduct };
    } catch (error) {
        console.error('Add product error:', error);
        return { success: false, message: 'Failed to add product: ' + error.message };
    }
}

// Update product
async function updateProduct(productId, productData) {
    try {
        if (!currentUser) {
            return { success: false, message: 'User not logged in' };
        }

        // Get existing product
        const existingProduct = await ProductDB.getProductById(productId);
        if (!existingProduct) {
            return { success: false, message: 'Product not found' };
        }

        // Check ownership
        if (existingProduct.ownerUsername !== currentUser.username) {
            return { success: false, message: 'You can only edit your own products' };
        }

        // Validate required fields
        if (!productData.name || !productData.category || productData.price === '' || productData.quantity === '') {
            return { success: false, message: 'Please fill all required fields' };
        }

        // Update product
        const updatedProduct = {
            ...existingProduct,
            name: productData.name.trim(),
            category: productData.category,
            price: parseFloat(productData.price),
            quantity: parseInt(productData.quantity),
            description: productData.description.trim(),
            image: productData.image || existingProduct.image,
            updatedAt: new Date().toISOString()
        };

        await ProductDB.updateProduct(updatedProduct);

        return { success: true, message: 'Product updated successfully', product: updatedProduct };
    } catch (error) {
        console.error('Update product error:', error);
        return { success: false, message: 'Failed to update product: ' + error.message };
    }
}

// Delete product
async function deleteProduct(productId) {
    try {
        if (!currentUser) {
            return { success: false, message: 'User not logged in' };
        }

        // Get product
        const product = await ProductDB.getProductById(productId);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        // Check ownership
        if (product.ownerUsername !== currentUser.username) {
            return { success: false, message: 'You can only delete your own products' };
        }

        await ProductDB.deleteProduct(productId);

        return { success: true, message: 'Product deleted successfully' };
    } catch (error) {
        console.error('Delete product error:', error);
        return { success: false, message: 'Failed to delete product: ' + error.message };
    }
}

// Get all user products
async function getUserProducts() {
    try {
        if (!currentUser) {
            return [];
        }

        return await ProductDB.getProductsByOwner(currentUser.username);
    } catch (error) {
        console.error('Get user products error:', error);
        return [];
    }
}

// Search products
async function searchProductsByQuery(query) {
    try {
        if (!currentUser) {
            return [];
        }

        if (!query.trim()) {
            return await getUserProducts();
        }

        return await ProductDB.searchProducts(query, currentUser.username);
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

// Format price in Philippine Peso
function formatPrice(price) {
    return '₱' + parseFloat(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format quantity text
function formatQuantityText(quantity) {
    return `Remaining Product: ${quantity}`;
}

// Get quantity status
function getQuantityStatus(quantity) {
    if (quantity === 0) {
        return 'Out of Stock';
    } else if (quantity < 5) {
        return 'Low Stock';
    }
    return `${quantity} Available`;
}
