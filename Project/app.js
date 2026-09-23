const express = require('express');
require('dotenv').config();

const cors = require('cors');
const app = express();
app.use(express.json());
const connectDB = require('./db-connect/connect');
app.use(cors());
const router = require('./routers/login_router');
app.use('/' , router);

const {createServer} = require('http');

const OurServer = createServer(app);

const start  = async ()=>{
    try{
    await connectDB(process.env.MONGO_URI); 
    console.log("database connected");
    OurServer.listen(4000 , ()=>{
    console.log("server online");
    }
)  
} catch(err){
    console.log(err);
}

}

start();