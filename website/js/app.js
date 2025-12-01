/**
 * StreamFlix - Movie Streaming Platform
 * Standalone JavaScript Application
 */

// Data will be loaded from SQL file via dataLoader.js
// This is just an empty structure that gets populated from the SQL data
const sampleData = {
    movies: [],
    users: [],
    subscriptions: [],
    ratings: [],
    plans: []
};

// Global variables
let currentSection = 'home';
let filteredMovies = [...sampleData.movies];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
async function initializeApp() {
    // Try to load data from SQL first
    const loaded = await initializeDataFromSQL();
    if (!loaded) {
        console.warn('Could not load data from SQL, using default sample data');
    } else {
        // Update filteredMovies after data loads
        filteredMovies = [...sampleData.movies];
    }
    
    // Load all UI components
    loadHomeData();
    loadMovies();
    loadUsers();
    loadSubscriptions();
    loadRatings();
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
        case 'ratings':
            loadRatings();
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
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-primary small">${movie.genre}</span>
                        <span class="badge bg-success small">${movie.averageRating}/5</span>
                    </div>
                </div>
                <div class="card-footer p-2">
                    <div class="row">
                        <div class="col-6">
                            <button class="btn btn-primary btn-sm w-100" onclick="viewMovieDetails(${movie.id})">
                                <i class="fas fa-play me-1"></i>Watch
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-warning btn-sm w-100" onclick="rateMovie(${movie.id})">
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

    container.innerHTML = sampleData.users.map(user => `
        <tr>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.birthDate}</td>
            <td><span class="badge bg-${getUserTypeColor(user.userType)}">${user.userType}</span></td>
            <td><span class="badge bg-success">${user.status}</span></td>
            <td class="table-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="editUser('${user.email}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.email}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
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
 * Load top movies
 */
function loadTopMovies() {
    const container = document.getElementById('top-movies-table');
    if (!container) return;

    // Sort movies by average rating
    const topMovies = [...sampleData.movies].sort((a, b) => b.averageRating - a.averageRating);

    container.innerHTML = topMovies.map((movie, index) => `
        <tr>
            <td>
                <span class="badge bg-${index < 3 ? 'warning' : 'secondary'}">
                    #${index + 1}
                </span>
            </td>
            <td>${movie.title}</td>
            <td>${movie.genre}</td>
            <td>${movie.releaseYear}</td>
            <td>
                <div class="d-flex align-items-center">
                    ${generateStars(movie.averageRating)}
                    <span class="ms-2">${movie.averageRating}/5</span>
                </div>
            </td>
            <td>${movie.totalRatings}</td>
        </tr>
    `).join('');
}

/**
 * Initialize charts
 */
function initializeCharts() {
    // Monthly Views Chart
    const monthlyViewsCtx = document.getElementById('monthlyViewsChart');
    if (monthlyViewsCtx) {
        new Chart(monthlyViewsCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Movie Views',
                    data: [1200, 1500, 1800, 2200, 1900, 2500],
                    borderColor: '#0066CC',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4,
                    borderWidth: 3
                }, {
                    label: 'New Subscriptions',
                    data: [50, 75, 90, 120, 100, 150],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    borderWidth: 3,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 10
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: {
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

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
                                size: 10
                            }
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
    
    const formData = new FormData(event.target);
    const searchParams = {
        title: formData.get('search-title') || '',
        genre: formData.get('search-genre') || '',
        year: formData.get('search-year') || '',
        rating: formData.get('search-rating') || ''
    };

    filterMovies(searchParams);
}

/**
 * Filter movies based on search criteria
 */
function filterMovies(criteria) {
    filteredMovies = sampleData.movies.filter(movie => {
        if (criteria.title && !movie.title.toLowerCase().includes(criteria.title.toLowerCase())) {
            return false;
        }
        if (criteria.genre && movie.genre !== criteria.genre) {
            return false;
        }
        if (criteria.year && movie.releaseYear !== parseInt(criteria.year)) {
            return false;
        }
        if (criteria.rating && movie.averageRating < parseFloat(criteria.rating)) {
            return false;
        }
        return true;
    });

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
 * View movie details
 */
function viewMovieDetails(movieId) {
    const movie = sampleData.movies.find(m => m.id === movieId);
    if (movie) {
        alert(`Movie Details:\n\nTitle: ${movie.title}\nGenre: ${movie.genre}\nYear: ${movie.releaseYear}\nLength: ${movie.length} minutes\nRating: ${movie.averageRating}/5\nProduction: ${movie.productionCompany}\n\nDescription: ${movie.description}`);
    }
}

/**
 * Rate movie
 */
function rateMovie(movieId) {
    const movie = sampleData.movies.find(m => m.id === movieId);
    if (movie) {
        const stars = prompt(`Rate "${movie.title}" (1-5 stars):`);
        if (stars && stars >= 1 && stars <= 5) {
            const review = prompt('Leave a review (optional):');
            
            const newRating = {
                id: sampleData.ratings.length + 1,
                movieId: movieId,
                userId: 1, // Assuming current user
                stars: parseInt(stars),
                reviewText: review || '',
                ratingDate: new Date().toISOString().split('T')[0]
            };
            
            sampleData.ratings.push(newRating);
            loadRatings();
            showNotification('Rating submitted successfully!', 'success');
        }
    }
}

/**
 * Show add user form
 */
function showAddUserForm() {
    const email = prompt('Enter email:');
    if (!email) return;
    
    const firstName = prompt('Enter first name:');
    if (!firstName) return;
    
    const lastName = prompt('Enter last name:');
    if (!lastName) return;
    
    const middleName = prompt('Enter middle name (optional):') || null;
    const birthDate = prompt('Enter birth date (YYYY-MM-DD):') || null;
    const userType = confirm('Is this a subscriber? (OK for subscriber, Cancel for free user)') ? 'subscriber' : 'free_user';
    
    const newUser = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        middleName: middleName,
        birthDate: birthDate,
        signUpDate: new Date().toISOString().split('T')[0],
        userType: userType,
        status: 'active',
        phoneNumbers: []
    };
    
    if (userType === 'free_user') {
        const trialEnd = prompt('Enter trial end date (YYYY-MM-DD):');
        if (trialEnd) {
            newUser.trialEndDate = trialEnd;
        }
    }
    
    sampleData.users.push(newUser);
    loadUsers();
    loadHomeData();
    showNotification('User added successfully!', 'success');
}

/**
 * Edit user
 */
function editUser(userEmail) {
    const user = sampleData.users.find(u => u.email === userEmail);
    if (user) {
        const newFirstName = prompt(`Edit first name (current: ${user.firstName}):`, user.firstName);
        if (newFirstName && newFirstName !== user.firstName) {
            user.firstName = newFirstName;
        }
        
        const newLastName = prompt(`Edit last name (current: ${user.lastName}):`, user.lastName);
        if (newLastName && newLastName !== user.lastName) {
            user.lastName = newLastName;
        }
        
        const newBirthDate = prompt(`Edit birth date (current: ${user.birthDate}):`, user.birthDate);
        if (newBirthDate && newBirthDate !== user.birthDate) {
            user.birthDate = newBirthDate;
        }
        
        loadUsers();
        showNotification('User updated successfully!', 'success');
    }
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
        loadUsers();
        loadSubscriptions();
        loadRatings();
        loadHomeData();
        showNotification('User deleted successfully!', 'info');
    }
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