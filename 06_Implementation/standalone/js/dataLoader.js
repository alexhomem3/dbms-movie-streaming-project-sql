/**
 * Data Loader - Fetches and parses SQL data from GitHub repository
 */

const SQL_DATA_URL = 'https://raw.githubusercontent.com/alexhomem3/dbms-movie-streaming-project-sql/main/ProjectPhase3.sql';

/**
 * Fetch SQL data from GitHub or local file
 */
async function fetchSQLData() {
    // Try local file first (since we cloned the repo)
    const localData = await fetchLocalSQLData();
    if (localData) {
        return localData;
    }
    
    // Fallback to GitHub
    try {
        const response = await fetch(SQL_DATA_URL);
        const sqlText = await response.text();
        return parseSQLData(sqlText);
    } catch (error) {
        console.error('Error fetching SQL data from GitHub:', error);
        return null;
    }
}

/**
 * Fetch SQL data from local file
 */
async function fetchLocalSQLData() {
    try {
        // Try different possible paths
        const paths = [
            'data.sql',  // Local copy in standalone directory
            '../../dbms-movie-streaming-project-sql/ProjectPhase3.sql',
            '../../../dbms-movie-streaming-project-sql/ProjectPhase3.sql'
        ];
        
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const sqlText = await response.text();
                    console.log('Successfully loaded SQL from:', path);
                    return parseSQLData(sqlText);
                }
            } catch (e) {
                // Try next path
                continue;
            }
        }
        console.error('Could not find SQL file at any of the attempted paths');
        return null;
    } catch (error) {
        console.error('Error fetching local SQL data:', error);
        return null;
    }
}

/**
 * Parse SQL INSERT statements and extract data
 */
