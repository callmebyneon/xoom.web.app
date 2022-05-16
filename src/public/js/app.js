const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", { payload: input.value }, () => {
    console.log("server is done!");
  });  // emit an event called "enter_room", and can send a argument, third one is a function called on server and running on the brower
  input.value="";
})