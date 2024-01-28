const mongoose = require('mongoose');
const reportSchema = new mongoose.Schema({
    username: {type:String},
    

    disease: {type:String},
    symptoms: {type:String},
    medicines:{
      type:String
    },
    diet:{
        type:String
      },
    doctor:{
      type: mongoose.Schema.Types.ObjectId,
        ref:'Doctor'
    },
    patient:
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Patient'
      }
    ,
   

  
  });

// Create models for Patient, Doctor, and Owner
const report = mongoose.model('Report', reportSchema);
module.exports = report;