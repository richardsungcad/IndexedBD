// Main Application Logic

// DOM Elements - will be initialized when needed
let loginForm;
let registerForm;
let profileForm;
let addProductForm;
let editProductForm;
let searchInput;
let productImageInput;
let productImagePreview;
let editProductImageInput;
let editProductImagePreview;

let currentEditingProductId = null;

// Initialize DOM references
function initializeDOMElements() {
    if (loginForm) return; // Already initialized
    
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    profileForm = document.getElementById('profileForm');
    addProductForm = document.getElementById('addProductForm');
    editProductForm = document.getElementById('editProductForm');
    searchInput = document.getElementById('searchInput');
    productImageInput = document.getElementById('productImage');
    productImagePreview = document.getElementById('productImagePreview');
    editProductImageInput = document.getElementById('editProductImage');
    editProductImagePreview = document.getElementById('editProductImagePreview');
    
    console.log('DOM elements initialized');
}

// Initialize App
async function initApp() {
    try {
        console.log('Starting app initialization...');
        
        // Hide native splash screen immediately
        if (navigator.splashscreen) {
            console.log('Hiding native splash screen');
            navigator.splashscreen.hide();
        }

        // Initialize database with timeout
        try {
            await Promise.race([
                initDB(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 2000))
            ]);
            console.log('IndexedDB initialized successfully');
        } catch (dbError) {
            console.warn('Database initialization issue:', dbError.message);
            // Continue anyway - don't block on DB errors
        }

        // Check if user is logged in
        loadCurrentUser();
        console.log('Current user loaded');

        // Setup event listeners
        setupEventListeners();
        console.log('Event listeners setup complete');

        // Show appropriate page directly
        if (isLoggedIn()) {
            console.log('User is logged in, loading dashboard...');
            showPage('dashboardPage');
            loadProfileData().catch(e => console.warn('Profile load warning:', e));
        } else {
            console.log('User not logged in, showing login page...');
            showPage('loginPage');
        }
        console.log('App initialization complete');

    } catch (error) {
        console.error('App initialization error:', error);
        // Still show login page even on error
        showPage('loginPage');
        showAlert('Initialization warning: ' + error.message, 'error');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Initialize DOM elements first
    initializeDOMElements();
    
    // Login form
    loginForm?.addEventListener('submit', handleLogin);

    // Register form
    registerForm?.addEventListener('submit', handleRegister);

    // Profile form
    profileForm?.addEventListener('submit', handleProfileUpdate);

    // Add product form
    addProductForm?.addEventListener('submit', handleAddProduct);

    // Edit product form
    editProductForm?.addEventListener('submit', handleEditProduct);

    // Product image preview
    productImageInput?.addEventListener('change', handleProductImagePreview);
    editProductImageInput?.addEventListener('change', handleEditProductImagePreview);

    // Search
    searchInput?.addEventListener('input', handleSearch);
}

// Page Navigation - Query pages dynamically
function showPage(pageId) {
    // FIRST: Reset scroll position to top BEFORE showing new page
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Get all pages dynamically each time
    const pages = document.querySelectorAll('.page');
    
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));

    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
        console.log('Showing page:', pageId);
        
        // Refresh data when showing certain pages
        if (pageId === 'inventoryPage') {
            loadProducts();
        }
    } else {
        console.warn('Page not found:', pageId);
    }
}

// Toggle Password Visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.target.closest('.eye-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        icon.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

// ===== AUTHENTICATION HANDLERS =====

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAlert('Please fill all fields', 'error');
        return;
    }

    const result = await login(username, password);
    
    if (result.success) {
        showAlert(result.message, 'success');
        await loadProfileData();
        showPage('dashboardPage');
        loginForm.reset();
    } else {
        showAlert(result.message, 'error');
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();

    const fullName = document.getElementById('regFullName').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    const result = await register(fullName, username, password, confirmPassword);

    if (result.success) {
        showAlert('✓ Successfully Registered! Redirecting to login...', 'success');
        registerForm.reset();
        // Redirect to login page after showing notification
        setTimeout(() => {
            showPage('loginPage');
        }, 2000);
    } else {
        showAlert(result.message, 'error');
    }
}

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        clearCurrentUser();
        showAlert('Logout successful', 'success');
        // Go directly to login page
        showPage('loginPage');
    }
}

