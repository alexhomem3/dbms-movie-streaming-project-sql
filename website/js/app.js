/**
 * StreamFlix - Movie Streaming Platform
 * Standalone JavaScript Application
 */

// Data will be loaded from SQL file via dataLoader.js
// This is just an empty structure that gets populated from the SQL data
let sampleData = {
    movies: [],
    users: [],
    subscriptions: [],
    ratings: [],
    plans: [],
    watches: []
};

// Global variables
let currentSection = 'home';
let filteredMovies = [];

// Cache keys
const CACHE_KEYS = {
    DATA: 'streamflix_data',
    UI_STATE: 'streamflix_ui_state',
    FILTERED_MOVIES: 'streamflix_filtered_movies'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Save data to localStorage
 */
function saveCache() {
    try {
        localStorage.setItem(CACHE_KEYS.DATA, JSON.stringify(sampleData));
        localStorage.setItem(CACHE_KEYS.UI_STATE, JSON.stringify({
            currentSection: currentSection
        }));
        localStorage.setItem(CACHE_KEYS.FILTERED_MOVIES, JSON.stringify(filteredMovies));
        console.log('Data cached successfully');
    } catch (error) {
        console.error('Error saving cache:', error);
    }
}

/**
 * Load data from localStorage
 */
function loadCache() {
    try {
        const cachedData = localStorage.getItem(CACHE_KEYS.DATA);
        const cachedUIState = localStorage.getItem(CACHE_KEYS.UI_STATE);
        const cachedFilteredMovies = localStorage.getItem(CACHE_KEYS.FILTERED_MOVIES);
        
        if (cachedData) {
            sampleData = JSON.parse(cachedData);
            console.log('Data loaded from cache');
        }
        
        if (cachedUIState) {
            const uiState = JSON.parse(cachedUIState);
            currentSection = uiState.currentSection || 'home';
        }
        
        if (cachedFilteredMovies) {
            filteredMovies = JSON.parse(cachedFilteredMovies);
        } else {
            filteredMovies = [...sampleData.movies];
        }
        
        return cachedData !== null;
    } catch (error) {
        console.error('Error loading cache:', error);
        return false;
    }
}

/**
 * Clear cache (useful for resetting to SQL data)
 */
function clearCache() {
    localStorage.removeItem(CACHE_KEYS.DATA);
    localStorage.removeItem(CACHE_KEYS.UI_STATE);
    localStorage.removeItem(CACHE_KEYS.FILTERED_MOVIES);
    console.log('Cache cleared');
}

/**
 * Initialize the application
 */
async function initializeApp() {
    // First, try to load from cache
    const cacheLoaded = loadCache();
    
    if (!cacheLoaded) {
        // If no cache, try to load data from SQL
        const loaded = await initializeDataFromSQL();
        if (!loaded) {
            console.warn('Could not load data from SQL, using default sample data');
        } else {
            // Update filteredMovies after data loads
            filteredMovies = [...sampleData.movies];
        }
        // Save initial data to cache
        saveCache();
    }
    
    // Restore UI state
    if (currentSection) {
        showSection(currentSection);
    }
    
    // Load all UI components
    loadHomeData();
    loadMovies();
    loadUsers();
    loadSubscriptions();
    loadReports();
    initializeEventListeners();
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Movie search form
    const movieSearchForm = document.getElementById('movie-search-form');
    if (movieSearchForm) {
        movieSearchForm.addEventListener('submit', handleMovieSearch);
    }

    // Real-time search
    const searchInputs = document.querySelectorAll('.form-control');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(handleRealTimeSearch, 300));
    });
}

