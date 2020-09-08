//jshint esversion:6
// ==================== importing all things at one place =======================
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//===========file uploading============

const fileUpload = require('express-fileupload');


var FormData = require('form-data');
var fs = require('fs');
const {
  strict
} = require("assert");
const {
  stringify
} = require("querystring");
const { concat } = require("lodash");

// ======================= app ======================
const app = express();
app.use(express.static(__dirname +"public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session())
app.use(fileUpload());


// ====================== database system ======================
// "mongodb://localhost:27017/bgietdb"

mongoose.connect("mongodb+srv://AnmolNoor:"+process.env.PASSWORD+"@bgiet.mxxj7.mongodb.net/bgietdb?retryWrites=true&w=majority" , {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);



// ======================   database schema'sss ====================
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const userInfoSchema = new mongoose.Schema({

  id: String,
  email: String,
  rollnumber: Number,
  firstname: String,
  lastname: String,
  phonenumber: Number,
  branch: String,
  semester: Number,
  status: String
});

const uploadSchema = new mongoose.Schema({
  id: String,
  subject: String,
  filename: String
})

const teacherInfo = new mongoose.Schema({
  id: String,
  email: String,
  firstname: String,
  lastname: String,
  phonenumber: Number,
  department: String,
  subject: String
})

const taskSchema = new mongoose.Schema({
  date:String,
  task:String,
  sub:String
})

// ====================== plugins =========================

userSchema.plugin(passportLocalMongoose);

// ===================== models ========================
const Info = new mongoose.model("Info", userInfoSchema);

const User = new mongoose.model("User", userSchema);

const Upload = new mongoose.model("Upload", uploadSchema);

const TeacherInfo = new mongoose.model("TeacherInfo", teacherInfo);

const Task = new mongoose.model("Task", taskSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

var userId = "";


//=========================== Date and time ==========================

function dateStr(){
  var d = new Date();
 
  var date = d.getDate();
  var month = d.getMonth() + 1; // Since getMonth() returns month from 0-11 not 1-12
  var year = d.getFullYear();
  var min  = d.getMinutes();
  var hours = new Date().getHours();
  var hours = (hours+24)%24; 
  var mid='am';
  if(hours==0){ //At 00 hours we need to show 12 am
  hours=12;
  if(min<9){
    min="0"+min
  }
  }
  else if(hours<10){
    hours="0"+hours;
    if(min<9){
      min="0"+min
    }
  }
  else if(hours>12)
  {
  hours=hours%12;
  mid='pm';
  if(min<9){
    min="0"+min
  }
  }
 
  
  
  return hours+":"+min+mid+" "+" "+ date + "/" + month + "/" + year;
}




// ==========================  route'ssss  =========================

app.get("/", function (req, res) {
  res.render("index")
});
app.route("/signin").get(function (req, res) {

  if (req.isAuthenticated()) {
    res.redirect("/profile");
  } else {
    res.render("signin");
  }
}).post(function (req, res, next) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {

      passport.authenticate('local', function (err, user, info) {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.send("authentication failed");
        }

        req.login(user, loginErr => {
          if (loginErr) {
            return next(loginErr);
          }
          return res.redirect("/profile");
        });
      })(req, res, next);
    }
  });
});

let filename = [{}]
app.route("/profile").get(function (req, res) {
  if (req.isAuthenticated()) {

    
    Upload.find({
      id: req.user._id
    }, (err, file) => {
      if (err) {
        console.log(err);
      } else {
        filename = file
      }
    })

    


    Info.findOne({
      id: req.user._id
    }, (err, user) => {
      userId = req.user._id;
      res.render("profile", {
        username: user.firstname + " " + user.lastname,
        status: user.status + " of " + user.branch + " in " + user.semester + " semester",
        rollnumber: user.rollnumber,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phonenumber: user.phonenumber,
        branch: user.branch,
        semester: user.semester,
        filename: filename
      });
    })


  } else {
    res.redirect("/signin");
  }
});



app.route("/register").get(function (req, res) {
  res.render("register");
}).post(function (req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {

        
        const newUser = new Info({
          id: req.user._id,
          rollnumber: "1234567890",
          email: "email@address.com",
          firstname: "firstname",
          lastname: "lastname",
          phonenumber: "1234578906",
          branch: "branch",
          semester: "2",
          status: "Student",
          upload: [{
            subject: "subject",
            url: "addressOfTheSubmittedAssignment."
          }]
        });
        const newuploadd = new Upload({
          id: req.user._id,
          subject: "subject",
          filename: "filename"
        });
        newuploadd.save((err) => {
          if (err) {
            console.log(err);
          } else {
            newUser.save((err) => {
              if (err) {
                console.log(err);
              } else {
                res.redirect("/profile")
              }
            })
          }
        })


      })
    }
  });

});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.route("/courses").get((req, res) => res.render("courses"));


app.get("/about", function (req, res) {
  res.render("about");
});



