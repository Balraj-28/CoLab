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
    title:{
        type:String,
        required:true,
        maxlength:200,
        trim:true,
    },
    description:{
        type:String,
        maxlength:1000,
        trim:true,
        default:""
    },
    hasPassword:{
        type: Boolean,
        default: false
    },
    membersLimit:{
        type:Number,
        required:true,
        min:1,
        max:12
    },
    createdAt:{
        type:Date,
        default: Date.now,
    }
})

module.exports = mongoose.model('Room' , Room_schema);