/**
 * Show section and update navigation
 */
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
        currentSection = sectionName;
        // Save UI state to cache
        saveCache();
    }

    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load section-specific data
    switch(sectionName) {
        case 'movies':
            loadMovies();
            break;
        case 'users':
            loadUsers();
            break;
        case 'subscriptions':
            loadSubscriptions();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

/**
 * Load home page data
 */
function loadHomeData() {
    // Update statistics
    document.getElementById('total-movies').textContent = sampleData.movies.length;
    document.getElementById('total-users').textContent = sampleData.users.length;
    document.getElementById('total-subscriptions').textContent = sampleData.subscriptions.length;
    
    // Calculate average rating
    const totalRatings = sampleData.ratings.reduce((sum, rating) => sum + rating.stars, 0);
    const avgRating = sampleData.ratings.length > 0 
        ? (totalRatings / sampleData.ratings.length).toFixed(1) 
        : '0.0';
    document.getElementById('total-ratings').textContent = avgRating;

    // Load recent movies
    loadRecentMovies();
}

/**
 * Load recent movies
 */
function loadRecentMovies() {
    const container = document.getElementById('recent-movies');
    if (!container) return;

    const recentMovies = sampleData.movies.slice(0, 4);
    
    container.innerHTML = recentMovies.map(movie => `
        <div class="col-md-3 mb-2">
            <div class="card movie-card h-100">
                <div class="card-body p-3">
                    <h6 class="card-title">${movie.title}</h6>
                    <p class="card-text small">
                        <i class="fas fa-calendar me-1"></i>
                        ${movie.releaseYear} • ${movie.genre}
                    </p>
                    <p class="card-text small">
                        <strong class="text-primary">${movie.length} min</strong>
                    </p>
                    <p class="card-text small">
                        <i class="fas fa-star me-1"></i>${movie.averageRating}/5
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-primary small">${movie.genre}</span>
                        <span class="badge bg-success small">${movie.averageRating}/5</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Load movies
 */
function loadMovies() {
    const container = document.getElementById('movies-grid');
    if (!container) return;

    container.innerHTML = filteredMovies.map(movie => `
        <div class="col-md-4 col-lg-3 mb-3">
            <div class="card movie-card h-100" style="cursor: pointer;" onclick="viewMovieDetails(${movie.id})">
                <div class="card-body p-3">
                    <h6 class="card-title">${movie.title}</h6>
                    <p class="card-text small">
                        <i class="fas fa-calendar me-1"></i>
                        ${movie.releaseYear} • ${movie.genre}
                    </p>
                    <p class="card-text small">
                        <strong class="text-primary">${movie.length} min</strong>
                    </p>
                    <p class="card-text small">
                        <i class="fas fa-star me-1"></i>${movie.averageRating}/5
                    </p>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-primary small">${movie.genre}</span>
                        <span class="badge bg-success small">${movie.averageRating}/5</span>
                    </div>
                </div>
                <div class="card-footer p-2" onclick="event.stopPropagation();">
                    <div class="row">
                        <div class="col-6">
                            <button class="btn btn-primary btn-sm w-100" onclick="event.stopPropagation(); viewMovieDetails(${movie.id})">
                                <i class="fas fa-play me-1"></i>Watch
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-warning btn-sm w-100" onclick="event.stopPropagation(); showAddRatingForm(${movie.id})">
                                <i class="fas fa-star me-1"></i>Rate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Load users
 */
function loadUsers() {
    const container = document.getElementById('users-table');
    if (!container) return;

    container.innerHTML = sampleData.users.map(user => {
        return `
        <tr>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.birthDate}</td>
            <td>${formatDate(user.signUpDate)}</td>
            <td><span class="badge bg-${getUserTypeColor(user.userType)}">${user.userType}</span></td>
            <td><span class="badge bg-success">${user.status}</span></td>
            <td class="table-actions">
                <button class="btn btn-sm btn-outline-info" onclick="viewWatchHistory('${user.email}')" title="View Watch History">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="editUser('${user.email}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.email}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

/**
 * Load subscriptions
 */
function loadSubscriptions() {
    const container = document.getElementById('subscriptions-table');
    if (!container) return;

    container.innerHTML = sampleData.subscriptions.map(subscription => {
        const user = sampleData.users.find(u => u.email === subscription.userEmail);
        const billingAddress = subscription.billingAddress;
        const paymentMethod = subscription.paymentMethod;
        
        return `
            <tr>
                <td>${user ? `${user.firstName} ${user.lastName}` : 'N/A'}</td>
                <td>${subscription.planName}</td>
                <td>${formatCurrency(subscription.monthlyPrice)}</td>
                <td>${subscription.maxScreens}</td>
                <td><span class="badge bg-${getStatusColor(subscription.status)}">${subscription.status}</span></td>
                <td>${formatDate(subscription.startDate)}</td>
                <td>${formatDate(subscription.endDate)}</td>
                <td>
                    <small>
                        ${billingAddress.street}<br>
                        ${billingAddress.city}, ${billingAddress.state} ${billingAddress.zipCode}${billingAddress.country ? '<br>' + billingAddress.country : ''}
                    </small>
                </td>
                <td>
                    <small>
                        <strong>${paymentMethod.type}</strong><br>
                        ${paymentMethod.cardNumber}<br>
                        Exp: ${paymentMethod.expiryDate}<br>
                        ${paymentMethod.cardHolder}
                    </small>
                </td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewSubscription(${subscription.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Load ratings
 */
function loadRatings() {
    const container = document.getElementById('ratings-table');
    if (!container) return;

    container.innerHTML = sampleData.ratings.map(rating => {
        const movie = sampleData.movies.find(m => m.id === rating.movieId);
        const user = sampleData.users.find(u => u.email === rating.userEmail);
        
        return `
            <tr>
                <td>${movie ? movie.title : 'N/A'}</td>
                <td>${user ? `${user.firstName} ${user.lastName}` : 'N/A'}</td>
                <td>
                    <div class="d-flex align-items-center">
                        ${generateStars(rating.stars)}
                        <span class="ms-2">${rating.stars}/5</span>
                    </div>
                </td>
                <td>${rating.reviewText ? rating.reviewText.substring(0, 50) + '...' : 'No review'}</td>
                <td>${formatDate(rating.ratingDate)}</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewRating(${rating.movieId}, ${rating.ratingId})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Load reports and charts
 */
function loadReports() {
    loadTopMovies();
    initializeCharts();
    updateAnalyticsStats();
}

/**
 * Update analytics statistics with actual data
 */
function updateAnalyticsStats() {
    // Update analytics cards with actual data
    document.getElementById('analytics-movies').textContent = sampleData.movies.length;
    document.getElementById('analytics-users').textContent = sampleData.users.length;
    document.getElementById('analytics-subscriptions').textContent = sampleData.subscriptions.length;
    
    // Calculate average rating from actual ratings data
    const totalRatings = sampleData.ratings.reduce((sum, rating) => sum + rating.stars, 0);
    const avgRating = (totalRatings / sampleData.ratings.length).toFixed(1);
    document.getElementById('analytics-rating').textContent = avgRating;
}

/**
 * Load top rated movie - display in fancy way
 */
function loadTopMovies() {
    const container = document.getElementById('top-movie-display');
    if (!container) return;

    // Sort movies by average rating and get the top one
    const topMovies = [...sampleData.movies].sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
        }
        return b.totalRatings - a.totalRatings;
    });
    
    if (topMovies.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No movies available</p>';
        return;
    }
    
    const topMovie = topMovies[0];
    
    // Create fancy display for top movie
    container.innerHTML = `
        <div class="row align-items-center">
            <div class="col-md-8">
                <div class="d-flex align-items-center mb-3">
                    <div class="me-3">
                        <i class="fas fa-trophy fa-3x text-warning"></i>
                    </div>
                    <div>
                        <h3 class="mb-1">${topMovie.title}</h3>
                        <p class="text-muted mb-2">
                            <span class="badge bg-primary me-2">${topMovie.genre}</span>
                            <span class="me-2"><i class="fas fa-calendar me-1"></i>${topMovie.releaseYear}</span>
                            <span><i class="fas fa-clock me-1"></i>${topMovie.length} min</span>
                        </p>
                <div class="d-flex align-items-center">
                            <div class="me-3">
                                ${generateStars(topMovie.averageRating)}
                </div>
                            <div>
                                <h4 class="mb-0 text-warning">${topMovie.averageRating}/5</h4>
                                <small class="text-muted">${topMovie.totalRatings} ${topMovie.totalRatings === 1 ? 'rating' : 'ratings'}</small>
                            </div>
                        </div>
                    </div>
                </div>
                <p class="text-muted mb-0">
                    <strong>Production:</strong> ${topMovie.productionCompany}
                </p>
            </div>
            <div class="col-md-4 text-center">
                <div class="bg-warning bg-opacity-10 rounded p-4 border border-warning">
                    <div class="mb-2">
                        <i class="fas fa-star fa-2x text-warning"></i>
                    </div>
                    <h2 class="text-warning mb-1">${topMovie.averageRating}</h2>
                    <p class="mb-0 small text-muted">Out of 5.0</p>
                    <div class="mt-2">
                        <span class="badge bg-warning text-dark">#1 Rated</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize charts
 */
function initializeCharts() {
    // Genre Distribution Chart
    const genreDistributionCtx = document.getElementById('genreDistributionChart');
    if (genreDistributionCtx) {
        const genreCounts = {};
        sampleData.movies.forEach(movie => {
            genreCounts[movie.genre] = (genreCounts[movie.genre] || 0) + 1;
        });

        new Chart(genreDistributionCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(genreCounts),
                datasets: [{
                    data: Object.values(genreCounts),
                    backgroundColor: ['#0066CC', '#FF6B35', '#FFD700', '#28a745', '#17a2b8', '#6c757d']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 8
                            },
                            boxWidth: 10,
                            padding: 5
                        }
                    }
                }
            }
        });
    }
}

/**
 * Handle movie search
 */
function handleMovieSearch(event) {
    event.preventDefault();
    
    const searchParams = {
        title: document.getElementById('search-title').value.trim(),
        genre: document.getElementById('search-genre').value,
        year: document.getElementById('search-year').value,
        length: document.getElementById('search-length').value,
        rating: document.getElementById('search-rating').value
    };

    filterMovies(searchParams);
}

/**
 * Filter movies based on search criteria
 */
function filterMovies(criteria) {
    filteredMovies = sampleData.movies.filter(movie => {
        // Filter by title
        if (criteria.title && !movie.title.toLowerCase().includes(criteria.title.toLowerCase())) {
            return false;
        }
        
        // Filter by genre
        if (criteria.genre && movie.genre !== criteria.genre) {
            return false;
        }
        
        // Filter by year range
        if (criteria.year) {
            const [startYear, endYear] = criteria.year.split('-').map(y => parseInt(y));
            if (movie.releaseYear < startYear || movie.releaseYear > endYear) {
            return false;
        }
        }
        
        // Filter by length range
        if (criteria.length) {
            const [minLength, maxLength] = criteria.length.split('-').map(l => parseInt(l));
            if (movie.length < minLength || movie.length > maxLength) {
                return false;
            }
        }
        
        // Filter by minimum rating
        if (criteria.rating && movie.averageRating < parseFloat(criteria.rating)) {
            return false;
        }
        
        return true;
    });

    // Save filteredMovies to cache
    saveCache();
    
    loadMovies();
}

/**
 * Clear search filters
 */
function clearMovieSearch() {
    document.getElementById('search-title').value = '';
    document.getElementById('search-genre').value = '';
    document.getElementById('search-year').value = '';
    document.getElementById('search-length').value = '';
    document.getElementById('search-rating').value = '';
    
    filteredMovies = [...sampleData.movies];
    
    // Save filteredMovies to cache
    saveCache();
    
    loadMovies();
}

/**
 * Handle real-time search
 */
function handleRealTimeSearch(event) {
    const query = event.target.value.toLowerCase();
    const movieCards = document.querySelectorAll('.movie-card');
    
    movieCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const isVisible = text.includes(query);
        card.closest('.col-md-6, .col-lg-4').style.display = isVisible ? 'block' : 'none';
    });
}

/**
 * Clear search
 */
function clearSearch() {
    document.getElementById('movie-search-form').reset();
    filteredMovies = [...sampleData.movies];
    loadMovies();
}

/**
 * View movie details - shows all information including ratings
 */
function viewMovieDetails(movieId) {
    const movie = sampleData.movies.find(m => m.id === movieId);
    if (!movie) return;
    
    // Get all ratings for this movie
    const movieRatings = sampleData.ratings.filter(r => r.movieId === movieId);
    
    const modal = new bootstrap.Modal(document.getElementById('movieDetailsModal'));
    
    // Build movie details content
    const detailsContent = document.getElementById('movie-details-content');
    detailsContent.innerHTML = `
        <div class="row mb-3">
            <div class="col-md-8">
                <h4>${movie.title}</h4>
                <p class="text-muted">${movie.description || `${movie.title} - A ${movie.genre} film from ${movie.releaseYear}.`}</p>
            </div>
            <div class="col-md-4 text-end">
                <div class="mb-2">
                    <span class="badge bg-primary fs-6">${movie.genre}</span>
                </div>
                <div class="mb-2">
                    <strong>${movie.averageRating}/5</strong> <i class="fas fa-star text-warning"></i>
                    <small class="text-muted">(${movie.totalRatings} ${movie.totalRatings === 1 ? 'rating' : 'ratings'})</small>
                </div>
            </div>
        </div>
        
        <hr>
        
        <div class="row mb-3">
            <div class="col-md-6">
                <h6>Movie Information</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Release Year:</strong></td>
                        <td>${movie.releaseYear}</td>
                    </tr>
                    <tr>
                        <td><strong>Length:</strong></td>
                        <td>${movie.length} minutes</td>
                    </tr>
                    <tr>
                        <td><strong>Genre:</strong></td>
                        <td>${movie.genre}</td>
                    </tr>
                    <tr>
                        <td><strong>Production Company:</strong></td>
                        <td>${movie.productionCompany}</td>
                    </tr>
                    <tr>
                        <td><strong>Average Rating:</strong></td>
                        <td>${movie.averageRating}/5 (${movie.totalRatings} ${movie.totalRatings === 1 ? 'rating' : 'ratings'})</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <hr>
        
        <div class="mb-3">
            <h6>Ratings & Reviews (${movieRatings.length})</h6>
            <div id="movie-ratings-list" class="mt-2">
                ${movieRatings.length === 0 
                    ? '<p class="text-muted">No ratings yet for this movie.</p>' 
                    : movieRatings.map(rating => {
                        const user = sampleData.users.find(u => u.email === rating.userEmail);
                        const userName = user ? `${user.firstName} ${user.lastName}` : rating.userEmail;
                        return `
                            <div class="card mb-2">
                                <div class="card-body p-3">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h6 class="mb-1">${userName}</h6>
                                            <small class="text-muted">${formatDate(rating.ratingDate)}</small>
                                        </div>
                                        <div class="text-end">
                                            <div class="d-flex align-items-center">
                                                ${generateStars(rating.stars)}
                                                <span class="ms-2 fw-bold">${rating.stars}/5</span>
                                            </div>
                                        </div>
                                    </div>
                                    ${rating.reviewText ? `<p class="mb-0 mt-2">${rating.reviewText}</p>` : '<p class="text-muted mb-0 mt-2"><em>No review provided</em></p>'}
                                </div>
                            </div>
                        `;
                    }).join('')}
            </div>
        </div>
    `;
    
    // Set up the "Add Rating" button
    const addRatingBtn = document.getElementById('add-rating-from-details-btn');
    addRatingBtn.onclick = () => {
        modal.hide();
        showAddRatingForm(movieId);
    };
    
    // Set up the "Delete Movie" button
    const deleteMovieBtn = document.getElementById('delete-movie-from-details-btn');
    deleteMovieBtn.onclick = () => {
        modal.hide();
        deleteMovie(movieId);
    };
    
    modal.show();
}

/**
 * Show add rating form
 */
function showAddRatingForm(movieId) {
    const movie = sampleData.movies.find(m => m.id === movieId);
    if (!movie) return;
    
    const modal = new bootstrap.Modal(document.getElementById('addRatingModal'));
    
    // Set movie info
    document.getElementById('rating-movie-id').value = movieId;
    document.getElementById('rating-movie-title').textContent = `Rate "${movie.title}"`;
    
    // Populate user dropdown
    const userSelect = document.getElementById('rating-user');
    userSelect.innerHTML = '<option value="">Select a user</option>';
    sampleData.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.email;
        option.textContent = `${user.firstName} ${user.lastName} (${user.email})`;
        userSelect.appendChild(option);
    });
    
    // Clear form
    document.getElementById('addRatingForm').reset();
    document.getElementById('rating-movie-id').value = movieId;
    document.getElementById('rating-movie-title').textContent = `Rate "${movie.title}"`;
    
    modal.show();
}

/**
 * Submit rating
 */
function submitRating() {
    const form = document.getElementById('addRatingForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const movieId = parseInt(document.getElementById('rating-movie-id').value);
    const userEmail = document.getElementById('rating-user').value;
    const stars = parseFloat(document.getElementById('rating-stars').value);
    const reviewText = document.getElementById('rating-review').value.trim() || null;
    
    // Get next rating ID for this movie
    const existingRatings = sampleData.ratings.filter(r => r.movieId === movieId);
    const nextRatingId = existingRatings.length > 0 
        ? Math.max(...existingRatings.map(r => r.ratingId)) + 1 
        : 1;
    
    // Get today's date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    // Create new rating
            const newRating = {
                movieId: movieId,
        ratingId: nextRatingId,
        userEmail: userEmail,
        stars: stars,
        reviewText: reviewText,
        ratingDate: todayString
            };
            
            sampleData.ratings.push(newRating);
    
    // Update movie average rating
    const movie = sampleData.movies.find(m => m.id === movieId);
    if (movie) {
        const movieRatings = sampleData.ratings.filter(r => r.movieId === movieId);
        movie.averageRating = movieRatings.reduce((sum, r) => sum + r.stars, 0) / movieRatings.length;
        movie.totalRatings = movieRatings.length;
    }
    
    // Save to cache
    saveCache();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addRatingModal'));
    modal.hide();
    
    // Refresh displays
    loadMovies();
            showNotification('Rating submitted successfully!', 'success');
        }

/**
 * Show add user form
 */
function showAddUserForm() {
    const userType = confirm('Is this a subscriber? (OK for subscriber, Cancel for free user)');
    
    if (userType) {
        // Show modal for subscriber
        showSubscriberModal();
    } else {
        // Use prompts for free user
        addFreeUser();
    }
}

/**
 * Show subscriber modal and populate plan dropdown
 */
function showSubscriberModal() {
    const modal = new bootstrap.Modal(document.getElementById('addSubscriberModal'));
    
    // Populate plan dropdown
    const planSelect = document.getElementById('subscriber-plan');
    planSelect.innerHTML = '<option value="">Select a plan</option>';
    sampleData.plans.forEach(plan => {
        const option = document.createElement('option');
        option.value = plan.planName;
        option.textContent = `${plan.planName} - $${plan.monthlyPrice}/month (${plan.maxScreens} screens)`;
        planSelect.appendChild(option);
    });
    
    // Set today's date as default start date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('subscription-startdate').value = `${year}-${month}-${day}`;
    
    // Clear form
    document.getElementById('addSubscriberForm').reset();
    document.getElementById('subscription-startdate').value = `${year}-${month}-${day}`;
    
    modal.show();
}

/**
 * Submit subscriber form
 */
function submitSubscriberForm() {
    const form = document.getElementById('addSubscriberForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const email = document.getElementById('subscriber-email').value;
    
    // Check if email already exists
    const existingUser = sampleData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        showNotification('User with this email already exists!', 'danger');
        return;
    }
    
    // Get today's date for sign up
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    // Create user
    const phoneNumber = document.getElementById('subscriber-phone').value;
    const phoneNumbers = phoneNumber ? [parseInt(phoneNumber.replace(/\D/g, ''))] : [];
    
    const newUser = {
        email: email,
        firstName: document.getElementById('subscriber-firstname').value,
        lastName: document.getElementById('subscriber-lastname').value,
        middleName: document.getElementById('subscriber-middlename').value || null,
        birthDate: document.getElementById('subscriber-birthdate').value || null,
        signUpDate: todayString,
        userType: 'subscriber',
        status: 'active',
        phoneNumbers: phoneNumbers
    };
    
    sampleData.users.push(newUser);
    
    // Create subscription
    const planName = document.getElementById('subscriber-plan').value;
    const plan = sampleData.plans.find(p => p.planName === planName);
    const startDate = document.getElementById('subscription-startdate').value;
    
    // Calculate end date (1 year from start)
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const endDateString = endDate.toISOString().split('T')[0];
    
    const cardNumber = document.getElementById('payment-cardnumber').value;
    const lastFour = cardNumber.slice(-4);
    
    const newSubscription = {
        id: sampleData.subscriptions.length > 0 
            ? Math.max(...sampleData.subscriptions.map(s => s.id)) + 1 
            : 1,
        userEmail: email,
        planName: planName,
        status: 'active',
        startDate: startDate,
        endDate: endDateString,
        monthlyPrice: plan.monthlyPrice,
        maxScreens: plan.maxScreens,
        billingAddress: {
            street: document.getElementById('billing-street').value,
            city: document.getElementById('billing-city').value,
            state: document.getElementById('billing-state').value,
            zipCode: document.getElementById('billing-zip').value
        },
        paymentMethod: {
            type: "Credit Card",
            cardNumber: `****-****-****-${lastFour}`,
            expiryDate: document.getElementById('payment-expiry').value,
            cardHolder: document.getElementById('payment-cardholder').value
        }
    };
    
    sampleData.subscriptions.push(newSubscription);
    
    // Save to cache
    saveCache();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addSubscriberModal'));
    modal.hide();
    
    // Refresh displays
    loadUsers();
    loadSubscriptions();
    loadHomeData();
    showNotification('Subscriber added successfully!', 'success');
}

/**
 * Add free user (using prompts)
 */
function addFreeUser() {
    const email = prompt('Enter email:');
    if (!email) return;
    
    // Check if email already exists
    const existingUser = sampleData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        showNotification('User with this email already exists!', 'danger');
        return;
    }
    
    const firstName = prompt('Enter first name:');
    if (!firstName) return;
    
    const lastName = prompt('Enter last name:');
    if (!lastName) return;
    
    const middleName = prompt('Enter middle name (optional):') || null;
    const birthDate = prompt('Enter birth date (YYYY-MM-DD):') || null;
    
    // Get today's date in YYYY-MM-DD format (local timezone - CDT)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    const newUser = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        middleName: middleName,
        birthDate: birthDate,
        signUpDate: todayString,
        userType: 'free_user',
        status: 'active',
        phoneNumbers: []
    };
    
    const trialEnd = prompt('Enter trial end date (YYYY-MM-DD):');
    if (trialEnd) {
        newUser.trialEndDate = trialEnd;
    }
    
    sampleData.users.push(newUser);
    
    // Save to cache
    saveCache();
    
    loadUsers();
    loadHomeData();
    showNotification('Free user added successfully!', 'success');
}

/**
 * Edit user - show modal
 */
function editUser(userEmail) {
    const user = sampleData.users.find(u => u.email === userEmail);
    if (!user) return;
    
    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    
    // Populate user fields
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-firstname').value = user.firstName;
    document.getElementById('edit-lastname').value = user.lastName;
    document.getElementById('edit-middlename').value = user.middleName || '';
    document.getElementById('edit-birthdate').value = user.birthDate || '';
    document.getElementById('edit-usertype').value = user.userType;
    document.getElementById('edit-phone').value = user.phoneNumbers && user.phoneNumbers.length > 0 ? user.phoneNumbers[0] : '';
    
    // Populate plan dropdown
    const planSelect = document.getElementById('edit-plan');
    planSelect.innerHTML = '<option value="">Select a plan</option>';
    sampleData.plans.forEach(plan => {
        const option = document.createElement('option');
        option.value = plan.planName;
        option.textContent = `${plan.planName} - $${plan.monthlyPrice}/month (${plan.maxScreens} screens)`;
        planSelect.appendChild(option);
    });
    
    // Get today's date for start date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    // Check if user has existing subscription
    const existingSubscription = sampleData.subscriptions.find(s => s.userEmail === userEmail);
    if (existingSubscription) {
        document.getElementById('edit-plan').value = existingSubscription.planName;
        // Always set start date to today
        document.getElementById('edit-subscription-startdate').value = todayString;
        document.getElementById('edit-billing-street').value = existingSubscription.billingAddress.street;
        document.getElementById('edit-billing-city').value = existingSubscription.billingAddress.city;
        document.getElementById('edit-billing-state').value = existingSubscription.billingAddress.state;
        document.getElementById('edit-billing-zip').value = existingSubscription.billingAddress.zipCode;
        document.getElementById('edit-payment-cardnumber').value = existingSubscription.paymentMethod.cardNumber.replace(/\*/g, '').replace(/-/g, '') || '';
        document.getElementById('edit-payment-expiry').value = existingSubscription.paymentMethod.expiryDate;
        document.getElementById('edit-payment-cardholder').value = existingSubscription.paymentMethod.cardHolder;
    } else {
        // Set start date to today for new subscriptions
        document.getElementById('edit-subscription-startdate').value = todayString;
    }
    
    // Set trial end date for free users
    if (user.trialEndDate) {
        document.getElementById('edit-trial-end').value = user.trialEndDate;
    }
    
    // Store current user email for form submission
    document.getElementById('editUserForm').dataset.userEmail = userEmail;
    
    // Toggle fields based on user type
    toggleSubscriptionFields();
    
    modal.show();
}

/**
 * Toggle subscription fields based on user type
 */
function toggleSubscriptionFields() {
    const userType = document.getElementById('edit-usertype').value;
    const subscriptionFields = document.getElementById('subscription-fields');
    const freeUserFields = document.getElementById('free-user-fields');
    
    if (userType === 'subscriber') {
        subscriptionFields.style.display = 'block';
        freeUserFields.style.display = 'none';
        
        // Always set start date to today when switching to subscriber
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        document.getElementById('edit-subscription-startdate').value = `${year}-${month}-${day}`;
        
        // Make subscription fields required
        document.getElementById('edit-plan').required = true;
        document.getElementById('edit-subscription-startdate').required = true;
        document.getElementById('edit-billing-street').required = true;
        document.getElementById('edit-billing-city').required = true;
        document.getElementById('edit-billing-state').required = true;
        document.getElementById('edit-billing-zip').required = true;
        document.getElementById('edit-payment-cardnumber').required = true;
        document.getElementById('edit-payment-expiry').required = true;
        document.getElementById('edit-payment-cardholder').required = true;
    } else {
        subscriptionFields.style.display = 'none';
        freeUserFields.style.display = 'block';
        // Remove required from subscription fields
        document.getElementById('edit-plan').required = false;
        document.getElementById('edit-subscription-startdate').required = false;
        document.getElementById('edit-billing-street').required = false;
        document.getElementById('edit-billing-city').required = false;
        document.getElementById('edit-billing-state').required = false;
        document.getElementById('edit-billing-zip').required = false;
        document.getElementById('edit-payment-cardnumber').required = false;
        document.getElementById('edit-payment-expiry').required = false;
        document.getElementById('edit-payment-cardholder').required = false;
    }
}

/**
 * Submit edit user form
 */
function submitEditUserForm() {
    const form = document.getElementById('editUserForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const userEmail = form.dataset.userEmail;
    const user = sampleData.users.find(u => u.email === userEmail);
    if (!user) return;
    
    const userType = document.getElementById('edit-usertype').value;
    const phoneNumber = document.getElementById('edit-phone').value;
    
    // Update user basic info
    user.firstName = document.getElementById('edit-firstname').value;
    user.lastName = document.getElementById('edit-lastname').value;
    user.middleName = document.getElementById('edit-middlename').value || null;
    user.birthDate = document.getElementById('edit-birthdate').value || null;
    user.phoneNumbers = phoneNumber ? [parseInt(phoneNumber.replace(/\D/g, ''))] : [];
    
    const wasSubscriber = user.userType === 'subscriber';
    const isNowSubscriber = userType === 'subscriber';
    
    // Handle user type change
    if (wasSubscriber && !isNowSubscriber) {
        // Remove from subscriber, convert to free user
        user.userType = 'free_user';
        user.trialEndDate = document.getElementById('edit-trial-end').value || null;
        // Remove subscription
        sampleData.subscriptions = sampleData.subscriptions.filter(s => s.userEmail !== userEmail);
    } else if (!wasSubscriber && isNowSubscriber) {
        // Convert free user to subscriber
        user.userType = 'subscriber';
        delete user.trialEndDate;
        // Create new subscription
        createSubscriptionFromEditForm(userEmail);
    } else if (isNowSubscriber) {
        // Update existing subscription or create new one
        const existingSubscription = sampleData.subscriptions.find(s => s.userEmail === userEmail);
        if (existingSubscription) {
            updateSubscriptionFromEditForm(userEmail, existingSubscription);
        } else {
            createSubscriptionFromEditForm(userEmail);
        }
    } else {
        // Free user staying as free user
        user.userType = 'free_user';
        user.trialEndDate = document.getElementById('edit-trial-end').value || null;
    }
    
    // Save to cache
    saveCache();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
    modal.hide();
    
    // Refresh displays
    loadUsers();
    loadSubscriptions();
    loadHomeData();
    showNotification('User updated successfully!', 'success');
}

/**
 * Create subscription from edit form
 */
function createSubscriptionFromEditForm(userEmail) {
    const planName = document.getElementById('edit-plan').value;
    const plan = sampleData.plans.find(p => p.planName === planName);
    const startDate = document.getElementById('edit-subscription-startdate').value;
    
    // Calculate end date (1 year from start)
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const endDateString = endDate.toISOString().split('T')[0];
    
    const cardNumber = document.getElementById('edit-payment-cardnumber').value;
    const lastFour = cardNumber.slice(-4);
    
    const newSubscription = {
        id: sampleData.subscriptions.length > 0 
            ? Math.max(...sampleData.subscriptions.map(s => s.id)) + 1 
            : 1,
        userEmail: userEmail,
        planName: planName,
        status: 'active',
        startDate: startDate,
        endDate: endDateString,
        monthlyPrice: plan.monthlyPrice,
        maxScreens: plan.maxScreens,
        billingAddress: {
            street: document.getElementById('edit-billing-street').value,
            city: document.getElementById('edit-billing-city').value,
            state: document.getElementById('edit-billing-state').value,
            zipCode: document.getElementById('edit-billing-zip').value
        },
        paymentMethod: {
            type: "Credit Card",
            cardNumber: `****-****-****-${lastFour}`,
            expiryDate: document.getElementById('edit-payment-expiry').value,
            cardHolder: document.getElementById('edit-payment-cardholder').value
        }
    };
    
    sampleData.subscriptions.push(newSubscription);
}

/**
 * Update subscription from edit form
 */
function updateSubscriptionFromEditForm(userEmail, subscription) {
    const planName = document.getElementById('edit-plan').value;
    const plan = sampleData.plans.find(p => p.planName === planName);
    const startDate = document.getElementById('edit-subscription-startdate').value;
    
    // Calculate end date (1 year from start)
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const endDateString = endDate.toISOString().split('T')[0];
    
    const cardNumber = document.getElementById('edit-payment-cardnumber').value;
    const lastFour = cardNumber.slice(-4);
    
    subscription.planName = planName;
    subscription.startDate = startDate;
    subscription.endDate = endDateString;
    subscription.monthlyPrice = plan.monthlyPrice;
    subscription.maxScreens = plan.maxScreens;
    subscription.billingAddress = {
        street: document.getElementById('edit-billing-street').value,
        city: document.getElementById('edit-billing-city').value,
        state: document.getElementById('edit-billing-state').value,
        zipCode: document.getElementById('edit-billing-zip').value
    };
    subscription.paymentMethod = {
        type: "Credit Card",
        cardNumber: `****-****-****-${lastFour}`,
        expiryDate: document.getElementById('edit-payment-expiry').value,
        cardHolder: document.getElementById('edit-payment-cardholder').value
    };
}

/**
 * Delete user
 */
function deleteUser(userEmail) {
    if (confirm('Are you sure you want to delete this user?')) {
        sampleData.users = sampleData.users.filter(u => u.email !== userEmail);
        // Also remove related subscriptions
        sampleData.subscriptions = sampleData.subscriptions.filter(s => s.userEmail !== userEmail);
        // Also remove related ratings
        sampleData.ratings = sampleData.ratings.filter(r => r.userEmail !== userEmail);
        
        // Save to cache
        saveCache();
        
        loadUsers();
        loadSubscriptions();
        loadHomeData();
        showNotification('User deleted successfully!', 'info');
    }
}

/**
 * Delete movie
 * Steps:
 * 1. Verify movie exists
 * 2. Remove ratings for that movie
 * 3. Remove from users' watch list
 * 4. Remove movie
 */
function deleteMovie(movieId) {
    // Step 1: Verify movie exists
    const movie = sampleData.movies.find(m => m.id === movieId);
    if (!movie) {
        showNotification('Movie not found!', 'danger');
        return;
    }
    
    const movieTitle = movie.title;
    
    if (!confirm(`Are you sure you want to delete "${movieTitle}"?\n\nThis will also remove:\n- All ratings for this movie\n- This movie from all users' watch history`)) {
        return;
    }
    
    // Step 2: Remove ratings for that movie
    const ratingsCount = sampleData.ratings.filter(r => r.movieId === movieId).length;
    sampleData.ratings = sampleData.ratings.filter(r => r.movieId !== movieId);
    
    // Step 3: Remove from users' watch list
    const watchesCount = sampleData.watches.filter(w => w.movieId === movieId).length;
    sampleData.watches = sampleData.watches.filter(w => w.movieId !== movieId);
    
    // Step 4: Remove movie
    sampleData.movies = sampleData.movies.filter(m => m.id !== movieId);
    
    // Update filteredMovies to reflect the deletion
    filteredMovies = [...sampleData.movies];
    
    // Save to cache
    saveCache();
    
    // Update UI
    loadMovies();
    loadHomeData();
    loadReports();
    
    showNotification(
        `Movie "${movieTitle}" deleted successfully!\nRemoved ${ratingsCount} rating(s) and ${watchesCount} watch record(s).`, 
        'info'
    );
}

/**
 * View watch history for a user
 */
function viewWatchHistory(userEmail) {
    const user = sampleData.users.find(u => u.email === userEmail);
    if (!user) return;
    
    // Get all movies watched by this user
    const watchedMovies = sampleData.watches
        .filter(w => w.email === userEmail)
        .map(w => {
            const movie = sampleData.movies.find(m => m.id === w.movieId);
            return movie;
        })
        .filter(m => m !== undefined); // Remove any undefined movies
    
    const modal = new bootstrap.Modal(document.getElementById('watchHistoryModal'));
    
    // Set user name with count
    const moviesCount = watchedMovies.length;
    document.getElementById('watch-history-user-name').textContent = 
        `Movies watched by ${user.firstName} ${user.lastName} (${moviesCount} ${moviesCount === 1 ? 'movie' : 'movies'})`;
    
    // Display watch history
    const historyList = document.getElementById('watch-history-list');
    if (watchedMovies.length === 0) {
        historyList.innerHTML = '<p class="text-muted text-center">No movies watched yet.</p>';
    } else {
        historyList.innerHTML = watchedMovies.map(movie => {
            return `
                <div class="card mb-2">
                    <div class="card-body p-3">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h6 class="mb-1">${movie.title}</h6>
                                <p class="text-muted mb-0 small">
                                    <span class="badge bg-primary me-2">${movie.genre}</span>
                                    <span class="me-2"><i class="fas fa-calendar me-1"></i>${movie.releaseYear}</span>
                                    <span><i class="fas fa-clock me-1"></i>${movie.length} min</span>
                                </p>
                            </div>
                            <div class="col-md-4 text-end">
                                <div class="d-flex align-items-center justify-content-end">
                                    ${generateStars(movie.averageRating)}
                                    <span class="ms-2 fw-bold">${movie.averageRating}/5</span>
                                </div>
                                <small class="text-muted">${movie.totalRatings} ${movie.totalRatings === 1 ? 'rating' : 'ratings'}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    modal.show();
}

/**
 * View subscription
 */
function viewSubscription(subscriptionId) {
    const subscription = sampleData.subscriptions.find(s => s.id === subscriptionId);
    if (subscription) {
        alert(`Subscription Details:\n\nPlan: ${subscription.planName}\nPrice: ${formatCurrency(subscription.monthlyPrice)}\nMax Screens: ${subscription.maxScreens}\nStatus: ${subscription.status}\nStart Date: ${formatDate(subscription.startDate)}\nEnd Date: ${formatDate(subscription.endDate)}`);
    }
}

/**
 * View rating
 */
function viewRating(movieId, ratingId) {
    const rating = sampleData.ratings.find(r => r.movieId === movieId && r.ratingId === ratingId);
    if (rating) {
        const movie = sampleData.movies.find(m => m.id === rating.movieId);
        const user = sampleData.users.find(u => u.email === rating.userEmail);
        
        alert(`Rating Details:\n\nMovie: ${movie ? movie.title : 'N/A'}\nUser: ${user ? `${user.firstName} ${user.lastName}` : 'N/A'}\nRating: ${rating.stars}/5\nReview: ${rating.reviewText || 'No review'}\nDate: ${formatDate(rating.ratingDate)}`);
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Generate star rating display
 */
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star text-warning"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star text-warning"></i>';
    }
    
    return stars;
}

/**
 * Get user type color
 */
function getUserTypeColor(type) {
    switch(type) {
        case 'subscriber': return 'success';
        case 'free_user': return 'primary';
        default: return 'secondary';
    }
}

/**
 * Get status color
 */
function getStatusColor(status) {
    switch(status) {
        case 'active': return 'success';
        case 'inactive': return 'danger';
        case 'pending': return 'warning';
        default: return 'secondary';
    }
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}