const jwtToken = require('jsonwebtoken');//Import the jsonwebtoken library to generate and verify JWT tokens for authentication

//Middleware function to verify JWT tokens in incoming requests, ensuring that only authenticated users can access protected routes
function verifytoken(req, res, next){
    //Extract the token from the Authorization header of the incoming request
    const authHeader = req.headers['authorization'];
    const authtoken = authHeader && authHeader.split(' ')[1];
    
    //If no token is provided, respond with a 401 status code and an error message indicating that access is denied
    if(!authtoken){
        return res.status(401).json({error: 'Access denied. No token provided.'});
    }

    try{
        //Verify the provided token using the secret key defined in the environment variables, and extract the decoded user information
        const decoded = jwtToken.verify(authtoken, process.env.JWT_SECRET);
        //Attach the decoded user information to the request object for use in subsequent middleware or route handlers, and call next() to proceed to the next middleware or route handler
        req.user = decoded;
        //Proceed to the next middleware or route handler
        next();
    }catch(err){//If the token is invalid or verification fails, respond with a 403 status code and an error message indicating that the token is invalid
        res.status(403).json({error: 'Invalid token.'});
    }

}
//Export the verifytoken middleware function to be used in other parts of the application, allowing it to be applied to protected routes that require authentication
module.exports = verifytoken;

