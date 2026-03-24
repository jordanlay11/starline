const express = require('express');
const bcrypt = require('bcrypt');
const token_jwt = require('jsonwebtoken');
const dbpool = require('../db');
const router = express.Router();


router.post('/register', async(req,res)=>{
    const {user_name, user_email, password, phone_num} = req.body;

    if(!user_name || !user_email || !password) {
        return res.status(400).json({error: 'Name, email and password slots should be filled.'});

    }

    try{
        const present = await dbpool.query(
            `SELECT userID FROM users WHERE email = $1`, [user_email]
        );

        if (present.rows.length > 0){
            return res.status(400).json({error: 'An account already exists with this email'});
        }

        const pass = await bcrypt.hash(password,10);

        const issue = await dbpool.query(
            `INSERT INTO users (userName, email, pass, phone_number) VALUES ($1, $2, $3, $4)
            RETURNING userID, userName, email, phone_number, created_at`, [user_name, user_email, pass, phone_num]
        );

        const user = issue.rows[0];

        const token = token_jwt.sign(
            {userID: user.userID, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );

        res.status(201).json({
            message: 'Registration Complete.',
            token, user
        });
    }catch(err){
        console.error('Register error:',err.message);
        res.status(500).json({error:'Error during registration.'});
    }
});

router.post('/login', async(req,res)=>{
    const {user_email, password} = req.body;

    if(!user_email || !password) {
        return res.status(400).json({error: 'Email and password slots should be filled.'});

    }

    try{
        const dbresult = await dbpool.query(
            `SELECT * FROM users WHERE email = $1`, [user_email]
        );

        if (dbresult.rows.length === 0){
            return res.status(400).json({error: 'No account matches this email.'});
        }


        const user = dbresult.rows[0];

        const similar_pass = await bcrypt.compare(password, user.pass);

        if(!similar_pass){
            return res.status(401).json({error: 'Incorrect password.' });
        }

        const token = token_jwt.sign(
            {userID: user.userID, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        );

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
    }catch(err){
        console.error('Login error:',err.message);
        res.status(500).json({error:'Error during login.'});
    }
});

module.exports = router;