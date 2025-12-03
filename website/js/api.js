/**
 * StreamFlix API Client
 * Handles all communication with the backend server
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Generic API request handler
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// ============================================
// USER API
// ============================================

async function fetchUsers() {
    return apiRequest('/users');
}

async function createUser(userData) {
    return apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

async function updateUser(email, userData) {
    return apiRequest(`/users/${encodeURIComponent(email)}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
    });
}

async function deleteUserAPI(email) {
    return apiRequest(`/users/${encodeURIComponent(email)}`, {
        method: 'DELETE'
    });
}

// ============================================
// MOVIE API
// ============================================

async function fetchMovies() {
    return apiRequest('/movies');
}

async function deleteMovieAPI(movieId) {
    return apiRequest(`/movies/${movieId}`, {
        method: 'DELETE'
    });
}

// ============================================
// SUBSCRIPTION API
// ============================================

async function fetchSubscriptions() {
    return apiRequest('/subscriptions');
}

async function createSubscription(subscriptionData) {
    return apiRequest('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData)
    });
}

// ============================================
// RATING API
// ============================================

async function fetchRatings() {
    return apiRequest('/ratings');
}

async function createRating(ratingData) {
    return apiRequest('/ratings', {
        method: 'POST',
        body: JSON.stringify(ratingData)
    });
}

// ============================================
// PLAN API
// ============================================

async function fetchPlans() {
    return apiRequest('/plans');
}

// ============================================
// WATCHES API
// ============================================

async function fetchWatches() {
    return apiRequest('/watches');
}

// ============================================
// RAW TABLE DATA API (for Tables tab)
// ============================================

async function fetchTableData(tableName) {
    return apiRequest(`/tables/${tableName}`);
}

// ============================================
// LOAD ALL DATA
// ============================================

async function loadAllDataFromAPI() {
    try {
        const [users, movies, subscriptions, ratings, plans, watches] = await Promise.all([
            fetchUsers(),
            fetchMovies(),
            fetchSubscriptions(),
            fetchRatings(),
            fetchPlans(),
            fetchWatches()
        ]);
        
        return {
            users,
            movies,
            subscriptions,
            ratings,
            plans,
            watches
        };
    } catch (error) {
        console.error('Error loading data from API:', error);
        return null;
    }
}

// ============================================
// CHECK API HEALTH
// ============================================

async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

