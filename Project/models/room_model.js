const mongoose = require('mongoose');

const Room_schema = new mongoose.Schema({
    roomCode : {
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        default:""
    },
    leader:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true,
    },
    members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    }],
    createdAt:{
        type:Date,
        default: Date.now,
    }
})

module.exports = mongoose.model('Room' , Room_schema);