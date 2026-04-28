// Authentication Module
let currentUser = null;

// Load current user from localStorage
function loadCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
    }
    return currentUser;
}

// Save current user to localStorage
function saveCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    currentUser = user;
}

// Clear current user
function clearCurrentUser() {
    localStorage.removeItem('currentUser');
    currentUser = null;
}

// Login function
async function login(username, password) {
    try {
        const user = await UserDB.getUserByUsername(username);
        
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.password !== password) {
            return { success: false, message: 'Invalid password' };
        }

        saveCurrentUser(user);
        return { success: true, message: 'Login successful', user: user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed: ' + error.message };
    }
}

// Register function
async function register(fullName, username, password, confirmPassword) {
    try {
        // Validate inputs
        if (!fullName.trim() || !username.trim() || !password.trim()) {
            return { success: false, message: 'All fields are required' };
        }

        if (password.length < 4) {
            return { success: false, message: 'Password must be at least 4 characters' };
        }

        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match' };
        }

        // Check if username already exists
        const existingUser = await UserDB.getUserByUsername(username);
        if (existingUser) {
            return { success: false, message: 'Username already exists' };
        }

        // Create new user object
        const newUser = {
            fullName: fullName.trim(),
            username: username.trim(),
            password: password, // In production, this should be hashed
            profilePic: null,
            createdAt: new Date().toISOString()
        };

        // Add user to database
        const userId = await UserDB.addUser(newUser);
        newUser.id = userId;

        saveCurrentUser(newUser);
        return { success: true, message: 'Registration successful', user: newUser };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Registration failed: ' + error.message };
    }
}

// Logout function
function logout() {
    clearCurrentUser();
    return { success: true, message: 'Logout successful' };
}

// Update user profile
async function updateUserProfile(fullName, profilePic) {
    try {
        if (!currentUser) {
            return { success: false, message: 'No user logged in' };
        }

        const updatedUser = {
            ...currentUser,
            fullName: fullName.trim(),
            profilePic: profilePic || currentUser.profilePic
        };

        await UserDB.updateUser(updatedUser);
        saveCurrentUser(updatedUser);

        return { success: true, message: 'Profile updated successfully', user: updatedUser };
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, message: 'Profile update failed: ' + error.message };
    }
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Get current username
function getCurrentUsername() {
    return currentUser ? currentUser.username : null;
}

// Get current user data
function getCurrentUserData() {
    return currentUser;
}
