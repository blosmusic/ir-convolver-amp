const select = document.getElementById("audio-devices-input");
const selectedOptions = document.getElementById("audio-source");
// const basePath = new URL("./assets/ampIRs", window.location.href).href;
const ampIRsPath = "./assets/ampIRs/";
const ampType = document.getElementById("amp-type");
let ampSelection;

// Create Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
audioContext.suspend();
let mediaStream;
let sourceNode;

// Get the slider and knob elements
let sliders = document.getElementsByClassName("amp-control");
let inputGainValue = 0.5;
let outputGainValue = 1;
let globalVolumeValue = -1;

// Create Tone buffer
Tone.context.latencyHint = "fastest";
Tone.context.lookAhead = 0;
Tone.context.updateInterval = 0.01;
Tone.context.bufferSize = 256;

// Create Tone objects
const mic = new Tone.UserMedia();
const inputGain = new Tone.Gain(inputGainValue);
const outputGain = new Tone.Gain(outputGainValue);
const globalVolume = new Tone.Volume(globalVolumeValue);
let convolver = new Tone.Convolver();
const meter = new Tone.Meter();
const destination = Tone.Destination;

mic.connect(inputGain);
inputGain.connect(outputGain);
outputGain.connect(globalVolume);

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
// function getAmpIRs() {
  fetch(ampIRsPath)
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
// }
// getAmpIRs();

// Handle amp type change
ampType.addEventListener("change", async () => {
  convolver.dispose();

  // Get the selected amp type
  const selectedAmpType = ampType.value;
  console.log("Amp IR:", selectedAmpType);

  // Load the impulse response from the selected file
  const impulseResponse = new Tone.Buffer(selectedAmpType, () => {
    // Set the loaded impulse response to the convolver
    convolver.buffer = impulseResponse;

    //bypass convolver if no amp type is selected
    if (ampType.value === "") {
      globalVolume.connect(meter);
      setInterval(() => console.log(meter.getValue()), 100);
    } else {
      convolver = new Tone.Convolver(impulseResponse);
      globalVolume.connect(convolver);
      convolver.connect(meter);
    }
  });
});

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
  meter.chain(monoOutput, destination);
  // setInterval(() => console.log(meter.getValue()), 100); // for testing purposes
}

// STEREO AUDIO
function stereoAudio() {
  console.log("Stereo");
  startAudio();
  const monoLeft = new Tone.Mono({ channelCount: 1 });
  const monoRight = new Tone.Mono({ channelCount: -1 });
  meter.chain(monoLeft, monoRight, destination);
  // setInterval(() => console.log(meter.getValue()), 100); // for testing purposes
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
  }
  console.log("Resume");
}

// Slider Functions
for (let i = 0; i < sliders.length; i++) {
  sliders[i].addEventListener("input", function () {
    let sliderValue = parseFloat(this.value);
    let sliderId = this.id;

    console.log("Slider ID:", sliderId, "\t", "Slider Value:", sliderValue);

    // update the value in tone.js
    if (sliderId === "amp-gain-input") {
      inputGainValue = sliderValue;
      inputGain.gain.value = inputGainValue;
    } else if (sliderId === "amp-gain-output") {
      outputGainValue = sliderValue;
      outputGain.gain.value = outputGainValue;
    } else if (sliderId === "amp-global-volume") {
      globalVolumeValue = sliderValue;
      globalVolume.volume.value = globalVolumeValue;
    } else {
      console.log("Error: slider ID not found");
    }
  });
}