// ===== PROFILE HANDLERS =====

// Load Profile Data
// Load Profile Data
async function loadProfileData() {
    try {
        if (!isLoggedIn()) return;

        const user = getCurrentUserData();
        if (!user) return;

        // Safely update profile fields if they exist
        const fullNameEl = document.getElementById('profileFullName');
        if (fullNameEl) {
            // Support both new fullName and old firstName/lastName format
            fullNameEl.value = user.fullName || (user.firstName + ' ' + user.lastName) || '';
        }

        const usernameEl = document.getElementById('profileUsername');
        if (usernameEl) usernameEl.value = user.username || '';

        if (user.profilePic) {
            const profilePicEl = document.getElementById('profilePic');
            if (profilePicEl) profilePicEl.src = user.profilePic;
        }
        console.log('Profile data loaded');
    } catch (error) {
        console.warn('Error loading profile data:', error);
    }
}

// Change Profile Picture
function changeProfilePic() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                document.getElementById('profilePic').src = base64;
            } catch (error) {
                showAlert('Error loading image: ' + error.message, 'error');
            }
        }
    };
    
    input.click();
}

// Handle Profile Update
async function handleProfileUpdate(e) {
    e.preventDefault();

    const fullName = document.getElementById('profileFullName').value;
    const profilePic = document.getElementById('profilePic').src;

    const result = await updateUserProfile(fullName, profilePic);

    if (result.success) {
        showAlert(result.message, 'success');
        showPage('dashboardPage');
    } else {
        showAlert(result.message, 'error');
    }
}

// ===== PRODUCT HANDLERS =====

// Handle Product Image Preview
async function handleProductImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        try {
            const base64 = await fileToBase64(file);
            document.getElementById('productImagePreview').src = base64;
            document.getElementById('productImagePreview').style.display = 'block';
        } catch (error) {
            showAlert('Error loading image: ' + error.message, 'error');
        }
    }
}

// Handle Edit Product Image Preview
async function handleEditProductImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        try {
            const base64 = await fileToBase64(file);
            document.getElementById('editProductImagePreview').src = base64;
            document.getElementById('editProductImagePreview').style.display = 'block';
        } catch (error) {
            showAlert('Error loading image: ' + error.message, 'error');
        }
    }
}

// Handle Add Product
async function handleAddProduct(e) {
    e.preventDefault();

    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: document.getElementById('productPrice').value,
        quantity: document.getElementById('productQuantity').value,
        description: document.getElementById('productDescription').value,
        image: document.getElementById('productImagePreview').src !== '' ? 
               document.getElementById('productImagePreview').src : null
    };

    const result = await addProduct(productData);

    if (result.success) {
        showAlert(result.message, 'success');
        addProductForm.reset();
        document.getElementById('productImagePreview').style.display = 'none';
        await loadProducts();
        showPage('inventoryPage');
    } else {
        showAlert(result.message, 'error');
    }
}

// Load Products
async function loadProducts() {
    try {
        const products = await getUserProducts();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Error loading products: ' + error.message, 'error');
    }
}

// Display Products
function displayProducts(products) {
    const productList = document.getElementById('productList');
    const totalProducts = document.getElementById('totalProducts');

    productList.innerHTML = '';
    totalProducts.textContent = products.length;

    if (products.length === 0) {
        productList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 30px;">No products found. Add your first product!</p>';
        return;
    }

    products.forEach(product => {
        const card = createProductCard(product);
        productList.appendChild(card);
    });
}

// Create Product Card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const quantityClass = product.quantity < 5 ? 'low' : '';
    const statusText = product.quantity === 0 ? 'Out of Stock' : `Remaining Product: ${product.quantity}`;

    card.innerHTML = `
        <img src="${product.image || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'}" alt="${product.name}" class="product-image">
        <div class="product-body">
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-category">${escapeHtml(product.category)}</div>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="product-quantity ${quantityClass}">${statusText}</div>
            <div class="product-description">${escapeHtml(product.description || '')}</div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn-danger" onclick="deleteProductConfirm(${product.id})">Delete</button>
            </div>
        </div>
    `;

    return card;
}

