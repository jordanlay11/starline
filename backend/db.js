const {Pool} = require('pg');
require('dotenv').config();

const alertpool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

alertpool.connect((err, client,release)=>{
    if(err){
        console.error('Error: Database connection failed:', err.message);
    }else{
        console.log('Success: PostgreSQL Connected.');
        release();
    }
});

module.exports= alertpool;