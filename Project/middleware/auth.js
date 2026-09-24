const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = async (req,res,next)=>{
    const head = req.headers.authorization;
    if(!head ){
        return res.status(401).json({success : false , message : "Unauthorized action (no header provided)"});
    }
    const token = head.split(' ')[1];
    if(!token){
        return res.status(401).json({success : false , message : "Unauthorized action (no token found)"});
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