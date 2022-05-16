import http from "http";
import WebSocket from "ws";
import express from 'express';

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views")
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anonyumous";

  console.log("Connected to Browser: ✅");
  socket.on("close", () => console.log("Connected to Browser: ❌"));
  
  socket.on("message", (msg, isBinary) => {
    const message = isBinary ? msg : msg.toString("utf8");
    console.log(message, isBinary)
    const parsed = JSON.parse(message);
    switch(parsed.type) {
      case "new_message":
        sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${parsed.payload}`));
        // sockets.forEach((aSocket) => aSocket.send(isBinary ? message : message.toString("utf8")));
        break;
      case "nickname":
        socket["nickname"] = parsed.payload;
        break;
      default:
        break;
    }
  });
});

server.listen(3000, handleListen);