// Edit Product
async function editProduct(productId) {
    try {
        const product = await ProductDB.getProductById(productId);
        
        if (!product) {
            showAlert('Product not found', 'error');
            return;
        }

        currentEditingProductId = productId;

        // Populate form
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductCategory').value = product.category;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductQuantity').value = product.quantity;
        document.getElementById('editProductDescription').value = product.description;

        if (product.image) {
            document.getElementById('editProductImagePreview').src = product.image;
            document.getElementById('editProductImagePreview').style.display = 'block';
        } else {
            document.getElementById('editProductImagePreview').style.display = 'none';
        }

        showPage('editProductPage');
    } catch (error) {
        console.error('Error loading product:', error);
        showAlert('Error loading product: ' + error.message, 'error');
    }
}

// Handle Edit Product
async function handleEditProduct(e) {
    e.preventDefault();

    if (!currentEditingProductId) {
        showAlert('Product ID not found', 'error');
        return;
    }

    const productData = {
        name: document.getElementById('editProductName').value,
        category: document.getElementById('editProductCategory').value,
        price: document.getElementById('editProductPrice').value,
        quantity: document.getElementById('editProductQuantity').value,
        description: document.getElementById('editProductDescription').value,
        image: document.getElementById('editProductImagePreview').src !== '' ? 
               document.getElementById('editProductImagePreview').src : null
    };

    const result = await updateProduct(currentEditingProductId, productData);

    if (result.success) {
        showAlert(result.message, 'success');
        editProductForm.reset();
        document.getElementById('editProductImagePreview').style.display = 'none';
        currentEditingProductId = null;
        await loadProducts();
        showPage('inventoryPage');
    } else {
        showAlert(result.message, 'error');
    }
}

// Delete Product Confirmation
function deleteProductConfirm(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        deleteProductAction(productId);
    }
}

// Delete Product Action
async function deleteProductAction(productId) {
    const result = await deleteProduct(productId);

    if (result.success) {
        showAlert(result.message, 'success');
        await loadProducts();
    } else {
        showAlert(result.message, 'error');
    }
}

// ===== SEARCH HANDLER =====

// Handle Search
async function handleSearch(e) {
    const query = e.target.value;
    const products = await searchProductsByQuery(query);
    displayProducts(products);
}

// ===== UTILITIES =====

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Show Alert Message
function showAlert(message, type) {
    const container = document.querySelector('.container') || document.body;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    container.insertBefore(alert, container.firstChild);

    setTimeout(() => {
        alert.remove();
    }, 4000);
}

// Wait for both DOM and Cordova to be ready
let domReady = false;
let cordovaReady = false;
let appInitialized = false;
let forcedStarted = false;

function tryInitializeApp() {
    if (!appInitialized && (domReady || cordovaReady || forcedStarted)) {
        appInitialized = true;
        console.log('Initializing app - DOM ready:', domReady, 'Cordova ready:', cordovaReady, 'Forced:', forcedStarted);
        initApp();
    }
}

// Wait for Cordova deviceready event
document.addEventListener('deviceready', function() {
    console.log('Cordova deviceready event fired');
    cordovaReady = true;
    tryInitializeApp();
}, false);

// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM content loaded');
        domReady = true;
        tryInitializeApp();
    });
} else {
    console.log('DOM already loaded');
    domReady = true;
    tryInitializeApp();
}

// First fallback: if app hasn't started after 1 second, force it
let firstTimeout = setTimeout(function() {
    if (!appInitialized) {
        console.warn('App initialization - first timeout at 1s, forcing start');
        forcedStarted = true;
        tryInitializeApp();
    }
}, 1000);

// Second fallback: if app STILL hasn't shown login page after 1.5 seconds, force it
setTimeout(function() {
    if (!appInitialized) {
        console.error('App initialization FAILED - forcing emergency start');
        clearTimeout(firstTimeout);
        appInitialized = true;
        forcedStarted = true;
        try {
            // Hide splash screen
            if (navigator.splashscreen) {
                navigator.splashscreen.hide();
            }
            // Show login page directly
            showPage('loginPage');
            console.log('Emergency: showing login page');
        } catch (e) {
            console.error('Emergency fallback error:', e);
        }
    }
}, 1500);
