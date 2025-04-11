// Global variables for the simulation state
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const algoSelect = document.getElementById("algoSelect");
const stepBtn = document.getElementById("stepBtn");
const continueBtn = document.getElementById("continueBtn");
const resetBtn = document.getElementById("resetBtn");

let points = []; // Array to hold points added by user
let hull = []; // Array holding the computed convex hull points
let currentStep = 0; // Step counter for incremental visualization
let algorithm = algoSelect.value; // Current selected algorithm

// Utility: Draw all points
function drawPoints() {
  ctx.fillStyle = "black";
  for (const pt of points) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Utility: Clear canvas and redraw points (and partial hull if available)
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPoints();
  if (hull.length > 0) {
    // Draw already stepped hull edges
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (currentStep > 0) {
      ctx.moveTo(hull[0].x, hull[0].y);
      // Only draw edges up to the current step
      for (let i = 1; i < currentStep; i++) {
        ctx.lineTo(hull[i].x, hull[i].y);
      }
      ctx.stroke();
    }
  }
}

// Event: Canvas mouse click to add a point
canvas.addEventListener("click", function (e) {
  // Get bounding rectangle for correct mouse position within the canvas.
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  points.push({ x, y });
  resetHull(); // reset any previous convex hull simulation when a new point is added
  redraw();
});

// Function to compute convex hull (Monotone Chain Implementation)
function computeConvexHull(pts) {
  if (pts.length <= 1) return pts.slice();
  let sorted = pts
    .slice()
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  // Function to compute cross product (o->a and o->b)
  function cross(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  let lower = [];
  for (let p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }
  let upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    let p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }
  // Remove the last point of each list as it's the starting point of the other list.
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// Reset hull simulation state when new points are added or reset is pressed.
function resetHull() {
  hull = [];
  currentStep = 0;
}

// Handle algorithm selection change
algoSelect.addEventListener("change", function () {
  algorithm = this.value;
  resetHull();
  redraw();
});

// Simulation "step" button: reveal one more edge of the convex hull
stepBtn.addEventListener("click", function () {
  if (points.length < 3) {
    alert("At least 3 points are needed to compute a convex hull.");
    return;
  }
  // If no hull computed yet, compute it.
  if (hull.length === 0) {
    // You can later add different algorithm implementations here.
    // For now, we use the standard convex hull computed by monotone chain.
    hull = computeConvexHull(points);
    currentStep = 1; // Start drawing from the first vertex.
  }
  // Increment step if we haven't finished drawing the entire hull.
  if (currentStep < hull.length) {
    currentStep++;
  }
  // Optionally, if the algorithm simulation requires it, you can show intermediate computation states
  // based on the selected algorithm (algorithm-specific logic can go here).

  redraw();
  // If all hull edges have been drawn, optionally connect the last edge.
  if (currentStep === hull.length) {
    ctx.beginPath();
    ctx.moveTo(hull[hull.length - 1].x, hull[hull.length - 1].y);
    ctx.lineTo(hull[0].x, hull[0].y);
    ctx.stroke();
  }
});

// "Continue" button: complete the hull drawing immediately.
continueBtn.addEventListener("click", function () {
  if (points.length < 3) {
    alert("At least 3 points are needed to compute a convex hull.");
    return;
  }
  if (hull.length === 0) {
    hull = computeConvexHull(points);
  }
  currentStep = hull.length;
  redraw();
  // Connect last hull point to the first to complete the polygon
  ctx.beginPath();
  ctx.moveTo(hull[hull.length - 1].x, hull[hull.length - 1].y);
  ctx.lineTo(hull[0].x, hull[0].y);
  ctx.stroke();
});

// "Reset" button: clear canvas and simulation state.
resetBtn.addEventListener("click", function () {
  points = [];
  resetHull();
  redraw();
});
