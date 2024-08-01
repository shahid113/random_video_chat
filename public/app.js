const socket = io.connect(window.location.origin);
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
});

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const loader = document.getElementById('loader');
const videoContainer = document.getElementById('videoContainer');
const nextButton = document.getElementById('nextButton');

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  })
  .catch(error => {
    console.error('Error accessing media devices.', error);
  });

peerConnection.ontrack = event => {
  remoteVideo.srcObject = event.streams[0];
};

peerConnection.onicecandidate = event => {
  if (event.candidate) {
    socket.emit('ice-candidate', event.candidate);
  }
};

socket.on('paired', async ({ peerId }) => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', { offer, peerId });

  // Hide loader and show video container and button when paired
  loader.classList.add('hidden');
  videoContainer.classList.remove('hidden');
  nextButton.classList.remove('hidden');
});

socket.on('offer', async ({ offer }) => {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { answer });
});

socket.on('answer', async ({ answer }) => {
  await peerConnection.setRemoteDescription(answer);
});

socket.on('ice-candidate', async (candidate) => {
  await peerConnection.addIceCandidate(candidate);
});

document.getElementById('nextButton').addEventListener('click', () => {
  location.reload();  // Simple reload for 'Next' button functionality
});
