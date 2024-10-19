const mongoose = require('mongoose');
const plm= require("passport-local-mongoose");

// Define the user schema
const patientSchema = new mongoose.Schema({
  username: {type:String},
  password: {type:String},
  email: {type:String},
 
  age: {type:Number},
  hospitalname:{
    type:String,
  },
  doctortreating:[{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Doctor'
  }],
  report:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Report'}
    ,
    refreshToken: {
      type: String
  }
  
});
patientSchema.plugin(plm);
// Create models for Patient, Doctor, and Owner
const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;