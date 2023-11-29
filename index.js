// Declares all of the imports needed for this to work
const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const fs = require("fs");
const fileUpload = require("express-fileupload");

// Creates a server using express
const app = express();
const server = createServer(app);
const io = new Server(server);


// Declares some of the needed rules for the server, like static changes all img dir to the main div
// as to not have to send every image
app.use(fileUpload());
app.use(express.static("public"));
app.use(express.static(__dirname + "/upload"));

// When starting the server and on the path "/" send the file index.html to the site
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public/index.html"));
});

// On a post request on the path "/" get the data and send it to the userData.json file as json format
app.post("/", (req, res) => {
  var userData = fs.readFileSync("userData.json");
  let alreadyExists = false;
  var myObj = JSON.parse(userData);
  // Loops through all users and checks if username is taken
  myObj.Users.map((user) => {
    if (req.body.username == user.username) {
      alreadyExists = true;
      console.log("Username taken!");
      res.sendFile(join(__dirname, "public/index.html"));

      // Does not work
      /* io.emit("Already exists"); */
    }
  });
  if (!alreadyExists) {
    // Move the uploaded image to upload folder
    req.files.image.mv(__dirname + "/upload/" + req.files.image.name);

    console.log("Image was uploaded!");

    delete req.body.submit;
    req.body.image = req.files.image.name;

    // Takes the input from the form and sends it to the json file as styled json data
    myObj.Users.push(req.body);
    var newData2 = JSON.stringify(myObj, null, 2);
    fs.writeFile("userData.json", newData2, (err) => {
      if (err) throw err;
      console.log("New data added");
    });
    res.sendFile(join(__dirname, "public/index.html"));
  }
});

// Runs when a connection is made between user and server
io.on("connection", (socket) => {
  // Runs when "edit" is sent to the server. It edits a user by selecting them by their username and modifying them by the data sent in
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
  // Runs when "show" is sent to the server. Sends all of the users to the index.html file to get printed out
  socket.on("show", (data) => {
    var userData = fs.readFileSync("./userData.json");

    var myObj = JSON.parse(userData);
    io.emit("printAll", { Users: myObj });
  });
  // Runs when "searchFor" is sent to the server. Gets the users data by the sent in username, then sends it to the index.html for using
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
  // Runs when "change this user" is sent to the server. Creates a object with an array, then pushes all users plus the modified user to it then writes it to the .json file
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
      }
      arr.Users.push(user);
    });
    fs.writeFile("./userData.json", JSON.stringify(arr, null, 2), (err) => {
      if (err) throw err;
      console.log("New data added");
    });
  });
});

// Starts the server at port 3000
server.listen(3000, () => {
  console.log("Server is listening at port 3000");
});
