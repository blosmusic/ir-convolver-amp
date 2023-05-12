// Get the slider and knob elements
const sliderGroup = document.querySelector(".amp-slider");
const knobs = document.querySelectorAll(".amp-control ");

// Function to handle mouse or touch events
function handleDrag(event) {
  event.preventDefault();

  // Get the parent slider ID
  const sliderId = event.target.parentNode.id;
  const sliderValue = event.target.value;

  // Rest of the code for handling slider interaction
  // ...
  console.log(sliderId + " is being dragged", sliderValue, "value");
}

// Add event listeners to handle dragging for each knob
knobs.forEach((knob) => {
  knob.addEventListener('mousedown', handleDrag);
  knob.addEventListener('mousemove', handleDrag);
  knob.addEventListener('mouseup', handleDrag);
  knob.addEventListener('touchstart', handleDrag);
  knob.addEventListener('touchmove', handleDrag);
  knob.addEventListener('touchend', handleDrag);
});