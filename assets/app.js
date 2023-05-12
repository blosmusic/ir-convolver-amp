const select = document.getElementById("audio-devices-input");
const selectedOptions = document.getElementById("audio-source");
const ampType = document.getElementById("amp-type");

// Create Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
audioContext.suspend();
let mediaStream;
let sourceNode;

// Create Tone objects
const inputGain = new Tone.Gain(0.3);
const outputGain = new Tone.Gain(0.5);
const globalVolume = new Tone.Volume(-6);
const meter = new Tone.Meter();
let convolver = new Tone.Convolver();

const mic = new Tone.UserMedia();

// Handle device selection change
select.addEventListener("change", async () => {
  const selectedDeviceId = select.value;

  // Check if there is an active MediaStream and disconnect it
  if (mediaStream && sourceNode) {
    sourceNode.disconnect();
    mediaStream.getTracks().forEach((track) => track.stop());
  }

  try {
    // Create a MediaStream using the selected audio device
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: selectedDeviceId },
    });

    // Create a MediaStreamAudioSourceNode
    sourceNode = audioContext.createMediaStreamSource(mediaStream);

    // Connect the source node to the audio context destination
    // sourceNode.connect(audioContext.destination);
  } catch (error) {
    console.error("Error accessing audio device:", error);
  }
});

// Enumerate audio devices after user permission is granted
navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then(() => {
    // Enumerate audio devices
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        // Filter audio input devices
        const audioInputDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );

        // Populate the select element with audio input devices
        audioInputDevices.forEach((device) => {
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.text = device.label || `Audio Input ${device.deviceId}`;
          select.appendChild(option);
        });
      })
      .catch((error) => {
        console.error("Error enumerating audio devices:", error);
      });
  })
  .catch((error) => {
    console.error("Error accessing audio device:", error);
  });

// Add IRs to the select element
function getAmpIRs() {
  fetch("assets/ampIRs")
    .then((response) => response.text())
    .then((data) => {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(data, "text/html");
      const ampIRs = htmlDoc.querySelectorAll("a");

      // Iterate through the links and add WAV files to the select menu
      for (let i = 0; i < ampIRs.length; i++) {
        const link = ampIRs[i].getAttribute("href");
        if (link.endsWith(".wav")) {
          const option = document.createElement("option");
          option.value = link;
          option.textContent = link.substring(15, link.length - 4);
          ampType.appendChild(option);
        }
      }
    })
    .catch((error) => {
      console.error("Error getting amp IRs:", error);
    });
}
getAmpIRs();

// Handle amp type change
ampType.addEventListener("change", async () => {
  convolver.disconnect();

  // Get the selected amp type
  const selectedAmpType = ampType.value;
  console.log(selectedAmpType);

  // Load the impulse response from the selected file
  const impulseResponse = new Tone.Buffer(selectedAmpType, () => {
    // Set the loaded impulse response to the convolver
    convolver.buffer = impulseResponse;

    //bypass convolver if no amp type is selected
    if (ampType.value === "") {
      convolver.dispose();
      mic.connect(meter);
    } else {
      convolver = new Tone.Convolver(impulseResponse);
      mic.connect(convolver);
      convolver.connect(meter);
    }
  });
});

// Create Audio Permission
document.body.addEventListener("click", async () => {
  await Tone.start();
  document.querySelector("h4").innerText = "Permission Granted";
  console.log("audio is ready");
});

function startAudio() {
  mic
    .open()
    .then(() => {
      console.log("Mic is open");
      resumeAudio();
    })
    .catch((e) => {
      console.log("Mic is not open");
      console.log(e);
    });
}

// Select audio type
selectedOptions.addEventListener("change", (event) => {
  const selectedOptionValue = event.target.value;

  switch (selectedOptionValue) {
    case "mono":
      monoAudio();
      break;
    case "stereo":
      stereoAudio();
      break;
    default:
      muteAudio();
      break;
  }
});

/// Audio Functions
// MONO AUDIO
function monoAudio() {
  console.log("Mono");
  startAudio();
  const monoOutput = new Tone.Mono();
  Tone.Destination.chain(
    inputGain,
    outputGain,
    globalVolume,
    meter,
    monoOutput
  );
}

// STEREO AUDIO
function stereoAudio() {
  console.log("Stereo");
  startAudio();
  const monoLeft = new Tone.Mono({ channelCount: 1 });
  const monoRight = new Tone.Mono({ channelCount: -1 });
  Tone.Destination.chain(
    inputGain,
    outputGain,
    globalVolumemeter,
    monoLeft,
    monoRight
  );
}

// MUTE AUDIO
function muteAudio() {
  mic.close();
  audioContext.suspend();
  Tone.Transport.stop();
  console.log("Mute");
}

function resumeAudio() {
  // Resume the audio context
  if (audioContext.state === "suspended") {
    audioContext.resume();
    Tone.Transport.start();
    // setInterval(() => console.log(meter.getValue()), 100); // for testing purposes
  }
  console.log("Resume");
}
