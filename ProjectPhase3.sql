-- Project Phase 3
-- CS 3265
-- Fall 2025
-- Professor Dan Lin
-- Group 12: Alex Homem, Kyle Rosenberg, Prince Owusu-Nkrumah
-- Database Description: A movie streaming platform to manage users, subscriptions, movies, plans, and ratings

------------- 
-- Provide SQL source codes for creating all the tables in your application which should
-- demonstrate the correct use of the following constraints:
-- o Each table has a primary key
-- o Foreign keys are correctly defined
-------------

-- 1. USERS

CREATE TABLE User (
    email varchar(255) PRIMARY KEY,
    first_name varchar(50) NOT NULL,
    middle_name varchar(50),
    last_name varchar(50) NOT NULL,
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
-- Provide SQL source codes for populating your tables 
-- (i.e., insertion commands you used to insert data to your database)
-------------

-- 1. Insert Users
INSERT INTO User (email, first_name, middle_name, last_name, birth_date, sign_up_date) VALUES
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
(5, 'Interstellar', 'Paramount Pictures', 169, 2014, 'Sci-Fi');

-- 12. Insert Ratings
INSERT INTO rating (movie_id, rating_id, user_name, stars, "date") VALUES
(1, 1, 'john.smith@email.com', 5.0, '2024-01-15'),
(1, 2, 'sarah.jones@email.com', 4.5, '2024-02-20'),
(2, 1, 'john.smith@email.com', 5.0, '2024-01-25'),
(3, 1, 'mike.wilson@email.com', 5.0, '2024-03-10'),
(4, 1, 'sarah.jones@email.com', 4.0, '2024-02-28'),
(5, 1, 'emma.davis@email.com', 4.5, '2024-01-30');

-- 13. Insert Review Texts
INSERT INTO rating2 (movie_id, rating_id, review_text) VALUES
(1, 1, 'Absolutely incredible! Heath Ledger''s performance as the Joker is unforgettable. Best superhero movie ever made.'),
(1, 2, 'Great movie with amazing action sequences and a compelling story. Christopher Nolan at his finest.'),
(2, 1, 'Mind-bending and visually stunning. Had to watch it twice to fully understand the plot!'),
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
('alex.brown@email.com', 1);



------------- 
-- Provide SQL source codes for each of the required functions which can be more than what
-- you have demonstrated in class.
------------- 

-- Have at least one Insertion.

-- Have at least one Deletion.

-- Have at least one Modification.

-- Have at least one SQL query that is on a single.

-- Have at least one SQL query that requires joining multiple tables.

-- Have at least one SQL query that utilizes one or more aggregate operations