app.route("/editprofile").get((req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/signin");
  } else {
    Info.findOne({
      id: req.user._id
    }, (err, user) => {
      userId = req.user._id;
      
      res.render("editprofile", {
        rollnumber: user.rollnumber,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phonenumber: user.phonenumber,
        branch: user.branch,
        semester: user.semester
      });
    })
  }


}).post((req, res) => {

  if (!req.isAuthenticated()) {
    res.redirect("/signin");
  } else {
    Info.updateOne({
      id: userId
    }, {
      $set: {
        rollnumber: req.body.rollnumber,
        email: req.body.email,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        phonenumber: req.body.phonenumber,
        branch: req.body.branch,
        semester: req.body.semester
      }
    }, (err) => {
      if (err) {
        console.log(err)
      } else {
        res.redirect("/profile")
      };
    })

  }


});

app.route("/showinfo").get((req, res) => res.render("showdb"));




app.get('/ping', function (req, res) {
  res.send('pong');
});


let sub = ""
app.route("/upldsub").get((req, res) => {
    if (!req.isAuthenticated()) {
      res.redirect("/signin");
    } else {
      res.render("upldsub")
    }
  })
  .post((req, res) => {
    sub = req.body.subject
    
    res.redirect("/upload")

  })



app.route("/upload").get((req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/signin");
  } else {

    res.render("upload");
  }

}).post(function (req, res) {
  if (!req.isAuthenticated()) {
    res.redirect("/signin");
  } else {



    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    let foo = req.files.foo;



   
    foo.mv('uploads/' + foo.name, function (err) {
      if (err)
        return res.status(500).send(err);

      
      const newuploadd = new Upload({
        id: req.user._id,
        subject: sub,
        filename: foo.name
      });
      Upload.findOneAndDelete({
        id: req.user._id,
        filename: "filename"
      }, (err, file) => {
        if (err) {
          console.log(err);
        } else {
          console.log("filename is delete ");
        }
      })

      newuploadd.save((err) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/profile");
        }
      });
    });


  }
});


app.route("/tsignin").get((req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/tprofile");
  } else {
      res.render("tsignin")
  }
})
  .post((req, res, next) => {

    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, function (err) {
      if (err) {
        console.log(err);
      } else {

        passport.authenticate('local', function (err, user, info) {
          if (err) {
            return next(err);
          }

          if (!user) {
            return res.send("authentication failed");
          }

          req.login(user, loginErr => {
            if (loginErr) {
              return next(loginErr);
            }
            return res.redirect("/tprofile");
          });
        })(req, res, next);
      }
    });
  })

app.route("/tr").get((req, res) => res.render("tregister"))
  .post((req, res) => {

    User.register({
      username: req.body.username
    }, req.body.password, function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          const newUser = new TeacherInfo({
            id: req.user._id,
            email: "email@address.com",
            firstname: "firstname",
            lastname: "lastname",
            phonenumber: "9876543210",
            department: "Department",
            subject: "Subject"
          });

          newUser.save((err) => {
            if (err) {
              console.log(err);
            } else {
              res.redirect("/tprofile")
            }
          })
        })
      }
    });
  })
  
app.route("/tprofile").get((req, res) => {
  
  if (req.isAuthenticated()) {
    
    TeacherInfo.findOne({
      id: req.user._id
    }, (err, user) => {
      Upload.find({subject:user.subject},(err,file)=>{
        if (err) {
          console.log(err);
        } else {
          res.render("tprofile", {
            username: user.firstname + " " + user.lastname,
            status: "Department " + user.department,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phonenumber: user.phonenumber,
            department: user.department,
            subject: user.subject,
            filename: file
        }
      )
    }
  })
    })
  } else {
    res.redirect("/tsignin");
  }
})

app.route("/teditprofile").get((req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/tsignin", );
  } else {
    TeacherInfo.findOne({
      id: req.user._id
    }, (err, user) => {
      res.render("teditprofile", {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phonenumber: user.phonenumber
      })
    })
  }

}).post((req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/tsignin");
  } else {
    TeacherInfo.updateOne({
      id: req.user._id
    }, {
      $set: {
        email: req.body.email,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        phonenumber: req.body.phonenumber,
        department: req.body.department,
        subject: req.body.subject
      }
    }, (err) => {
      if (err) {
        console.log(err)
      } else {
        res.redirect("/tprofile")
      };
    })

  }

})

app.route("/download/:fileselected").get((req,res)=>{
  const fileselected = req.params.fileselected;
  if (!req.isAuthenticated()) {
    res.redirect("/tsignin");
  } else {
  res.download(__dirname+"/uploads/"+fileselected);
  }
});

app.route("/tasks").get((req,res)=>{
  if (!req.isAuthenticated()) {
    res.redirect("/tsignin");
  } else {
      Task.find((err,tasks)=>{
        if(err){
          console.log(err);
        }else{
          res.render("tasks",{tasks:tasks})
        }
      })
     
  }
})

app.route("/task").get((req,res)=>{
  if (!req.isAuthenticated()) {
    res.redirect("/tsignin");
  } else {
      res.render("task")
  }
}).post((req,res)=>{
    const task = req.body.txtarea;
    const sub = req.body.sub;
    const newTask  = new Task({
      date:dateStr(),
      task:task,
      sub:sub
    })

    newTask.save((err)=>{
      if(err){
        console.log(err);
      }else{
        res.redirect("/tasks")
      }
    })
})



let port = process.env.PORT || "3000"

app.listen(port, function () {
  console.log("Server started on port 3000");
});