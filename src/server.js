import http from "http";
import SocketIO from "socket.io";
import express from "express";
import { connected } from "process";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

const connectionLimit = 2;

wsServer.on("connection", (socket) => {
  console.log(socket);
  socket.on("join_room", (roomName, done) => {
    if (wsServer.socket.adapter.get(roomName)?.size <= connectionLimit) {
      socket.join(roomName);
      socket.to(roomName).emit("welcome");
      done();
      return;
    } else {
      socket.emit("error", {
        message: "This room is occupied. Find another room please."
      });
      socket.disconnect();
      return;
    }
  });

  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });

  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });

  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(process.env.PORT, handleListen);
