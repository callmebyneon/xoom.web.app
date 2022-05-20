const socket = io();

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName = "";
let nickname = "";

/*
 * FUNCTION TO SEND A MESSAGE
 */
function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", value, roomName, () => {
    addMessage(`You: ${value}`, "message_mine");
  });
  input.value = "";
}

/*
 * FUNCTION TO CHANGE NICKNAME
 */
function handleNicknameSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#name input");
  const newName = input.value;
  socket.emit("nickname", nickname, newName, roomName, () => {
    addMessage(`success: ${nickname} => ${newName}`, "announcement");
  });
  nickname = newName;
}

/*
 * FUNCTION TO SHOW THE ROOM TO USER
 */
function showRoom() {
  // hide welcome form and show form in the room
  welcome.hidden = true;
  room.hidden = false;

  // paint roomname that user inputted
  const h3 = room.querySelector("h3");
  h3.innerText = `Room: ${roomName}`;

  room.querySelector("#msg input").focus();

  /*
   * SEND MESSAGE
   */
  const msgForm = room.querySelector("#msg");
  msgForm.addEventListener("submit", handleMessageSubmit);

  /*
   * CHANGE NICKNAME
   */
  const nameForm = room.querySelector("#name");
  nameForm.addEventListener("submit", handleNicknameSubmit);
}

/*
 * ENTER THE CHAT ROOM
 */
welcomeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nicknameInput = welcomeForm.querySelector("input[name='nickname']");
  const roomnameInput = welcomeForm.querySelector("input[name='roomname']");
  const nicknameValue = nicknameInput.value;
  const roomnameValue = roomnameInput.value;

  // save nickname and enter the chat room
  socket.emit("enter_room", nicknameValue, roomnameValue, (membersCount) => {
    showRoom();
    const h3 = room.querySelector("h3");
    h3.innerText = `Room: ${roomName} (${membersCount})`;

    room.querySelector("#name input").value = nicknameValue;

    addMessage(
      membersCount > 1
        ? `You just make ${membersCount} members!`
        : `You are a founder this chat room!`,
      "announcement"
    );
  });
  nickname = nicknameValue;
  roomName = roomnameValue;
  roomnameInput.value = "";
});

function addMessage(msg, type) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  switch (type) {
    case "announcement":
      li.setAttribute("data-type", "announcement");
      break;
    case "message_new":
      li.setAttribute("data-type", "new");
      break;
    case "message_mine":
      li.setAttribute("data-type", "mine");
      break;
    default:
      throw new Error("Unexpected message type");
  }

  li.innerText = msg;
  ul.appendChild(li);
}

/*
 * GET EVENT FROM SERVER
 */
socket.on("welcome", (user, membersCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room: ${roomName} (${membersCount})`;
  addMessage(`'${user}' joined this chat room! (^^`, "announcement");
});

socket.on("bye", (user, membersCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room: ${roomName} (${membersCount})`;
  addMessage(`'${user}' left this chat room (;-;`, "announcement");
});

socket.on("new_message", (msg) => addMessage(msg, "message_new"));

socket.on("room_change", (rooms) => {
  console.log(rooms);
  const roomList = welcome.querySelector("ul");

  roomList.innerHTML = "";

  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});

socket.on("nickname_change", (userName, newName) => {
  addMessage(`nickname changed: ${userName} => ${newName}`, "announcement");
});
