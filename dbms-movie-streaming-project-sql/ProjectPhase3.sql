-- Project Phase 3
-- CS 3265
-- Fall 2025
-- Professor Dan Lin
-- Group 12: Alex Homem, Kyle Rosenberg, Prince Owusu-Nkrumah
-- Database Description: A movie streaming platform to manage users, subscriptions, movies, plans, and ratings

------------- 
-- Creating Application Tables
-------------

-- 1. USERS

CREATE TABLE User (
    email varchar(255) PRIMARY KEY,
    "first" varchar(50) NOT NULL,
    middle varchar(50),
    "last" varchar(50) NOT NULL,
    birth_date date,
    sign_up_date date NOT NULL
);

CREATE TABLE user2 (
    email varchar(255),
    phone_number integer,
    PRIMARY KEY (email, phone_number),
    FOREIGN KEY (email) REFERENCES User(email)
);

CREATE TABLE free_user (
    email varchar(255) PRIMARY KEY,
    trial_end_date date NOT NULL,
    FOREIGN KEY (email) REFERENCES User(email)
);

-- 2. SUBSCRIBERS 

CREATE TABLE subscriber (
    email varchar(255) PRIMARY KEY,
    FOREIGN KEY (email) REFERENCES User(email)
);

-- Payment_method is a multi-valued attribute 
CREATE TABLE subscriber2 (
    email varchar(255),
    payment_method INTEGER NOT NULL,
    PRIMARY KEY (email, payment_method),
    FOREIGN KEY (email) REFERENCES subscriber(email)
);

-- billing_address is a multi-valued and composite attribute 
CREATE TABLE subscriber3 (
    email varchar(255),
    street varchar(255),
    city varchar(100),
    "state" varchar(50),
    zip INTEGER NOT NULL
        -- Enforce allowed values
        CHECK (zip BETWEEN 00000 AND 99999),
    PRIMARY KEY (email, street, city, "state", zip),
    FOREIGN KEY (email) REFERENCES subscriber(email)
);

-- 3. SUBSCRIPTIONS & PLANS

CREATE TABLE subscription (
    sub_id integer PRIMARY KEY,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status varchar(20) NOT NULL
        -- Enforce allowed values 
        CHECK (status IN ('active','inactive','canceled'))
);

CREATE TABLE plan (
    plan_name varchar(100) PRIMARY KEY,
    max_screens integer NOT NULL,
    monthly_price decimal(6,2) NOT NULL
);

-- Link subscriber -> subscription (a subscriber "has" subscriptions)
CREATE TABLE has (
    email varchar(255),
    sub_id integer,
    PRIMARY KEY (email, sub_id),
    FOREIGN KEY (email) REFERENCES subscriber(email),
    FOREIGN KEY (sub_id) REFERENCES subscription(sub_id)
);

-- Link subscription -> plan (subscription is "to" a plan)
CREATE TABLE "to" (
    sub_id integer,
    plan_name varchar(100),
    PRIMARY KEY (sub_id, plan_name),
    FOREIGN KEY (sub_id) REFERENCES subscription(sub_id),
    FOREIGN KEY (plan_name) REFERENCES plan(plan_name)
);

-- 4. MOVIES & RATINGS

CREATE TABLE movie (
    movie_id integer PRIMARY KEY,
    title varchar(255) NOT NULL,
    production_company varchar(255) NOT NULL,
    length_of_movie integer NOT NULL, -- in minutes
    release_year integer NOT NULL,
    genre varchar(100) NOT NULL
);

CREATE TABLE rating (
    movie_id integer,
    rating_id integer,
    user_name varchar(255) NOT NULL,
    stars decimal(2,1) NOT NULL
        CHECK (stars > 0 AND stars <= 5),
    "date" date NOT NULL,
    PRIMARY KEY (movie_id, rating_id),
    FOREIGN KEY (movie_id) REFERENCES movie(movie_id),
    FOREIGN KEY (user_name) REFERENCES User(email) -- the rating is given by a user
);

CREATE TABLE rating2 (
    movie_id integer,
    rating_id integer,
    review_text varchar(2000),
    PRIMARY KEY (movie_id, rating_id),
    FOREIGN KEY (movie_id, rating_id) REFERENCES rating(movie_id, rating_id)
);


-- Link user -> movie (a user "watches" movie)
CREATE TABLE watches (
    email varchar(255),
    movie_id integer,
    PRIMARY KEY (email, movie_id),
    FOREIGN KEY (email) REFERENCES User(email),
    FOREIGN KEY (movie_id) REFERENCES movie(movie_id)
);


------------- 
-- Populating Tables
-------------

