const jwt = require('jsonwebtoken');
require('dotenv').config();
const { AUTH_COOKIE_NAME } = require('./auth_cookie');

const auth = async (req,res,next)=>{
    const token = req.cookies[AUTH_COOKIE_NAME];
    if(!token){
        return res.status(401).json({success : false , message : "Unauthorized action (no cookie found)"});
    }
    try{
    const decoded = jwt.verify(token , process.env.JWT_SIGN );
    req.user = decoded;
    next();
    }
    catch(err){
        return res.status(401).json({success : false , message : "INVALID TOKEN!!!"});
    }

}
module.exports = {auth};
