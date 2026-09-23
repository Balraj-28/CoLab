const jwt = require('jsonwebtoken');
const User = require('../models/users_model');
const bcrypt = require('bcrypt');
require('dotenv').config();
const {isEmail} = require('validator');
const LoginCheck = async (req , res)=>{
    console.log("someone is trying to login");
    const {username , password} = req.body;
    const normalised_username = username.toLowerCase();
    const document = await User.findOne({username:normalised_username});
    if(!document){
        return res.status(401).json({
        success: false,
        message: "User not found"
    });
    }
    const compare = await bcrypt.compare( password ,document.password );
    if(!compare){
        return res.status(401).json({
        success: false,
        message: "Wrong password"
    });
    }
    const token = jwt.sign({username : document.username , user_id : document._id} , process.env.JWT_SIGN , {expiresIn:'1d'} );
    res.json({success: true , token:token});
    console.log("login success")
}


const Register = async (req , res)=>{
    console.log("someone is trying to register");
    const {username , password , email} = req.body;

    const user_exist = await User.findOne({username : username.toLowerCase()});
    if(user_exist){
        return res.status(401).json({
            success:false,
            message:"User already exists"
        })
    }
    if(!isEmail(email)){
        return res.status(401).json({
            success:false,
            message:"invalid email"
        })
    }
    const email_exist = await User.findOne({
    email: email.toLowerCase()
        });

    if (email_exist) {
    return res.status(409).json({
        success: false,
        message: "Email already in use"
    });
}
    const hash_pass = await bcrypt.hash(password , 10);
    const entry = await User.create({username : username.toLowerCase() , password : hash_pass , email : email})
    res.json({success:true , entry:entry});
}
module.exports = {LoginCheck  , Register};