-- 1. Insert Users
INSERT INTO User (email, "first", middle, "last", birth_date, sign_up_date) VALUES
('john.smith@email.com', 'John', 'Michael', 'Smith', '1990-05-15', '2024-01-10'),
('sarah.jones@email.com', 'Sarah', NULL, 'Jones', '1985-08-22', '2024-02-14'),
('mike.wilson@email.com', 'Mike', 'David', 'Wilson', '1992-11-30', '2024-03-05'),
('emma.davis@email.com', 'Emma', 'Rose', 'Davis', '1995-03-18', '2024-01-20'),
('alex.brown@email.com', 'Alex', NULL, 'Brown', '1988-07-09', '2024-04-01');

-- 2. Insert User Phone Numbers (multi-valued attribute)
INSERT INTO user2 (email, phone_number) VALUES
('john.smith@email.com', 5551234567),
('john.smith@email.com', 5559876543),
('sarah.jones@email.com', 5552345678),
('mike.wilson@email.com', 5553456789),
('emma.davis@email.com', 5554567890);

-- 3. Insert Free Users
INSERT INTO free_user (email, trial_end_date) VALUES
('alex.brown@email.com', '2024-04-15'),
('emma.davis@email.com', '2024-02-05');

-- 4. Insert Subscribers
INSERT INTO subscriber (email) VALUES
('john.smith@email.com'),
('sarah.jones@email.com'),
('mike.wilson@email.com');

-- 5. Insert Payment Methods (multi-valued attribute)
INSERT INTO subscriber2 (email, payment_method) VALUES
('john.smith@email.com', 1234567890123456),
('sarah.jones@email.com', 2345678901234567),
('sarah.jones@email.com', 3456789012345678),
('mike.wilson@email.com', 4567890123456789);

-- 6. Insert Billing Addresses (multi-valued composite attribute)
INSERT INTO subscriber3 (email, street, city, "state", zip) VALUES
('john.smith@email.com', '123 Main St', 'Nashville', 'Tennessee', 37203),
('john.smith@email.com', '456 Oak Ave', 'Nashville', 'Tennessee', 37205),
('sarah.jones@email.com', '789 Elm Street', 'Memphis', 'Tennessee', 38103),
('mike.wilson@email.com', '321 Pine Road', 'Knoxville', 'Tennessee', 37902);

-- 7. Insert Plans
INSERT INTO plan (plan_name, max_screens, monthly_price) VALUES
('Basic', 1, 9.99),
('Standard', 2, 14.99),
('Premium', 4, 19.99),
('Family', 6, 24.99);

-- 8. Insert Subscriptions
INSERT INTO subscription (sub_id, start_date, end_date, status) VALUES
(1, '2024-01-10', '2025-01-10', 'active'),
(2, '2024-02-14', '2025-02-14', 'active'),
(3, '2024-03-05', '2024-09-05', 'canceled'),
(4, '2024-03-05', '2025-03-05', 'active'),
(5, '2023-12-01', '2024-12-01', 'inactive');

-- 9. Link Subscribers to Subscriptions (has)
INSERT INTO has (email, sub_id) VALUES
('john.smith@email.com', 1),
('sarah.jones@email.com', 2),
('mike.wilson@email.com', 3),
('mike.wilson@email.com', 4);

-- 10. Link Subscriptions to Plans (to)
INSERT INTO "to" (sub_id, plan_name) VALUES
(1, 'Premium'),
(2, 'Standard'),
(3, 'Basic'),
(4, 'Premium'),
(5, 'Standard');

-- 11. Insert Movies
INSERT INTO movie (movie_id, title, production_company, length_of_movie, release_year, genre) VALUES
(1, 'The Dark Knight', 'Warner Bros', 152, 2008, 'Action'),
(2, 'Inception', 'Warner Bros', 148, 2010, 'Sci-Fi'),
(3, 'The Shawshank Redemption', 'Columbia Pictures', 142, 1994, 'Drama'),
(4, 'Pulp Fiction', 'Miramax', 154, 1994, 'Crime'),
(5, 'Interstellar', 'Paramount Pictures', 169, 2014, 'Sci-Fi'),
(6, 'Jack and Jill', 'Happy Madison Productions', 91, 2011, 'Comedy');

-- 12. Insert Ratings
INSERT INTO rating (movie_id, rating_id, user_name, stars, "date") VALUES
(1, 1, 'john.smith@email.com', 5.0, '2024-01-15'),
(1, 2, 'sarah.jones@email.com', 4.5, '2024-02-20'),
(2, 1, 'john.smith@email.com', 5.0, '2024-01-25'),
(3, 1, 'mike.wilson@email.com', 5.0, '2024-03-10'),
(4, 1, 'sarah.jones@email.com', 4.0, '2024-02-28'),
(5, 1, 'emma.davis@email.com', 4.5, '2024-01-30'),
(6, 1, 'emma.davis@email.com', 1.0, '2024-01-30');


