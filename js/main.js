'use strict';

const startButtonReceiver = document.getElementById('startButtonReceiver');
const startButtonSender = document.getElementById('startButtonSender');
const localTestOnly = document.getElementById('localTestOnly');
const hangupButton = document.getElementById('hangupButton');
hangupButton.disabled = true;
let senderCall = false;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const cloneVideo = document.getElementById('cloneVideo');
const captureStreamVideo = document.getElementById('captureStreamVideo');
const event_out = document.getElementById('event_out');

let pc;
let localStream;
let combinedStream;
let captureStream;

let clonedStream;
let remoteStreamCopy;

const signaling = new BroadcastChannel('webrtc');
signaling.onmessage = e => {
  if (!localStream) {
    console.log('not ready yet');
    return;
  }
  switch (e.data.type) {
    case 'offer':
      handleOffer(e.data);
      break;
    case 'answer':
      handleAnswer(e.data);
      break;
    case 'candidate':
      handleCandidate(e.data);
      break;
    case 'ready':
      if (pc) {
        console.log('already in call, ignoring');
        return;
      }
      makeCall();
      break;
    case 'bye':
      if (pc) {
        hangup();
      }
      break;
    default:
      console.log('unhandled', e);
      break;
  }
};

startButtonSender.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  localVideo.srcObject = localStream;

  // Create an AudioContext and an oscillator
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const destination = audioContext.createMediaStreamDestination();
  // Connect oscillator to the MediaStreamDestination
  oscillator.connect(destination);
  oscillator.start();

  // Create a new MediaStream containing both audio and video
  combinedStream = new MediaStream();

  // Add the audio track from destination to the new stream
  destination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));

  // Add the video track from localStream to the new stream
  localStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

  startButtonSender.disabled = true;
  hangupButton.disabled = false;
  senderCall = true;

  signaling.postMessage({type: 'ready'});
};

startButtonReceiver.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
  localVideo.srcObject = localStream;

  startButtonReceiver.disabled = true;
  hangupButton.disabled = false;

  signaling.postMessage({type: 'ready'});
};

localTestOnly.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

  // Create an AudioContext and an oscillator
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const destination = audioContext.createMediaStreamDestination();
  // Connect oscillator to the MediaStreamDestination
  oscillator.connect(destination);
  oscillator.start();

  // Create a new MediaStream containing both audio and video
  combinedStream = new MediaStream();
  // Add the audio track from destination to the new stream
  destination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
  // Add the video track from localStream to the new stream
  localStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

  localTestOnly.disabled = true;
  localVideo.srcObject = combinedStream;
};

hangupButton.onclick = async () => {
  hangup();
  signaling.postMessage({type: 'bye'});
};

