const express = require('express'); //framework route requests to handler funcrions
const bcrypt = require('bcrypt'); //used to hash and compare passwords
const token_jwt = require('jsonwebtoken'); //generate and verify JWT tokens for authentication
const dbpool = require('../db'); //database connection pool to execute queries
const router = express.Router(); //create a new router object to define routes for user registration and login

//Function accepts user details, hashes passwords, saves user to database and generates JWT token for authentication
router.post('/register', async(req,res)=>{
    //Extract user details from request body
    const {user_name, user_email, password, phone_num} = req.body;

    //Validate that all required fields are provided
    if(!user_name || !user_email || !password) {
        return res.status(400).json({error: 'Name, email and password slots should be filled.'});

    }

    try{
        //
        const present = await dbpool.query(
            `SELECT userID FROM users WHERE email = $1`, [user_email]
        );

        //Check if an account with the provided email already exists in the database
        if (present.rows.length > 0){
            return res.status(400).json({error: 'An account already exists with this email'});
        }

        //Hash the user's password using bcrypt with a salt round of 10 for security
        const pass = await bcrypt.hash(password,10);

        //Insert the new user into the database and return the created user's details
        const issue = await dbpool.query(
            `INSERT INTO users (userName, email, pass, phone_number) VALUES ($1, $2, $3, $4)
            RETURNING userID, userName, email, phone_number, created_at`, [user_name, user_email, pass, phone_num]
        );

        //Extract the created user's details from the query result
        const user = issue.rows[0];

        //Generate a JWT token containing the user's ID and email and set to expire in 7 days
        const token = token_jwt.sign(
            {userID: user.userID, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );

        //Respond with a success message, the generated token, and the created user's details
        res.status(201).json({
            message: 'Registration Complete.',
            token, user
        });
    }catch(err){//Log any errors that occur during registration and respond with a 500 status code and error message
        console.error('Register error:',err.message);
        res.status(500).json({error:'Error during registration.'});
    }
});

//Function accepts user credentials, verifies them against the database, and generates a JWT token for authentication if valid
router.post('/login', async(req,res)=>{
    //Extract user credentials from request body
    const {user_email, password} = req.body;

    //Validate that both email and password are provided
    if(!user_email || !password) {
        return res.status(400).json({error: 'Email and password slots should be filled.'});

    }

    try{
        //Query the database for a user with the provided email
        const dbresult = await dbpool.query(
            `SELECT * FROM users WHERE email = $1`, [user_email]
        );

        //Check if a user with the provided email exists in the database
        if (dbresult.rows.length === 0){
            return res.status(400).json({error: 'No account matches this email.'});
        }

        //Extract the user's details from the query result
        const user = dbresult.rows[0];

        //Compare the provided password with the hashed password stored in the database using bcrypt
        const similar_pass = await bcrypt.compare(password, user.pass);

        //If the passwords do not match, respond with a 401 status code and an error message indicating incorrect password
        if(!similar_pass){
            return res.status(401).json({error: 'Incorrect password.' });
        }

        //Generate a JWT token containing the user's ID and email and set to expire in 7 days
        const token = token_jwt.sign(
            {userID: user.userID, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );

        //Respond with a success message, the generated token, and the user's details (excluding the password)
        res.json({
            message: 'Logged in Successfully',
            token, 
            user:{
                userID: user.userID,
                userName: user.userName,
                email: user.email,
                phone_num: user.phone_number,
                risk_level: user.risk,
                risk_zoneID: user.risk_zoneID
            }
        });
    }catch(err){//Log any errors that occur during login and respond with a 500 status code and error message
        console.error('Login error:',err.message);
        res.status(500).json({error:'Error during login.'});
    }
});

//Export the router object to be used in other parts of the application, allowing the defined routes for user registration and login to be accessible
module.exports = router;