function parseSQLData(sqlText) {
    const data = {
        users: [],
        userPhones: {},
        freeUsers: {},
        subscribers: [],
        paymentMethods: {},
        billingAddresses: {},
        plans: [],
        subscriptions: [],
        subscriptionLinks: [],
        planLinks: {},
        movies: [],
        ratings: [],
        reviewTexts: {},
        watches: []
    };

    // Parse Users - handle multi-line INSERT statements
    const userMatches = sqlText.match(/INSERT INTO User[^;]*VALUES\s*([^;]+);/s);
    if (userMatches) {
        const values = userMatches[1].trim();
        // Extract all rows using regex to find complete parentheses groups
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            // Match: ('email', 'first', 'middle' or NULL, 'last', 'birth', 'signup')
            const match = row.match(/\('([^']+)',\s*'([^']+)',\s*(?:'([^']+)'|NULL),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/);
            if (match) {
                data.users.push({
                    email: match[1],
                    firstName: match[2],
                    middleName: match[3] || null,
                    lastName: match[4],
                    birthDate: match[5],
                    signUpDate: match[6]
                });
            }
        });
        console.log(`Parsed ${data.users.length} users`);
    }

    // Parse User Phone Numbers
    const phoneMatches = sqlText.match(/INSERT INTO user2[^;]*VALUES\s*([^;]+);/s);
    if (phoneMatches) {
        const values = phoneMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\('([^']+)',\s*(\d+)\)/);
            if (match) {
                if (!data.userPhones[match[1]]) {
                    data.userPhones[match[1]] = [];
                }
                data.userPhones[match[1]].push(parseInt(match[2]));
            }
        });
    }

    // Parse Free Users
    const freeUserMatches = sqlText.match(/INSERT INTO free_user[^;]*VALUES\s*([^;]+);/s);
    if (freeUserMatches) {
        const values = freeUserMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                data.freeUsers[match[1]] = match[2];
            }
        });
    }

    // Parse Subscribers
    const subscriberMatches = sqlText.match(/INSERT INTO subscriber[^;]*VALUES\s*([^;]+);/s);
    if (subscriberMatches) {
        const values = subscriberMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\('([^']+)'\)/);
            if (match) {
                data.subscribers.push(match[1]);
            }
        });
    }

    // Parse Payment Methods
    const paymentMatches = sqlText.match(/INSERT INTO subscriber2[^;]*VALUES\s*([^;]+);/s);
    if (paymentMatches) {
        const values = paymentMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\('([^']+)',\s*(\d+)\)/);
            if (match) {
                if (!data.paymentMethods[match[1]]) {
                    data.paymentMethods[match[1]] = [];
                }
                const cardNum = match[2].toString();
                data.paymentMethods[match[1]].push({
                    type: "Credit Card",
                    cardNumber: "****-****-****-" + cardNum.slice(-4),
                    fullNumber: cardNum
                });
            }
        });
    }

    // Parse Billing Addresses
    const addressMatches = sqlText.match(/INSERT INTO subscriber3[^;]*VALUES\s*([^;]+);/s);
    if (addressMatches) {
        const values = addressMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+)\)/);
            if (match) {
                if (!data.billingAddresses[match[1]]) {
                    data.billingAddresses[match[1]] = [];
                }
                data.billingAddresses[match[1]].push({
                    street: match[2],
                    city: match[3],
                    state: match[4],
                    zipCode: match[5]
                });
            }
        });
    }

    // Parse Plans
    const planMatches = sqlText.match(/INSERT INTO plan[^;]*VALUES\s*([^;]+);/s);
    if (planMatches) {
        const values = planMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\('([^']+)',\s*(\d+),\s*([\d.]+)\)/);
            if (match) {
                data.plans.push({
                    planName: match[1],
                    maxScreens: parseInt(match[2]),
                    monthlyPrice: parseFloat(match[3])
                });
            }
        });
    }

    // Parse Subscriptions
    const subMatches = sqlText.match(/INSERT INTO subscription[^;]*VALUES\s*([^;]+);/s);
    if (subMatches) {
        const values = subMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\((\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/);
            if (match) {
                data.subscriptions.push({
                    subId: parseInt(match[1]),
                    startDate: match[2],
                    endDate: match[3],
                    status: match[4]
                });
            }
        });
    }

    // Parse Subscription Links (has)
    const hasMatches = sqlText.match(/INSERT INTO has[^;]*VALUES\s*([^;]+);/s);
    if (hasMatches) {
        const values = hasMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\('([^']+)',\s*(\d+)\)/);
            if (match) {
                data.subscriptionLinks.push({
                    email: match[1],
                    subId: parseInt(match[2])
                });
            }
        });
    }

    // Parse Plan Links (to)
    const toMatches = sqlText.match(/INSERT INTO "to"[^;]*VALUES\s*([^;]+);/s);
    if (toMatches) {
        const values = toMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\((\d+),\s*'([^']+)'\)/);
            if (match) {
                data.planLinks[parseInt(match[1])] = match[2];
            }
        });
    }

    // Parse Movies
    const movieMatches = sqlText.match(/INSERT INTO movie[^;]*VALUES\s*([^;]+);/s);
    if (movieMatches) {
        const values = movieMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\((\d+),\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*'([^']+)'\)/);
            if (match) {
                data.movies.push({
                    id: parseInt(match[1]),
                    title: match[2],
                    productionCompany: match[3],
                    length: parseInt(match[4]),
                    releaseYear: parseInt(match[5]),
                    genre: match[6]
                });
            }
        });
        console.log(`Parsed ${data.movies.length} movies`);
    }

    // Parse Ratings
    const ratingMatches = sqlText.match(/INSERT INTO rating[^;]*VALUES\s*([^;]+);/s);
    if (ratingMatches) {
        const values = ratingMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\((\d+),\s*(\d+),\s*'([^']+)',\s*([\d.]+),\s*'([^']+)'\)/);
            if (match) {
                data.ratings.push({
                    movieId: parseInt(match[1]),
                    ratingId: parseInt(match[2]),
                    userEmail: match[3],
                    stars: parseFloat(match[4]),
                    ratingDate: match[5]
                });
            }
        });
    }

    // Parse Review Texts - handle escaped quotes in text
    const reviewMatches = sqlText.match(/INSERT INTO rating2[^;]*VALUES\s*([^;]+);/s);
    if (reviewMatches) {
        const values = reviewMatches[1].trim();
        const rowRegex = /\((\d+),\s*(\d+),\s*'((?:[^']|'')+)'\)/g;
        let match;
        while ((match = rowRegex.exec(values)) !== null) {
            const key = `${match[1]}_${match[2]}`;
            data.reviewTexts[key] = match[3].replace(/''/g, "'");
        }
        console.log(`Parsed ${Object.keys(data.reviewTexts).length} review texts`);
    }

    // Parse Watches
    const watchMatches = sqlText.match(/INSERT INTO watches[^;]*VALUES\s*([^;]+);/s);
    if (watchMatches) {
        const values = watchMatches[1].trim();
        const rowRegex = /\([^)]+\)/g;
        const rows = values.match(rowRegex) || [];
        rows.forEach(row => {
            const match = row.match(/\('([^']+)',\s*(\d+)\)/);
            if (match) {
                data.watches.push({
                    email: match[1],
                    movieId: parseInt(match[2])
                });
            }
        });
    }

    return data;
}

