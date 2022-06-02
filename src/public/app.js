const socket = io();

// First view
const call = document.getElementById("call");

call.hidden = true;

//----------------
// Get camera and audio of user in the room
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((cam) => {
      const option = document.createElement("option");
      option.value = cam.deviceId;
      option.innerText = cam.label;
      if (currentCamera.label === cam.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstraint = {
    audio: true,
    video: { facingMode: "user" }
  };
  const cameraConstraint = {
    audio: true,
    video: { devideId: { exact: deviceId } }
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraint : initialConstraint
    );
    myFace.srcObject = myStream;
    if (!deviceId) await getCameras();
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Trun Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  await getCameras(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

//----------------
// Welcome Form: choose a room
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(e) {
  e.preventDefault();
  const input = welcomeForm.querySelector("input");
  roomName = input.value;
  await initCall();
  socket.emit("join_room", roomName, () => {
    welcome.hidden = true;
    call.hidden = false;
  });
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//-----------------
// Chat events
const chat = document.getElementById("chat");
const chatList = chat.querySelector("ul");
const chatForm = chat.querySelector("form");

function addChatMsg(message, type) {
  const chatItem = document.createElement("li");
  switch (type) {
    default:
    case "announcement":
      chatItem.setAttribute("data-type", "announcement");
      break;
    case "mine":
      chatItem.setAttribute("data-type", "mine");
      break;
    case "peer":
      chatItem.setAttribute("data-type", "peer");
      break;
  }
  chatItem.innerText = message;
  chatList.appendChild(chatItem);
}

function handleChatSubmit(event) {
  event.preventDefault();
  const input = chatForm.querySelector("input");
  const message = input.value;
  myDataChannel.send(message);
  input.value = "";

  addChatMsg(message, "mine");
}

chatForm.addEventListener("submit", handleChatSubmit);

//-----------------
// Socket events
socket.on("welcome", async () => {
  // These code run on Peer A.
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (event) =>
    addChatMsg(event.data, "peer")
  );
  // If someone else joined the room,
  // signaling process will be started.
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  // These code run on Peer B.
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) =>
      addChatMsg(event.data, "peer")
    );
  });
  // Get the offer from Peer A,
  // and then Peer B set the remote description.
  myPeerConnection.setRemoteDescription(offer);
  // Create answer and sen this answer to Peer A.
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  // Finally, Peer A get the anser from Peer B.
  // Peer A set the remote description.
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

socket.on("error", ({ message }) => {
  alert(message);
});

socket.on("disconnect", () => {
  myPeerConnection.close();
});

//----------------
// RTC
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [ // temporary urls examles
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302"
        ]
      }
    ]
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  //Got ice candidate and send this
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  //Then we are getting the stream from the another peer
  const peersStream = document.querySelector("#peerFace video");
  peersStream.srcObject = data.stream;
}