-- 13. Insert Review Texts
INSERT INTO rating2 (movie_id, rating_id, review_text) VALUES
(1, 1, 'Absolutely incredible! Heath Ledger''s performance as the Joker is unforgettable. Best superhero movie ever made.'),
(1, 2, 'Great movie with amazing action sequences and a compelling story. Christopher Nolan at his finest.'),
(2, 1, 'Mind-bending and visually stunning. Had to watch it twice to fully understand the plot!'),
(6, 1, 'This is the worst movie of all time!'),
(3, 1, 'A masterpiece of storytelling. The friendship and hope portrayed in this film are truly moving.');

-- 14. Link Users to Movies They Watched (watches)
INSERT INTO watches (email, movie_id) VALUES
('john.smith@email.com', 1),
('john.smith@email.com', 2),
('john.smith@email.com', 5),
('sarah.jones@email.com', 1),
('sarah.jones@email.com', 4),
('mike.wilson@email.com', 3),
('emma.davis@email.com', 5),
('emma.davis@email.com', 6),
('alex.brown@email.com', 1);

------------- 
-- Functions
------------- 

-- =========================================================================
-- FUNCTION #1: Create_User (Insertion)
-- =========================================================================
-- This function inserts a newly created user account into the system.
-- They sign up as a subscriber.
-- =========================================================================

-- Validate that the email does not already exist
SELECT COUNT(*) AS user_exists 
FROM User 
WHERE email = 'newuser@email.com';

-- Insert the new user
INSERT INTO User (email, "first", middle, "last", birth_date, sign_up_date)
VALUES ('newuser@email.com', 'Jane', 'Marie', 'Doe', '1993-06-20', '2024-12-01');

-- Insert phone number for the user
INSERT INTO user2 (email, phone_number)
VALUES ('newuser@email.com', 5556667777);

-- Insert into subscriber
INSERT INTO subscriber (email)
VALUES ('newuser@email.com');

-- Insert payment method
INSERT INTO subscriber2 (email, payment_method)
VALUES ('newuser@email.com', 9876543210123456);

-- Insert billing address
INSERT INTO subscriber3 (email, street, city, "state", zip)
VALUES ('newuser@email.com', '100 Broadway', 'Nashville', 'Tennessee', 37201);

-- Create subscription
INSERT INTO subscription (sub_id, start_date, end_date, status)
VALUES (6, '2025-12-01', '2026-12-01', 'active');

-- Link subscriber to subscription
INSERT INTO has (email, sub_id)
VALUES ('newuser@email.com', 6);

-- Link subscription to plan
INSERT INTO "to" (sub_id, plan_name)
VALUES (6, 'Premium');

-- Display confirmation
SELECT 
    u.email,
    u.first,
    u.last,
    u.sign_up_date,
    h.sub_id,
    sub.status,
    p.plan_name,
    p.monthly_price
FROM User u,
    has h,
    subscription sub,
    "to" t,
    plan p,
    subscriber s
WHERE u.email = 'newuser@email.com'
    AND h.email = s.email
    AND s.email = u.email
    AND t.sub_id = sub.sub_id
    AND sub.sub_id = h.sub_id
    AND t.plan_name = p.plan_name;


-- =========================================================================
-- FUNCTION #2: Search_movie_catalog (Query, joins multiple tables)
-- =========================================================================
-- This function searches the movie catalog using filters of title name, genre, years, length, and min rating
-- This specific query searches for Sci-Fi movies rated 4 stars or above
-- =========================================================================
SELECT 
    m.title,
    m.production_company,
    m.length_of_movie,
    m.release_year,
    m.genre,
    ROUND(AVG(r.stars), 1) AS average_stars,
    COUNT(r.rating_id) AS review_count
FROM movie  m,
     rating r
WHERE m.movie_id = r.movie_id -- join condition
  -- User filters 
  AND m.genre = 'Sci-Fi'       
GROUP BY
    m.title,
    m.production_company,
    m.length_of_movie,
    m.release_year,
    m.genre
HAVING AVG(r.stars) >= 4.0 -- aggregate condition
ORDER BY m.title ASC; 

-- =========================================================================
-- FUNCTION #3: Promote_to_Subscriber (Modification / Insertion)
-- =========================================================================
-- This function upgrades an existing user to a subscriber.
-- =========================================================================

