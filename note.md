# Lecture Notes

> Core concepts and note explain shortly.   

The contens below are in the order of lecture and development.

## 1. Set up the project
### nodemon.json
```js
{
  "ignore": ["src/public/*"],
  "exec": "babel-node src/server.js"
}
```
- The Program as we know watchs the file system and it will restart th server every time something changes.
- "exec": Instead of restarting, Nodemon is going to execute `babel-node` to the `src/server.js` file.

### server.js
```js
import express from 'express'; // [1] import express application

const app = express();

app.set("view engine", "pug"); // [2] set "view engine" to be "pug"
app.set("views", __dirname + "/views")  // [3] set "views" directory
app.use("/public", express.static(__dirname + "/public"));  // [4] set public directory => for Frontend codes
app.get("/", (req, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");
app.listen(3000, handleListen);
```
- If set the public directory like [4], when user go to "/public", user will be able to see the content of the public folder in our project. This means that we can contorl what the user can see.

### mvp.css
```html
<link rel="stylesheet" href="https://unpkg.com/mvp.css">
```

## 2. Build WebSocket Server
### ws server
```js
// server.js
import http from "http";
import WebSocket from "ws";
import express from 'express';

const app = express();

...

const server = http.createServer(app);  // [5] create http server,
const wss = new WebSocket.Server({ server }); // [6] and make web socket server with `server` by http.

...

server.listen(3000, handleListen);  // [7] Then server can listen like this.
```
- To put them together with previous express server on the same port, [5] create make http server with previous express server by `requestListener`. Next, [6] create websocket server and pass `server` to run both server _(http&ws)_. Then we create websocket server on top of http server created using express.js. The http server is exposed by web site and ws on top of that. So we are able to handle both http, ws request on the same port.

### create first connection between the backend and the frontend
```js
// server.js
...
const handleConnection = (socket, request) => {
  console.log(socket) // this socket: represents the browser that just connected
};

wss.on("connection", handleConnection);
...
```
```js
// app.js
const socket = new WebSocket(`ws://${window.location.host}`); // this socket: represents a connection to the server
...
```

### sending and receiving a message to the browser
```js
// server.js
...
// [8] listening the "connection" event, and the callback function pass "socket".
wss.on("connection", (socket) => {
  console.log("Connected to Browser: ✅");

  // [9] listening the "close" event, and when browser closed the callback function run
  socket.on("close", () => console.log("Connected to Browser: ❌"));

  // [10] listening the "message" event, and the callback function pass "message" just recieved
  socket.on("message", (message) => console.log(message));

  // [11] sending message to connected browser
  socket.send("hello!!");
});
...
```
```js
// app.js
...
// [12] listening the "open" evnet, and when server opened the callback function run
socket.addEventListener("open", () => {
  console.log("Connected to Server: ✅");
});

// [13] listening the "message" event, and the callback function pass "message" just recieved
socket.addEventListener("message", (message) => {
  console.log("New Message:", message.data);
});

// [14] listening the "close" event, and when server closed the callback function run
socket.addEventListener("close", () => {
  console.log("Connected to Server: ❌");
});

// [15] sending message to connected server
setTimeout(() => {
  socket.send("hello from the browser!");
}, 10000);
```
- Without "connection" evnet listener [8], browser can listen "open" event of websocket.
- The first argument of [11], must be of type `string` or an `instance of Buffer`, `ArrayBuffer`, or `Array` or an `Array-like Object`.
