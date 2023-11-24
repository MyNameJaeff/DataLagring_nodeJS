const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("create", (data) => {
    var userData = fs.readFileSync("userData.json");

    var myObj = JSON.parse(userData);
    myObj.Users.push(data);
    var newData2 = JSON.stringify(myObj);
    fs.writeFile("userData.json", newData2, (err) => {
          if (err) throw err;
      console.log("New data added");
    });
  });
  socket.on("edit", (data) => {
    console.log(data);
    var userData = fs.readFileSync("userData.json");

    var myObj = JSON.parse(userData);
    myObj.Users.push(data);
    var newData2 = JSON.stringify(myObj);
    fs.writeFile("userData.json", newData2, (err) => {
          if (err) throw err;
      console.log("New data added");
    });

  });
});

server.listen(3000, () => {
  console.log("Server is listening at port 3000");
});
