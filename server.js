/**
 * StreamFlix Backend Server
 * Express.js server with MySQL database connection
 */

// Load environment variables from .env file (if it exists and dotenv is installed)
try {
    require('dotenv').config();
} catch (e) {
    // dotenv is optional - environment variables can be set directly or in server.js
    console.log('Note: dotenv not found. Using environment variables or defaults from server.js');
}

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'website')));

// MySQL Connection Configuration
// Update these values with your MySQL credentials
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',  // Use 127.0.0.1 instead of localhost for IPv4
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',  // Add your MySQL password here
    database: process.env.DB_NAME || 'streamflix',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

// Initialize database connection pool
async function initializeDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL database');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\n📝 Make sure to:');
        console.log('   1. Start MySQL server');
        console.log('   2. Create database: CREATE DATABASE streamflix;');
        console.log('   3. Run the SQL file: mysql -u root -p streamflix < dbms-movie-streaming-project-sql/ProjectPhase3.sql');
        console.log('   4. Update dbConfig in server.js with your MySQL credentials\n');
    }
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'StreamFlix API is running' });
});

// ============================================
// USERS
// ============================================

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT 
                u.email,
                u.first AS firstName,
                u.middle AS middleName,
                u.last AS lastName,
                u.birth_date AS birthDate,
                u.sign_up_date AS signUpDate,
                CASE 
                    WHEN s.email IS NOT NULL THEN 'subscriber'
                    WHEN f.email IS NOT NULL THEN 'free_user'
                    ELSE 'user'
                END AS userType,
                'active' AS status,
                f.trial_end_date AS trialEndDate
            FROM User u
            LEFT JOIN subscriber s ON u.email = s.email
            LEFT JOIN free_user f ON u.email = f.email
            ORDER BY u.sign_up_date DESC
        `);
        
        // Get phone numbers for each user
        const [phones] = await pool.query('SELECT email, phone_number FROM user2');
        const phoneMap = {};
        phones.forEach(p => {
            if (!phoneMap[p.email]) phoneMap[p.email] = [];
            phoneMap[p.email].push(p.phone_number);
        });
        
        users.forEach(user => {
            user.phoneNumbers = phoneMap[user.email] || [];
        });
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new user
app.post('/api/users', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { email, firstName, middleName, lastName, birthDate, signUpDate, userType, phoneNumber, trialEndDate } = req.body;
        
        // Insert into User table
        await connection.query(
            'INSERT INTO User (email, `first`, middle, `last`, birth_date, sign_up_date) VALUES (?, ?, ?, ?, ?, ?)',
            [email, firstName, middleName || null, lastName, birthDate || null, signUpDate]
        );
        
        // Insert phone number if provided
        if (phoneNumber) {
            await connection.query(
                'INSERT INTO user2 (email, phone_number) VALUES (?, ?)',
                [email, phoneNumber]
            );
        }
        
        // Insert into appropriate user type table
        if (userType === 'free_user') {
            await connection.query(
                'INSERT INTO free_user (email, trial_end_date) VALUES (?, ?)',
                [email, trialEndDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]]
            );
        } else if (userType === 'subscriber') {
            await connection.query('INSERT INTO subscriber (email) VALUES (?)', [email]);
        }
        
        await connection.commit();
        res.json({ success: true, message: 'User created successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Update user
app.put('/api/users/:email', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { email } = req.params;
        const { firstName, middleName, lastName, birthDate, phoneNumber } = req.body;
        
        await connection.query(
            'UPDATE User SET `first` = ?, middle = ?, `last` = ?, birth_date = ? WHERE email = ?',
            [firstName, middleName || null, lastName, birthDate || null, email]
        );
        
        // Update phone number
        if (phoneNumber !== undefined) {
            await connection.query('DELETE FROM user2 WHERE email = ?', [email]);
            if (phoneNumber) {
                await connection.query('INSERT INTO user2 (email, phone_number) VALUES (?, ?)', [email, phoneNumber]);
            }
        }
        
        await connection.commit();
        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Delete user
app.delete('/api/users/:email', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { email } = req.params;
        
        // Delete in proper order due to foreign keys
        await connection.query('DELETE FROM rating2 WHERE (movie_id, rating_id) IN (SELECT movie_id, rating_id FROM rating WHERE user_name = ?)', [email]);
        await connection.query('DELETE FROM rating WHERE user_name = ?', [email]);
        await connection.query('DELETE FROM watches WHERE email = ?', [email]);
        await connection.query('DELETE FROM subscriber3 WHERE email = ?', [email]);
        await connection.query('DELETE FROM subscriber2 WHERE email = ?', [email]);
        await connection.query('DELETE FROM has WHERE email = ?', [email]);
        await connection.query('DELETE FROM subscriber WHERE email = ?', [email]);
        await connection.query('DELETE FROM free_user WHERE email = ?', [email]);
        await connection.query('DELETE FROM user2 WHERE email = ?', [email]);
        await connection.query('DELETE FROM User WHERE email = ?', [email]);
        
        await connection.commit();
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ============================================
// MOVIES
// ============================================

// Get all movies with ratings
app.get('/api/movies', async (req, res) => {
    try {
        const [movies] = await pool.query(`
            SELECT 
                m.movie_id AS id,
                m.title,
                m.production_company AS productionCompany,
                m.length_of_movie AS length,
                m.release_year AS releaseYear,
                m.genre,
                COALESCE(ROUND(AVG(r.stars), 1), 0) AS averageRating,
                COUNT(r.rating_id) AS totalRatings
            FROM movie m
            LEFT JOIN rating r ON m.movie_id = r.movie_id
            GROUP BY m.movie_id, m.title, m.production_company, m.length_of_movie, m.release_year, m.genre
            ORDER BY m.title
        `);
        res.json(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete movie
app.delete('/api/movies/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        
        // Delete in proper order due to foreign keys
        await connection.query('DELETE FROM rating2 WHERE movie_id = ?', [id]);
        await connection.query('DELETE FROM rating WHERE movie_id = ?', [id]);
        await connection.query('DELETE FROM watches WHERE movie_id = ?', [id]);
        await connection.query('DELETE FROM movie WHERE movie_id = ?', [id]);
        
        await connection.commit();
        res.json({ success: true, message: 'Movie deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting movie:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ============================================
// SUBSCRIPTIONS
// ============================================

// Get all subscriptions
app.get('/api/subscriptions', async (req, res) => {
    try {
        const [subscriptions] = await pool.query(`
            SELECT 
                sub.sub_id AS id,
                h.email AS userEmail,
                t.plan_name AS planName,
                sub.status,
                sub.start_date AS startDate,
                sub.end_date AS endDate,
                p.monthly_price AS monthlyPrice,
                p.max_screens AS maxScreens
            FROM subscription sub
            JOIN has h ON sub.sub_id = h.sub_id
            JOIN \`to\` t ON sub.sub_id = t.sub_id
            JOIN plan p ON t.plan_name = p.plan_name
            ORDER BY sub.start_date DESC
        `);
        
        // Get billing addresses
        const [addresses] = await pool.query('SELECT * FROM subscriber3');
        const addressMap = {};
        addresses.forEach(a => {
            if (!addressMap[a.email]) addressMap[a.email] = [];
            addressMap[a.email].push({
                street: a.street,
                city: a.city,
                state: a.state,
                zipCode: a.zip.toString()
            });
        });
        
        // Get payment methods
        const [payments] = await pool.query('SELECT * FROM subscriber2');
        const paymentMap = {};
        payments.forEach(p => {
            if (!paymentMap[p.email]) paymentMap[p.email] = [];
            const cardNum = p.payment_method.toString();
            paymentMap[p.email].push({
                type: 'Credit Card',
                cardNumber: '****-****-****-' + cardNum.slice(-4),
                expiryDate: '12/25',
                cardHolder: 'Card Holder'
            });
        });
        
        subscriptions.forEach(sub => {
            sub.billingAddress = addressMap[sub.userEmail]?.[0] || { street: 'N/A', city: 'N/A', state: 'N/A', zipCode: '00000' };
            sub.paymentMethod = paymentMap[sub.userEmail]?.[0] || { type: 'Credit Card', cardNumber: '****-****-****-0000', expiryDate: '12/25', cardHolder: 'N/A' };
        });
        
        res.json(subscriptions);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create subscription for user
