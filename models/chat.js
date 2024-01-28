const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema({
    sendername: {type:String},
    receivername: {type:String},
    message: {type:String},
    timestamp: { type: Date, default: Date.now },

    
 
  
  });
 
// Create models for Patient, Doctor, and Owner
const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;