/**
 * Convert parsed SQL data to application format
 */
function convertToAppFormat(sqlData) {
    if (!sqlData) return null;

    // Convert users
    const users = sqlData.users.map(user => ({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        birthDate: user.birthDate,
        signUpDate: user.signUpDate,
        userType: sqlData.subscribers.includes(user.email) ? 'subscriber' : 
                  (sqlData.freeUsers[user.email] ? 'free_user' : 'user'),
        status: 'active',
        phoneNumbers: sqlData.userPhones[user.email] || [],
        trialEndDate: sqlData.freeUsers[user.email] || null
    }));

    // Convert movies with calculated ratings
    const movieRatings = {};
    sqlData.ratings.forEach(rating => {
        if (!movieRatings[rating.movieId]) {
            movieRatings[rating.movieId] = [];
        }
        movieRatings[rating.movieId].push(rating);
    });

    const movies = sqlData.movies.map(movie => {
        const ratings = movieRatings[movie.id] || [];
        const avgRating = ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length 
            : 0;
        
        return {
            id: movie.id,
            title: movie.title,
            productionCompany: movie.productionCompany,
            length: movie.length,
            releaseYear: movie.releaseYear,
            genre: movie.genre,
            description: `${movie.title} - A ${movie.genre} film from ${movie.releaseYear}.`,
            averageRating: avgRating,
            totalRatings: ratings.length
        };
    });

    // Convert subscriptions
    const subscriptions = sqlData.subscriptionLinks.map(link => {
        const subscription = sqlData.subscriptions.find(s => s.subId === link.subId);
        const planName = sqlData.planLinks[link.subId];
        const plan = sqlData.plans.find(p => p.planName === planName);
        const user = users.find(u => u.email === link.email);
        const addresses = sqlData.billingAddresses[link.email] || [];
        const payments = sqlData.paymentMethods[link.email] || [];

        return {
            id: subscription.subId,
            userEmail: link.email,
            planName: planName,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            monthlyPrice: plan ? plan.monthlyPrice : 0,
            maxScreens: plan ? plan.maxScreens : 0,
            billingAddress: addresses[0] || {
                street: "N/A",
                city: "N/A",
                state: "N/A",
                zipCode: "00000"
            },
            paymentMethod: payments[0] ? {
                type: payments[0].type,
                cardNumber: payments[0].cardNumber,
                expiryDate: "12/25",
                cardHolder: user ? `${user.firstName} ${user.lastName}` : "N/A"
            } : {
                type: "Credit Card",
                cardNumber: "****-****-****-0000",
                expiryDate: "12/25",
                cardHolder: user ? `${user.firstName} ${user.lastName}` : "N/A"
            }
        };
    });

    // Convert ratings
    const ratings = sqlData.ratings.map(rating => {
        const reviewKey = `${rating.movieId}_${rating.ratingId}`;
        return {
            movieId: rating.movieId,
            ratingId: rating.ratingId,
            userEmail: rating.userEmail,
            stars: rating.stars,
            reviewText: sqlData.reviewTexts[reviewKey] || null,
            ratingDate: rating.ratingDate
        };
    });

    return {
        users: users,
        movies: movies,
        subscriptions: subscriptions,
        ratings: ratings,
        plans: sqlData.plans
    };
}

/**
 * Initialize data from SQL
 */
async function initializeDataFromSQL() {
    try {
        console.log('Loading data from SQL...');
        const sqlData = await fetchSQLData();
        if (sqlData) {
            console.log('SQL data parsed:', sqlData);
            const appData = convertToAppFormat(sqlData);
            if (appData) {
                console.log('App data converted:', appData);
                // Completely replace global sampleData arrays
                sampleData.movies = appData.movies || [];
                sampleData.users = appData.users || [];
                sampleData.subscriptions = appData.subscriptions || [];
                sampleData.ratings = appData.ratings || [];
                sampleData.plans = appData.plans || [];
                // Update filteredMovies
                if (typeof filteredMovies !== 'undefined') {
                    filteredMovies = [...sampleData.movies];
                }
                console.log('Data loaded successfully!', {
                    movies: sampleData.movies.length,
                    users: sampleData.users.length,
                    subscriptions: sampleData.subscriptions.length,
                    ratings: sampleData.ratings.length
                });
                return true;
            } else {
                console.error('Failed to convert SQL data to app format');
            }
        } else {
            console.error('Failed to fetch or parse SQL data');
        }
    } catch (error) {
        console.error('Error initializing data from SQL:', error);
    }
    return false;
}