async function hangup() {
  if (pc) {
    pc.close();
    pc = null;
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  if (combinedStream) {
    combinedStream.getTracks().forEach(track => track.stop());
    combinedStream = null;
  }
  if (remoteStreamCopy) {
    remoteStreamCopy.getTracks().forEach(track => track.stop());
    remoteStreamCopy = null;
  }
  if (clonedStream) {
    clonedStream.getTracks().forEach(track => track.stop());
    clonedStream = null;
  }    
  startButtonReceiver.disabled = false;
  startButtonSender.disabled = false;
  hangupButton.disabled = true;
}

document.getElementById('remoteStop').onclick = () => {
  remoteStreamCopy.getTracks().forEach(track => track.stop());
};

document.getElementById('remoteEnable').onclick = () => {
  remoteStreamCopy.getTracks().forEach(track => {
    track.enabled = true;
  });
};

document.getElementById('remoteDisable').onclick = () => {
  remoteStreamCopy.getTracks().forEach(track => {
    track.enabled = false;
  });
};

document.getElementById('cloneStop').onclick = () => {
  clonedStream.getTracks().forEach(track => track.stop());
};

document.getElementById('cloneEnable').onclick = () => {
  clonedStream.getTracks().forEach(track => {
    track.enabled = true;
  });
};

document.getElementById('cloneDisable').onclick = () => {
  clonedStream.getTracks().forEach(track => {
    track.enabled = false;
  });
};

document.getElementById('localStop').onclick = () => {
  if (combinedStream) {
    combinedStream.getTracks().forEach(track => track.stop());
  } else {
    localStream.getTracks().forEach(track => 
      track.stop()
    );
  }
}

document.getElementById('localEnable').onclick = () => {
  if (combinedStream) {
    combinedStream.getTracks().forEach(track => {
      track.enabled = true;
    });
  } else {  
    localStream.getTracks().forEach(track => {
      track.enabled = true;
    });
  }
};

document.getElementById('localDisable').onclick = () => {
  if (combinedStream) {
    combinedStream.getTracks().forEach(track => {
      track.enabled = false;
    });
  } else {  
    localStream.getTracks().forEach(track => {
      track.enabled = false;
    });
  }
};

document.getElementById('captureStream').onclick = () => {
  if (remoteStreamCopy) {
    captureStream = remoteVideo.captureStream();
    captureStreamVideo.srcObject = captureStream;
  } else {
    console.log('remoteStreamCopy not ready');
  }
}

document.getElementById('captureEnable').onclick = () => {
  if (captureStream) {
    captureStream.getTracks().forEach(track => {
      track.enabled = true;
    });
  } else {
    console.log('captureStream not ready');
  }
};

document.getElementById('captureDisable').onclick = () => {
  if (captureStream) {
    captureStream.getTracks().forEach(track => {
      track.enabled = false;
    });
  } else {
    console.log('captureStream not ready');
  }
};

function createPeerConnection() {
  pc = new RTCPeerConnection();
  pc.onicecandidate = e => {
    const message = {
      type: 'candidate',
      candidate: null,
    };
    if (e.candidate) {
      message.candidate = e.candidate.candidate;
      message.sdpMid = e.candidate.sdpMid;
      message.sdpMLineIndex = e.candidate.sdpMLineIndex;
    }
    signaling.postMessage(message);
  };
  pc.ontrack = e => {
    // if (remoteStreamCopy) {
    //   return;
    // }
    
    // Ensure the audio plays on the remote side.
    if (!senderCall) {
      remoteStreamCopy = e.streams[0];

      remoteStreamCopy.getAudioTracks()[0].addEventListener('mute', () => {
        DumpEvent('muted:remoteCopy')
      })

      remoteStreamCopy.getAudioTracks()[0].addEventListener('unmute', () => {
        DumpEvent('un_muted:remoteCopy')
      });

      clonedStream = remoteStreamCopy.clone();
      
      clonedStream.getAudioTracks()[0].addEventListener('mute', () => {
        DumpEvent('muted:clonedStream')
      })
      clonedStream.getAudioTracks()[0].addEventListener('unmute', () => {
        DumpEvent('unmute:clonedStream')
      })   

      remoteVideo.srcObject = remoteStreamCopy;

      cloneVideo.srcObject = clonedStream;

      {
      // Multiple streams share the same track.
      // cloneVideo.srcObject = new MediaStream([
      //   remoteStreamCopy.getVideoTracks()[0],
      //   remoteStreamCopy.getAudioTracks()[0]]);
      }
    }
  };

  if (senderCall) {
    combinedStream.getTracks().forEach(track => pc.addTrack(track, combinedStream));
  }
}

async function makeCall() {
  await createPeerConnection();
  const offer = await pc.createOffer();
  signaling.postMessage({type: 'offer', sdp: offer.sdp});
  await pc.setLocalDescription(offer);
}

async function handleOffer(offer) {
  if (pc) {
    console.error('existing peerconnection');
    return;
  }
  await createPeerConnection();
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  signaling.postMessage({type: 'answer', sdp: answer.sdp});
  await pc.setLocalDescription(answer);
}

async function handleAnswer(answer) {
  if (!pc) {
    console.error('no peerconnection');
    return;
  }
  await pc.setRemoteDescription(answer);
}

async function handleCandidate(candidate) {
  if (!pc) {
    console.error('no peerconnection');
    return;
  }
  if (!candidate.candidate) {
    await pc.addIceCandidate(null);
  } else {
    await pc.addIceCandidate(candidate);
  }
}

function DumpEvent(log) {
  event_out.innerHTML += log + '<br>';
}