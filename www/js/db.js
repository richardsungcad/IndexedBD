// IndexedDB Database Manager
let db;

const dbConfig = {
    name: 'RichardMerchandiseHub',
    version: 1,
    stores: {
        users: {
            keyPath: 'id',
            autoIncrement: true,
            indexes: [
                { name: 'username', unique: true }
            ]
        },
        products: {
            keyPath: 'id',
            autoIncrement: true,
            indexes: [
                { name: 'name' },
                { name: 'category' },
                { name: 'ownerUsername' }
            ]
        }
    }
};

// Initialize Database
function initDB() {
    return new Promise((resolve, reject) => {
        console.log('Opening IndexedDB...');
        const request = indexedDB.open(dbConfig.name, dbConfig.version);

        // Set timeout to prevent hanging
        const dbTimeout = setTimeout(() => {
            console.warn('DB initialization timeout');
            reject(new Error('Database initialization timeout'));
        }, 3000);

        request.onerror = () => {
            clearTimeout(dbTimeout);
            console.error('Database error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            clearTimeout(dbTimeout);
            db = request.result;
            console.log('Database initialized successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            console.log('Database upgrade needed');
            db = event.target.result;

            // Create users store
            if (!db.objectStoreNames.contains('users')) {
                const userStore = db.createObjectStore('users', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                userStore.createIndex('username', 'username', { unique: true });
            }

            // Create products store
            if (!db.objectStoreNames.contains('products')) {
                const productStore = db.createObjectStore('products', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                productStore.createIndex('name', 'name');
                productStore.createIndex('category', 'category');
                productStore.createIndex('ownerUsername', 'ownerUsername');
            }

            console.log('Database upgraded successfully');
        };
    });
}

// User Operations
const UserDB = {
    // Add new user
    addUser: function(userData) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.add(userData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get user by username
    getUserByUsername: function(username) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('username');
            const request = index.get(username);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get user by ID
    getUserById: function(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Update user
    updateUser: function(userData) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.put(userData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Delete user
    deleteUser: function(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Get all users
    getAllUsers: function() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

// Product Operations
const ProductDB = {
    // Add new product
    addProduct: function(productData) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            const request = store.add(productData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get product by ID
    getProductById: function(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Update product
    updateProduct: function(productData) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            const request = store.put(productData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Delete product
    deleteProduct: function(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Get all products by owner
    getProductsByOwner: function(ownerUsername) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const index = store.index('ownerUsername');
            const request = index.getAll(ownerUsername);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get products by category
    getProductsByCategory: function(category) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const index = store.index('category');
            const request = index.getAll(category);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get all products
    getAllProducts: function() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Search products
    searchProducts: function(query, ownerUsername) {
        return new Promise(async (resolve, reject) => {
            try {
                const products = await this.getProductsByOwner(ownerUsername);
                const lowerQuery = query.toLowerCase();
                
                const filtered = products.filter(product => {
                    return (
                        product.name.toLowerCase().includes(lowerQuery) ||
                        product.category.toLowerCase().includes(lowerQuery) ||
                        product.price.toString().includes(lowerQuery) ||
                        (product.description && product.description.toLowerCase().includes(lowerQuery))
                    );
                });

                resolve(filtered);
            } catch (error) {
                reject(error);
            }
        });
    }
};
