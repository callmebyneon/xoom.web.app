# Xoom

> Zoom Clone using NodeJS, WebRTC and Websockets.


## Note from Courses

_Core concepts and note explain shortly_

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

const handleListen = () => console.log("Listening on http://localhost:3000");
app.listen(3000, handleListen);
```
- If set the public directory like [4], when user go to "/public", user will be able to see the content of the public folder in our project. This means that we can contorl what the user can see.

### mvp.css
```html
<link rel="stylesheet" href="https://unpkg.com/mvp.css">
```