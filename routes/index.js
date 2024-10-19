var express = require("express");
var router = express.Router();
const Owner = require("../models/users");
const passport = require("passport");
const upload = require("../middleware/multer");
const localStrategy = require("passport-local");
const Doctor = require("../models/doctors");
const Patient = require("../models/patients");
const Report = require("../models/reports");
const Chat = require("../models/chat");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const uploadcloudinary = require("../middleware/cloudinary");
passport.use("owner-local", new localStrategy(Owner.authenticate()));
passport.use("doctor-local", new localStrategy(Doctor.authenticate()));
passport.use("patient-local", new localStrategy(Patient.authenticate()));

var BASE_URL = process.env.BASE_URL;
var field;

const io = require("socket.io")(process.env.PORT2, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});
io.on("connection", (socket) => {
  console.log(socket.id);
  socket.on("loadHistory", async ({ sendername, receivername }) => {
    try {
      const me = await Chat.find({
        sendername: sendername,
        receivername: receivername,
      }).sort({ timestamp: 1 });
      const you = await Chat.find({
        sendername: receivername,
        receivername: sendername,
      }).sort({ timestamp: 1 });
      let arr = [...me, ...you];
      arr.sort((a, b) => a.timestamp - b.timestamp);

      console.log(arr);
      socket.emit("history", arr);
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  });
  socket.on("send-message", async (messag) => {
    console.log(messag);
    const { sendername, receivername, message } = messag;
    const chat = new Chat({ sendername, receivername, message });
    await chat.save();
    io.emit(sendername + receivername, messag);
    io.emit(receivername + sendername, messag);
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
});
const verifyuserdoctor = async (req, res, next) => {
  const accesstoken = req.cookies.accessToken;
  if (!accesstoken) {
    if (renewtokendoctor(req, res)) {
      next();
    }
  } else {
    jwt.verify(accesstoken, "access-token-doctor", (err, decoded) => {
      if (err) {
        return res.json("invalid access token");
      } else {
        req.username = decoded.username;
        next();
      }
    });
  }
};
const renewtokendoctor = (req, res) => {
  const refreshtoken = req.cookies.refreshToken;
  
  if (!refreshtoken) {
     res.json("no refreshtoken");
     return false;
  } else {
    jwt.verify(refreshtoken, "refresh-token-doctor", (err, decoded) => {
      if (err) {
         res.json("invalid refresh token");
         return false;
      } else {
        const accessToken = jwt.sign(
          { username: decoded.username },
          "access-token-doctor",
          { expiresIn: "30s" }
        );

        res.cookie("accessToken", accessToken, {
          httpOnly: false,
          maxAge: 30000,
        });
      
      }
    });
    return true;
  }

};
const verifyuserpatient = async (req, res, next) => {
  const accesstoken = req.cookies.accessToken;
  if (!accesstoken) {
    if (renewtokenpatient(req, res)) {
      next();
    }
  } else {
    jwt.verify(accesstoken, "access-token-patient", (err, decoded) => {
      if (err) {
        return res.json("invalid access token");
      } else {
        req.username = decoded.username;
        next();
      }
    });
  }
};
const renewtokenpatient = (req, res) => {
  const refreshtoken = req.cookies.refreshToken;
  
  if (!refreshtoken) {
     res.json("no refreshtoken");
     return false;
  } else {
    jwt.verify(refreshtoken, "refresh-token-patient", (err, decoded) => {
      if (err) {
         res.json("invalid refresh token");
         return false;
      } else {
        const accessToken = jwt.sign(
          { username: decoded.username },
          "access-token-patient",
          { expiresIn: "2h" }
        );

        res.cookie("accessToken", accessToken, {
          httpOnly: false,
          maxAge: 7200000,
        });
      
      }
    });
    return true;
  }

};

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send({ message: "hi" });
});

router.post(
  "/ownerregister",
  upload.single("file"),
  async function (req, res, next) {
    try {
      const hospimage = req.file.path;

      const registereduser = await Owner.findOne({
        email: req.body.email,
        password: req.body.password,
      });
      if (registereduser) {
        return res.status(400).send("user already registerd");
      }
      const hospitalimage = await uploadcloudinary(hospimage);
      const ownerdata = new Owner({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        hospitalname: req.body.hospitalname,
        image: hospitalimage.url,
      });
      await ownerdata.save();
      res.status(200).send({ message: "success" });
    } catch (error) {
      res.status(500).send({ message: "something went wrong" });
    }
  }
);
router.post("/ownerlogin", async (req, res) => {
  const { username, password } = req.body;
  const user = await Owner.findOne({ username: username, password: password });
  if (!user) {
    return res.status(400).send("user not found");
  }

  const accessToken = jwt.sign({ username: username }, "access-token", {
    expiresIn: "2h",
  });
  const refreshToken = jwt.sign({ username: username }, "refresh-token", {
    expiresIn: "1d",
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: false,
      maxAge: 7200000,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: false,
      maxAge: 86400000,
    })
    .send("success");
});
const verifyuser = async (req, res, next) => {
  const accesstoken = req.cookies.accessToken;
  if (!accesstoken) {
    if (renewtoken(req, res)) {
      next();
    }
  } else {
    jwt.verify(accesstoken, "access-token", (err, decoded) => {
      if (err) {
        return res.json("invalid access token");
      } else {
        req.username = decoded.username;
        next();
      }
    });
  }
};
const renewtoken = (req, res) => {
  const refreshtoken = req.cookies.refreshToken;
  
  if (!refreshtoken) {
    res.json("no refreshtoken");
    return false;
  } else {
    jwt.verify(refreshtoken, "refresh-token", (err, decoded) => {
      if (err) {
        res.json("invalid refresh token");
        return false;
      } else {
        const accessToken = jwt.sign(
          { username: decoded.username },
          "access-token",
          { expiresIn: "2h" }
        );

        res.cookie("accessToken", accessToken, {
          httpOnly: false,
          maxAge: 7200000,
        });
        
      }
    });
    return true;
  }
  
};
router.get("/isownerlogin", verifyuser, async (req, res) => {
  return res.status(200).send("success");
});
router.get("/doctorlistowner", verifyuser, async (req, res, next) => {
  const name = req.username;
  const user = await Owner.findOne({ username: name }).populate("doctors");
  if (!user) {
    return res.status(404).send("no doctors with username found");
  } else {
    return res.status(200).send(user.doctors);
  }
  return res.status(200).send("success");
});
router.delete("/removedoctor", async (req, res, next) => {
  const doc = await Doctor.findOne({ username: req.query.doctor });
  const owner = await Owner.findOne({ username: req.query.owner });
  var deleteddoc;
  if (doc && owner) {
    owner.doctors.splice(doc._id, 1);
    deleteddoc = await Doctor.findOneAndDelete({
      username: req.query.doctor,
    });
  }
  if (deleteddoc) {
    res.status(200).send("success");
  } else {
    res.send("failure");
  }
});

router.post("/doctorregister", async function (req, res, next) {
  try {
    const user = await Owner.findOne({ hospitalname: req.body.hospitalname });
    const doctor = await Doctor.findOne({ username: req.body.username });
    if (doctor) {
      return res.status(400).send("doctor already exists");
    }
    const doct = new Doctor({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      speciality: req.body.speciality,
      hospitalname: user.hospitalname,
    });
    await doct.save();
    user.doctors.push(doct._id);
    await user.save();
    return res.status(200).send("success");
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.post(
  "/doctorlogin",

  async (req, res) => {
    const { username, password } = req.body;
    const user = await Doctor.findOne({
      username: username,
      password: password,
    });
    if (!user) {
      return res.status(400).send("user not found");
    }

    const accessToken = jwt.sign(
      { username: username },
      "access-token-doctor",
      { expiresIn: "30s" }
    );
    const refreshToken = jwt.sign(
      { username: username },
      "refresh-token-doctor",
      { expiresIn: "2m" }
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly:false,
        maxAge: 30000,//7200000
        
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: false,
        maxAge: 120000,//86400000
  
      })
      .send("success");
  }
);
router.get("/isdoctorlogin", verifyuserdoctor, async (req, res) => {
  return res.status(200).send("success");
});
router.get("/doctorlist", async (req, res, next) => {
  try {
    const hospitalname = req.query.search;
    const user = await Owner.findOne({ hospitalname: hospitalname }).populate(
      "doctors"
    );
    const arr = user.doctors;
    res.status(200).send(arr);
    console.log(arr);
  } catch (error) {
    res.status(404).send(error.message);
  }
});

router.get("/doctorspatient", verifyuserdoctor,async (req, res, next) => {
  try {
    const doctorname = req.query.search;
    const doct = await Doctor.findOne({ username: doctorname }).populate(
      "currentlytreating"
    );

    res.status(200).send(doct.currentlytreating);
  } catch (error) {
    res.status(404).send(error.message);
  }
});

router.get("/appointment",async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ username: req.query.param2 });
    const doctor = await Doctor.findOne({ username: req.query.param1 });

    doctor.appointments.push(patient._id);
    await doctor.save();
    res.status(200).send("success");
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.post("/appointmentfix", async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ username: req.body.username });
    const patient = await Patient.findOne({ username: req.body.patientname });
    doctor.currentlytreating.push(patient._id);
    await doctor.save();
    patient.doctortreating.push(doctor._id);
    await patient.save();

    doctor.appointments.splice(patient._id, 1);
    await doctor.save();
    res.status(200).send("success");
  } catch (error) {
    res.status(404).send(error.message);
  }
});
router.get("/appointmentdecline", async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ username: req.query.doctorname });
    const patient = await Patient.findOne({ username: req.query.patientname });
    doctor.appointments.splice(patient._id, 1);
    await doctor.save();
    res.status(200).send("success");
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.get("/doctortreating", async (req, res, next) => {
  try {
    const patient = await Patient.findOne({
      username: req.query.search,
    }).populate("doctortreating");
    res.status(200).send(patient.doctortreating);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.post("/assignreport",verifyuserdoctor, async (req, res, next) => {
  try {
    const doctors = await Doctor.findOne({ username: req.body.doctorname });

    const patient = await Patient.findOne({ username: req.body.username });
    const report = await Report.create({
      username: req.body.username,
      disease: req.body.disease,
      symptoms: req.body.symptoms,
      medicines: req.body.medicines,
      diet: req.body.diet,
      doctor: doctors._id,
      patient: patient._id,
    });
    doctors.patientreports.push(report._id);
    await doctors.save();
    patient.report = report._id;
    await patient.save();
    res.status(200).send("success");
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.get("/patienttreated",verifyuserdoctor, async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({
      username: req.query.search,
    }).populate("patienttreated");
    console.log(req.session.user);
    {
      res.status(200).send(doctor.patienttreated);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.post("/treated",verifyuserdoctor, async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ username: req.body.doctorname });
    const patient = await Patient.findOne({ username: req.body.patientname });
    doctor.patienttreated.push(patient._id);
    doctor.currentlytreating.splice(patient._id, 1);
    patient.doctortreating.splice(doctor._id, 1);

    await doctor.save();
    await patient.save();
    res.status(200).send("success");
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.post("/nottreated",verifyuserdoctor, async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ username: req.body.doctorname });
    const patient = await Patient.findOne({ username: req.body.patientname });
    doctor.died.push(patient._id);
    doctor.currentlytreating.splice(patient._id, 1);
    await doctor.save();
    res.status(200).send("success");
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.get("/performance",verifyuserdoctor, async (req, res, next) => {
  const doctor = await Doctor.findOne({ username: req.query.search });
  const life = doctor.patienttreated.length;
  const death = doctor.died.length;
  if (death == 0) {
    let x = life.toString();
    console.log(x);
    res.send(x);
  } else {
    let x = (life / death).toString();
    console.log(x);
    res.send(x);
  }
});
router.get("/patientappoints", async (req, res, next) => {
  try {
    const patient = await Doctor.findOne({
      username: req.query.param,
    }).populate("appointments");

    return res.status(200).send(patient.appointments);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.get("/died",verifyuserdoctor, async (req, res, next) => {
  try {
    const patient = await Doctor.findOne({
      username: req.query.search,
    }).populate("died");

    res.status(200).send(patient.died);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.get("/ispatientlogin", verifyuserpatient, async (req, res) => {
  return res.status(200).send("success");
});
router.post("/patientregister", async function (req, res, next) {
  try {
    const user = await Owner.findOne({ hospitalname: req.body.hospitalname });
    const registeredpatient = await Patient.findOne({ username: req.body.username});
    if (registeredpatient) {
      return res.status(400).send("user already registerd");
    }
    const patient = new Patient({
      username: req.body.username,
      email: req.body.email,
      hospitalname: user.hospitalname,
      password: req.body.password,
      age: req.body.age,
    });
    await patient.save();
    user.patients.push(patient._id);
    await user.save();
    return res.status(200).send("success");
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.post(
  "/patientlogin",
  async (req, res) => {
    const { username, password ,hospitalname} = req.body;
    const user = await Patient.findOne({ username: username, password: password ,hospitalname:hospitalname});
    if (!user) {
      return res.status(400).send("user not found");
    }
  
    const accessToken = jwt.sign({ username: username }, "access-token-patient", {
      expiresIn: "2h",
    });
    const refreshToken = jwt.sign({ username: username }, "refresh-token-patient", {
      expiresIn: "1d",
    });
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: false,
        maxAge: 7200000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: false,
        maxAge: 86400000,
      })
      .send("success");
  }
);
router.get("/seereports",verifyuserpatient, async (req, res, next) => {
  try {
    const patient = await Patient.findOne({
      username: req.query.name,
    }).populate("report");

    res.status(200).send(patient.report);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
router.get("/message", async (req, res, next) => {
  try {
    const me = await Chat.find({
      sendername: req.query.sendername,
      receivername: req.query.receivername,
    }).sort({ timestamp: 1 });
    const you = await Chat.find({
      sendername: req.query.receivername,
      receivername: req.query.sendername,
    }).sort({ timestamp: 1 });
    res.status(200).send({
      me: me,
      you: you,
    });
  } catch (error) {
    res.status(500);
  }
});
router.get("/hospitals", async (req, res, next) => {
  try {
    const hosp = await Owner.find({});
    res.status(200).send(hosp);
  } catch (error) {
    res.status(400).send(error.message);
  }
});



module.exports = router;
