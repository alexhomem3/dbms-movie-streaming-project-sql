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
-- Provide SQL source codes for populating your tables 
-- (i.e., insertion commands you used to insert data to your database)
-------------








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













