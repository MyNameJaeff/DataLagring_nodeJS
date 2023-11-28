const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const fs = require("fs");
const fileUpload = require("express-fileupload");

const app = express();
const server = createServer(app);
const io = new Server(server);


// Declares some of the needed rules for the server, like static changes all img dir to the main div
// as to not have to send every image
app.use(fileUpload());

app.use(express.static("public"));

app.use(express.static(__dirname + "/upload"));


app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public/index.html"));
});

app.post("/", (req, res) => {
  var userData = fs.readFileSync("userData.json");
  let alreadyExists = false;
  var myObj = JSON.parse(userData);
  myObj.Users.map((user) => {
    if (req.body.username == user.username) {
      alreadyExists = true;
    }
  });
  if (!alreadyExists) {
    // Move the uploaded image to our upload folder
    req.files.image.mv(__dirname + "/upload/" + req.files.image.name);

    // All good
    console.log("Image was uploaded!");

    delete req.body.submit;
    req.body.image = req.files.image.name;

    myObj.Users.push(req.body);
    var newData2 = JSON.stringify(myObj, null, 2);
    fs.writeFile("userData.json", newData2, (err) => {
      if (err) throw err;
      console.log("New data added");
    });
    res.sendFile(join(__dirname, "public/index.html"));
  }else{
    res.sendFile(join(__dirname, "public/index.html"));
    io.emit("Already exists");
  }
});

io.on("connection", (socket) => {
  socket.on("edit", (data) => {
    var userData = fs.readFileSync("./userData.json");

    var myObj = JSON.parse(userData);
    myObj.Users.push(data);
    var newData2 = JSON.stringify(myObj);
    fs.writeFile("./userData.json", newData2, (err) => {
      if (err) throw err;
      console.log("New data added");
    });
  });
  socket.on("show", (data) => {
    var userData = fs.readFileSync("./userData.json");

    var myObj = JSON.parse(userData);
    io.emit("printAll", { Users: myObj });
  });
  socket.on("searchFor", (data) => {
    let i = false;
    var userData = fs.readFileSync("./userData.json");

    var myObj = JSON.parse(userData);
    myObj.Users.map((user) => {
      if (user.username == data) {
        io.emit("this user", user);
        i = true;
      }
    });
    if (!i) {
      io.emit("this user", false);
    }
  });
  socket.on("change this user", (who) => {
    let arr = { Users: [] };
    var userData = fs.readFileSync("./userData.json");
    var myObj = JSON.parse(userData);
    myObj.Users.map((user) => {
      if (user.username === who.username) {
        user["firstname"] = who.firstname;
        user["lastname"] = who.lastname;
        user["username"] = who.username;
        user["birthday"] = who.birthday;
        user["proffesion"] = who.proffesion;

        // It is not able to edit which image due to post issues with uploading images
        // console.log(who.image);
        // if (who.image != null) {
        //   //user["image"] = who.image;
        // }
      }
      arr.Users.push(user);
    });
    fs.writeFile("./userData.json", JSON.stringify(arr, null, 2), (err) => {
      if (err) throw err;
      console.log("New data added");
    });
  });
});

server.listen(3000, () => {
  console.log("Server is listening at port 3000");
});
