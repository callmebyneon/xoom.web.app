// this socket: represents a connection to the server
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
  console.log("Connected to Server: ✅");
});

socket.addEventListener("message", async (message) => {
  console.log(message.data)
  if (typeof message.data === "string") {
    console.log("New Message:", message.data);
  } else {
    console.log(await message.date.text());
  }
});

socket.addEventListener("close", () => {
  console.log("Connected to Server: ❌");
});

setTimeout(() => {
  socket.send("hello from the browser!");
}, 10000);