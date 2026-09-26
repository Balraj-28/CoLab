const mongoose = require('mongoose');

const User_Model = new mongoose.Schema({
    username:{
        type:String,
        required : true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        required:true
    },
    email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
},
    roomsCreated:{
        type:Number,
        default:0,
    },
    roomsJoined:{
    type:Number,
    default:0
    },
    totalMessages:{
        type:Number,
        default:0
    },
    createdAt:{
        type :Date,
        default:  Date.now
    }
})

module.exports = mongoose.model('User' , User_Model);