-- Confirm user is a FREE USER (not a standard subscriber)
SELECT u.email
FROM User u
WHERE u.email = 'alex.brown@email.com'
  AND EXISTS (
        SELECT 1
        FROM free_user f
        WHERE f.email = u.email
  )
  AND NOT EXISTS (
        SELECT 1
        FROM subscriber s
        WHERE s.email = u.email
  );

-- Promote user to subscriber
INSERT INTO subscriber (email)
VALUES ('alex.brown@email.com');

-- Remove user from free_user
DELETE FROM free_user
WHERE email = 'alex.brown@email.com';

-- Insert payment method
INSERT INTO subscriber2 (email, payment_method)
VALUES ('alex.brown@email.com', 6789012345678901);

-- Insert billing address
INSERT INTO subscriber3 (email, street, city, "state", zip)
VALUES ('alex.brown@email.com', '555 Park Avenue', 'Nashville', 'Tennessee', 37204);

-- Generate new sub_id and create subscription
INSERT INTO subscription (sub_id, start_date, end_date, status)
VALUES (7, '2024-12-01', '2025-12-01', 'active');

-- Link subscriber to subscription
INSERT INTO has (email, sub_id)
VALUES ('alex.brown@email.com', 7);

-- Link subscription to plan
INSERT INTO "to" (sub_id, plan_name)
VALUES (7, 'Standard');


-- =========================================================================
-- FUNCTION #4: Update_User_Info (Modification)
-- =========================================================================
-- This function updates a user's profile information.
-- =========================================================================

-- Verify user exists
SELECT email, "first", middle, "last", birth_date
FROM User
WHERE email = 'john.smith@email.com';

-- Update user information
UPDATE User
SET 
    "first" = 'Jonathan',
    middle = 'Robert',
    birth_date = '1990-05-16'
WHERE email = 'john.smith@email.com';

-- Display updated user information for confirmation
SELECT 
    email,
    "first",
    middle,
    "last",
    birth_date,
    sign_up_date
FROM User
WHERE email = 'john.smith@email.com';


-- =========================================================================
-- FUNCTION #5: High_Rated_Movies (Aggregation, joins multiple tables)
-- =========================================================================
-- This function lists all movies with an average rating of 4.0 or more stars.
-- =========================================================================

SELECT 
    m.title,
    m.genre,
    m.release_year,
    ROUND(AVG(r.stars), 2) AS average_rating,
    COUNT(r.rating_id) AS total_ratings
FROM movie m, rating r
WHERE m.movie_id = r.movie_id
GROUP BY m.movie_id, m.title, m.genre, m.release_year
HAVING AVG(r.stars) >= 4.0
ORDER BY average_rating DESC, m.title ASC;


-- =========================================================================
-- FUNCTION #6: Total_Movies_Watched_By_User (Aggregation, joins multiple tables)
-- =========================================================================
-- This function calculates the total number of movies each user has watched.
-- =========================================================================

SELECT
    u.email,
    u.first,
    u.last,
    (
        SELECT COUNT(*)
        FROM watches w
        WHERE w.email = u.email
    ) AS total_movies_watched
FROM User u
ORDER BY total_movies_watched DESC, u.email ASC;


-- =========================================================================
-- FUNCTION #7: Count_Total_Movies (Aggregation, single table query)
-- =========================================================================
-- This function counts the total number of movies in the catalog.
-- =========================================================================

SELECT 
    COUNT(*) AS total_movies
FROM movie;


-- =========================================================================
-- FUNCTION #8: View_watch_history (Query, joins multiple tables)
-- =========================================================================
-- This function displays a user's watch history.
-- =========================================================================
SELECT 
    m.title,
    ROUND(AVG(r.stars), 2) AS average_rating,
    COUNT(r.rating_id) AS total_ratings
FROM watches w, movie m, rating r
WHERE w.email = 'john.smith@email.com'
  AND w.movie_id = m.movie_id
  AND r.movie_id = m.movie_id
GROUP BY m.title;

-- =========================================================================
-- FUNCTION #9 Remove_Movie (Deletion)
-- =========================================================================
-- This function removes a movie from the catalog.
-- =========================================================================

-- Verify the movie exists
SELECT movie_id, title 
FROM movie 
WHERE movie_id = 4;

-- Delete from rating2 first
DELETE FROM rating2 
WHERE movie_id = 4;

-- Delete from rating
DELETE FROM rating 
WHERE movie_id = 4;

-- Delete from watches
DELETE FROM watches 
WHERE movie_id = 4;

-- Delete from movie
DELETE FROM movie 
WHERE movie_id = 4;