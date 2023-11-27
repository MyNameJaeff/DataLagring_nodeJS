const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const fs = require("fs");
const fileUpload = require('express-fileupload');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(fileUpload());

app.use(express.static('public'));

app.use(express.static(__dirname+'/upload'));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public/index.html"));
});

app.post('/', (req, res) => {
  // Move the uploaded image to our upload folder
  req.files.image.mv(__dirname + '/upload/' + req.files.image.name);

  // All good
  console.log("Image was uploaded!");

  var userData = fs.readFileSync("userData.json");
  var myObj = JSON.parse(userData);

  delete req.body.submit;
  req.body.image = (req.files.image.name);

  myObj.Users.push(req.body);
  var newData2 = JSON.stringify(myObj);
  fs.writeFile("userData.json", newData2, (err) => {
    if (err) throw err;
    console.log("New data added\n");
  });
  res.sendFile(join(__dirname, "public/index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("create", (data) => {
    console.log(data);

  });
  socket.on("edit", (data) => {

    var userData = fs.readFileSync("userData.json");

    var myObj = JSON.parse(userData);
    myObj.Users.push(data);
    var newData2 = JSON.stringify(myObj);
    fs.writeFile("userData.json", newData2, (err) => {
      if (err) throw err;
      console.log("New data added");
    });
  });
  socket.on("show", (data) => {
    var userData = fs.readFileSync("userData.json");

    var myObj = JSON.parse(userData);
    io.emit("printAll", { Users: myObj });
  });
  socket.on("searchFor", (data) => {
    console.log(data);
  })
});

server.listen(3000, () => {
  console.log("Server is listening at port 3000");
});
