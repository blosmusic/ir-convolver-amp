// Get the slider and knob elements
const slider = document.querySelector(".amp-slider");
const knob = document.querySelector(".amp-control");

// Variables to track the slider state
let isDragging = false;

// Function to handle mouse or touch events
function handleDrag(event) {
  event.preventDefault();

  if (event.type === "mousedown" || event.type === "touchstart") {
    isDragging = true;
  } else if (event.type === "mouseup" || event.type === "touchend") {
    isDragging = false;
  }

  if (isDragging) {
    // Calculate the angle based on the mouse or touch position
    const sliderRect = slider.getBoundingClientRect();
    const centerX = sliderRect.left + sliderRect.width / 2;
    const centerY = sliderRect.top + sliderRect.height / 2;
    const angle =
      Math.atan2(event.clientY - centerY, event.clientX - centerX) *
      (180 / Math.PI);

    // Update the knob position
    knob.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
  }
}

// Add event listeners to handle dragging
slider.addEventListener("mousedown", handleDrag);
slider.addEventListener("mousemove", handleDrag);
slider.addEventListener("mouseup", handleDrag);
slider.addEventListener("touchstart", handleDrag);
slider.addEventListener("touchmove", handleDrag);
slider.addEventListener("touchend", handleDrag);