app.post('/api/subscriptions', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { userEmail, planName, startDate, billingAddress, paymentMethod } = req.body;
        
        // Get next sub_id
        const [[{ maxId }]] = await connection.query('SELECT COALESCE(MAX(sub_id), 0) + 1 AS maxId FROM subscription');
        
        // Calculate end date (1 year from start)
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        
        // Create subscription
        await connection.query(
            'INSERT INTO subscription (sub_id, start_date, end_date, status) VALUES (?, ?, ?, ?)',
            [maxId, startDate, endDate.toISOString().split('T')[0], 'active']
        );
        
        // Make sure user is a subscriber
        await connection.query('INSERT IGNORE INTO subscriber (email) VALUES (?)', [userEmail]);
        
        // Link subscriber to subscription
        await connection.query('INSERT INTO has (email, sub_id) VALUES (?, ?)', [userEmail, maxId]);
        
        // Link subscription to plan
        await connection.query('INSERT INTO `to` (sub_id, plan_name) VALUES (?, ?)', [maxId, planName]);
        
        // Add billing address
        if (billingAddress) {
            await connection.query(
                'INSERT INTO subscriber3 (email, street, city, `state`, zip) VALUES (?, ?, ?, ?, ?)',
                [userEmail, billingAddress.street, billingAddress.city, billingAddress.state, parseInt(billingAddress.zipCode)]
            );
        }
        
        // Add payment method
        if (paymentMethod && paymentMethod.cardNumber) {
            const cardNum = paymentMethod.cardNumber.replace(/\D/g, '');
            await connection.query(
                'INSERT INTO subscriber2 (email, payment_method) VALUES (?, ?)',
                [userEmail, cardNum]
            );
        }
        
        await connection.commit();
        res.json({ success: true, message: 'Subscription created successfully', subId: maxId });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ============================================
// RATINGS
// ============================================

// Get all ratings
app.get('/api/ratings', async (req, res) => {
    try {
        const [ratings] = await pool.query(`
            SELECT 
                r.movie_id AS movieId,
                r.rating_id AS ratingId,
                r.user_name AS userEmail,
                r.stars,
                r.date AS ratingDate,
                r2.review_text AS reviewText
            FROM rating r
            LEFT JOIN rating2 r2 ON r.movie_id = r2.movie_id AND r.rating_id = r2.rating_id
            ORDER BY r.date DESC
        `);
        res.json(ratings);
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create rating
app.post('/api/ratings', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { movieId, userEmail, stars, reviewText } = req.body;
        
        // Get next rating_id for this movie
        const [[{ maxId }]] = await connection.query(
            'SELECT COALESCE(MAX(rating_id), 0) + 1 AS maxId FROM rating WHERE movie_id = ?',
            [movieId]
        );
        
        const today = new Date().toISOString().split('T')[0];
        
        // Insert rating
        await connection.query(
            'INSERT INTO rating (movie_id, rating_id, user_name, stars, `date`) VALUES (?, ?, ?, ?, ?)',
            [movieId, maxId, userEmail, stars, today]
        );
        
        // Insert review text if provided
        if (reviewText) {
            await connection.query(
                'INSERT INTO rating2 (movie_id, rating_id, review_text) VALUES (?, ?, ?)',
                [movieId, maxId, reviewText]
            );
        }
        
        await connection.commit();
        res.json({ success: true, message: 'Rating added successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating rating:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ============================================
// PLANS
// ============================================

// Get all plans
app.get('/api/plans', async (req, res) => {
    try {
        const [plans] = await pool.query(`
            SELECT 
                plan_name AS planName,
                max_screens AS maxScreens,
                monthly_price AS monthlyPrice
            FROM plan
            ORDER BY monthly_price
        `);
        res.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// WATCHES
// ============================================

// Get all watches
app.get('/api/watches', async (req, res) => {
    try {
        const [watches] = await pool.query(`
            SELECT 
                email,
                movie_id AS movieId
            FROM watches
            ORDER BY email
        `);
        res.json(watches);
    } catch (error) {
        console.error('Error fetching watches:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// RAW TABLE DATA (for Tables tab)
// ============================================

// Get raw User table
app.get('/api/tables/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM User ORDER BY email');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw user2 table (phone numbers)
app.get('/api/tables/user2', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM user2 ORDER BY email');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw free_user table
app.get('/api/tables/free_users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM free_user ORDER BY email');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw subscriber table
app.get('/api/tables/subscribers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM subscriber ORDER BY email');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw subscriber2 table (payment methods)
app.get('/api/tables/subscriber2', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM subscriber2 ORDER BY email');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw subscriber3 table (billing addresses)
app.get('/api/tables/subscriber3', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM subscriber3 ORDER BY email');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw movie table
app.get('/api/tables/movies', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM movie ORDER BY movie_id');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw subscription table
app.get('/api/tables/subscriptions', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM subscription ORDER BY sub_id');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw plan table
app.get('/api/tables/plans', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM plan ORDER BY monthly_price');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw has table
app.get('/api/tables/has', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM has ORDER BY email');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw to table
app.get('/api/tables/to', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM `to` ORDER BY sub_id');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw rating table
app.get('/api/tables/ratings', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rating ORDER BY movie_id, rating_id');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw rating2 table (review texts)
app.get('/api/tables/rating2', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rating2 ORDER BY movie_id, rating_id');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get raw watches table
app.get('/api/tables/watches', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM watches ORDER BY email, movie_id');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'website', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log(`\n🎬 StreamFlix Server running at http://localhost:${PORT}`);
    console.log(`📁 Serving frontend from ./website`);
    await initializeDatabase();
});

