import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms }
    }
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function roomMembers(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  //console.log(socket);
  socket["nickname"] = "anonymous";
  wsServer.sockets.emit("room_change", publicRooms());

  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });

  socket.on("enter_room", (nickname, roomName, done) => {
    socket["nickname"] = nickname;
    socket.join(roomName);
    done(roomMembers(roomName));
    socket.to(roomName).emit("welcome", socket.nickname, roomMembers(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, roomMembers(room) - 1)
    );
  });

  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });

  socket.on("new_message", (newMsg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${newMsg}`);
    done();
  });

  socket.on("nickname", (userName, newName, room, done) => {
    socket["nickname"] = newName;
    socket.to(room).emit("nickname_change", userName, newName);
    done();
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
