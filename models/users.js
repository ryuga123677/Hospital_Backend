const mongoose = require('mongoose');
const plm= require("passport-local-mongoose");
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(
  () => {
    console.log("connection established");
  }
).catch((error) => {
  console.log("YOur error is : ", error);

});
//mongodb://127.0.0.1:27017/Hospital-Database

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
 
  hospitalname: {
    type: String,
    required: true,
  },
  image:{
    type: String,

  },
  doctors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
  ],
  patients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
  ],
  refreshToken: {
    type: String
}

});
userSchema.plugin(plm);

const Owner = mongoose.model('Owner', userSchema);

module.exports = Owner;