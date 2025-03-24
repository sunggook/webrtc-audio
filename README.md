This branch is based on the WebRTC Data Channel sample, with a focus on audio testing. It includes additional controls to stop, enable, or disable streams.

How to Test Using the Site

Open Tab 1: Go to WebRTC Audio Test (https://sunggook.github.io/webrtc-audio/)
Open Tab 2: Navigate to the same URL in a second tab.
Start the Sender: On Tab 1, click the 'StartSender' button at the bottom. This will create a video from your webcam, while the audio is generated using an Oscillator audio context.
Start the Receiver: On Tab 2, click the 'ReceiverSender' button at the bottom. It connects PeerConnection from the Tab 1, and It will display:
  Video 1: Your webcam video.
  Video 2: The remote video from Tab 1.
  Video 3: A cloned version of Video 2.
Test Remote Streams: Use the 'Remote'* buttons to control and test video/audio streams for Video 2.
Test Cloned Streams: Use the 'Clone'* buttons to control and test video/audio streams for Video 3.

Additional Tests:
Use the 'Local'* buttons to test local streams.
Use the 'Capture'* buttons to test streams captured from Video 2.
This setup allows comprehensive testing of both remote and cloned video/audio streams."
