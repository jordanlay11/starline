const jwtToken = require('jsonwebtoken');

function verifytoken(req, res, next){
    const authHeader = req.headers['authorization'];
    const authtoken = authHeader && authHeader.split(' ')[1];

    if(!authtoken){
        return res.status(401).json({error: 'Access denied. No token provided.'});
    }

    try{
        const decoded = jwtToken.verify(authtoken, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(err){
        res.status(403).json({error: 'Invalid token.'});
    }

}

module.exports = verifytoken;

