const mongoose = require('mongoose');

const Chat_model = new mongoose.Schema({
    message:{
        type:String,
        trim:true,
        required:true,
        maxlength:2000
    },
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true,
    },
    room:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Room',
        required:true
    },
    time:{
        type:Date,
        default:Date.now
    }

})


module.exports = mongoose.model('Chat' , Chat_model);