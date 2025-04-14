// Global variables for the simulation state
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const algoSelect = document.getElementById("algoSelect");
const stepBtn = document.getElementById("stepBtn");
const continueBtn = document.getElementById("continueBtn");
const resetBtn = document.getElementById("resetBtn");

let points = []; // Array to hold points added by user

function v2(x, y) {
  return { x: x, y: y };
}

function sub(u, v) {
  return { x: u.x - v.x, y: u.y - v.y };
}

function dot(u, v) {
  return u.x * v.x + u.y * v.y;
}

function normal(v) {
  // Given a vector v, return one perpendicular vector [-v.y, v.x]
  return { x: -v.y, y: v.x };
}

class Naive {
  constructor() {
    // 3 states: checkSegment, nextSegment, done
    this.state = "checkSegment";
    this.edges = [];
    this.i = 0;
    this.j = this.i + 1;
  }

  step() {
    if (this.state === "done") {
      return;
    }

    if (this.state === "checkSegment") {
      const u = v2(points[this.i].x, points[this.i].y);
      const v = v2(points[this.j].x, points[this.j].y);
      const u_to_v = sub(v, u);
      const normal_ = normal(u_to_v);

      let positive_halfplane = 0;
      let negative_halfplane = 0;

      for (let k = 0; k < points.length; k++) {
        if (k === this.i || k === this.j) {
          continue;
        }

        const p = points[k];
        const u_to_p = sub(u, p);
        const dot_ = dot(normal_, u_to_p);

        console.assert(dot_ !== 0);
        if (dot_ > 0) {
          positive_halfplane++;
        } else {
          negative_halfplane++;
        }
      }

      if (positive_halfplane === 0 || negative_halfplane === 0) {
        this.edges.push({ from: points[this.j], to: points[this.i] });
      }

      this.state = "nextSegment";
    } else if (this.state === "nextSegment") {
      this.j++;

      if (this.j >= points.length) {
        this.i++;
        this.j = this.i + 1;
      }

      if (this.i >= points.length - 1) {
        this.state = "done";
      } else {
        this.state = "checkSegment";
      }
    }
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const point of points) {
      drawPoint(point);
    }

    for (const edge of this.edges) {
      drawSegment(edge.from, edge.to, "red");
    }

    if (this.state === "nextSegment") {
      drawLine(points[this.i], points[this.j], "steelblue");
    } else if (this.state === "done") {
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      ctx.fillText("Done", 10, 20);
    }
  }

  reset() {
    this.state = "checkSegment";
    this.edges = [];
    this.i = 0;
    this.j = this.i + 1;
  }
}

class DCStackFrame {
  constructor(points) {
    // 5 states: divide, convex-hull-left, convex-hull-right, merge, done
    this.state = "divide";

    this.points = [...points];
    this.points.sort((a, b) => a.x <= b.x);

    this.half = Math.trunc(this.points.length / 2);

    this.leftHull = [];
    this.rightHull = [];
    this.hull = [];
  }
}

class DivideAndConquer {
  constructor() {
    this.stackIndex = 0;
    this.stack = [];
    this.stack.push(new DCStackFrame(points));
  }

  getNextIndexCw(i, size) {
    return (i + 1) % size;
  }

  getNextIndexCcw(i, size) {
    return (((i - 1) % size) + size) % size;
  }

  getIntersectY(middleX, p, q) {
    const m = (p.y - q.y) / (p.x - q.x);
    const b = p.y - m * p.x; // b = y - mx
    return m * middleX + b; // y = mx + b
  }

  merge() {
    const frame = this.stack[this.stackIndex];

    console.assert(frame.leftHull.length > 0);
    console.assert(frame.rightHull.length > 0);

    // find rightmost point of a and leftmost point of b
    const leftmostIndex = 0;
    const rightmostIndex = 0;
    {
      for (let i = 1; i < frame.rightHull.length; i++) {
        if (frame.rightHull[i].x < frame.rightHull[leftmostIndex].x) {
          leftmostIndex = i;
        }
      }

      for (let i = 1; i < frame.leftHull.length; i++) {
        if (frame.rightHull[i].x > frame.rightHull[rightmostIndex].x) {
          rightmostIndex = i;
        }
      }
    }

    const middleLine =
      (frame.leftHull[rightmostIndex].x + frame.rightHull[leftmostIndex].x) / 2; // middle vertical line (the x value) separating the two hulls

    // find upper tangent
    const upperTanLeftIndex = 0;
    const upperTanRightIndex = 0;
    {
      let i = rightmostIndex;
      let j = leftmostIndex;

      while (true) {
        let nextI = this.getNextIndexCcw(i, frame.leftHull.length);
        let nextJ = this.getNextIndexCw(j, frame.rightHull.length);

        if (
          this.getIntersectY(
            middleLine,
            frame.leftHull[nextI],
            frame.rightHull[j]
          ) >
          this.getIntersectY(middleLine, frame.leftHull[i], frame.rightHull[j])
        ) {
          i = nextI;
        } else if (
          this.getIntersectY(
            middle_line,
            frame.leftHull[i],
            frame.rightHull[next_j]
          ) >
          this.getIntersectY(middle_line, frame.leftHull[i], frame.rightHull[j])
        ) {
          j = nextJ;
        } else {
          break;
        }
      }

      upperTanLeftIndex = i;
      upperTanRightIndex = j;
    }

    // find lower tangent
    const lowerTanLeftIndex = 0;
    const lowerTanRightIndex = 0;
    {
      let i = rightmostIndex;
      let j = leftmostIndex;

      while (true) {
        let nextI = this.getNextIndexCw(i, frame.leftHull.length);
        let nextJ = this.getNextIndexCcw(j, frame.rightHull.length);

        if (
          this.getIntersectY(
            middleLine,
            frame.leftHull[nextI],
            frame.rightHull[j]
          ) >
          this.getIntersectY(middleLine, frame.leftHull[i], frame.rightHull[j])
        ) {
          i = nextI;
        } else if (
          this.getIntersectY(
            middle_line,
            frame.leftHull[i],
            frame.rightHull[next_j]
          ) >
          this.getIntersectY(middle_line, frame.leftHull[i], frame.rightHull[j])
        ) {
          j = nextJ;
        } else {
          break;
        }
      }

      lowerTanLeftIndex = i;
      lowerTanRightIndex = j;
    }

    // clockwise merge the two hulls using the found tangents
    for (
      let i = lowerTanLeftIndex;
      i != upperTanLeftIndex;
      i = this.getNextIndexCw(i, frame.leftHull.length)
    ) {
      frame.hull.push(frame.leftHull[i]);
    }

    frame.hull.push(frame.leftHull[upperTanLeftIndex]);

    for (
      let j = upperTanRightIndex;
      j != lowerTanLeftIndex;
      j = this.getNextIndexCw(j, frame.rightHull.length)
    ) {
      frame.hull.push(frame.rightHull[j]);
    }

    frame.hull.push(frame.rightHull[lowerTanRightIndex]);
  }

  step() {
    const frame = this.stack[this.stackIndex];
    switch (frame.state) {
      case "divide": {
        if (frame.points.length <= 1) {
          frame.state = "done";
          return;
        }

        // frame.half = Math.trunc(frame.points.length / 2);
        frame.state = "convex-hull-left";
        const slice = frame.points.slice(0, frame.half);
        this.stack.push(new DCStackFrame(slice));
        this.stackIndex++;
        break;
      }
      case "convex-hull-left": {
        const nextFrame = this.stack[this.stackIndex + 1];
        frame.leftHull = [...nextFrame.hull];
        this.stack.pop();
        frame.state = "convex-hull-right";
        const slice = frame.points.slice(frame.half, frame.points.length);
        this.stack.push(new DCStackFrame(slice));
        this.stackIndex++;
        break;
      }
      case "convex-hull-right": {
        const nextFrame = this.stack[this.stackIndex + 1];
        frame.rightHull = [...nextFrame.hull];
        this.stack.pop();
        frame.state = "merge";
        this.merge();
        break;
      }
      case "merge": {
        frame.state = "done";
        break;
      }
      case "done": {
        this.stackIndex--;
        break;
      }
      default:
        console.assert(false); // Unreachable
    }
  }

  draw() {
    const frame = this.stack[this.stackIndex];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const point of frame.points) {
      drawPoint(point);
    }

    switch (frame.state) {
      case "divide": {
        if (frame.points.length <= 1) {
          return;
        }

        // Divide the canvas using a vertical line.
        const x =
          (frame.points[frame.half - 1].x + frame.points[frame.half].x) / 2;

        drawLine({ x: x, y: 0 }, { x: x, y: canvas.height }, "steelblue");
        break;
      }
      case "convex-hull-left": {
        break;
      }
      case "convex-hull-right": {
        break;
      }
      case "merge": {
        break;
      }
      case "done": {
        break;
      }
      default:
        console.assert(false); // Unreachable
    }
  }

  reset() {
    this.stack = [];
    this.stack.push(new DCStackFrame(points));
  }
}

// algoCtx must have the following methods
// step() // execute one step of the algorithm
// draw() // draws the current state of the algorithm
let algoCtx = new Naive();

function drawPoint(point) {
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
  ctx.fill();
}

function drawPoints() {
  for (const point of points) {
    drawPoint(point);
  }
}

function drawSegment(p, q, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(q.x, q.y);
  ctx.stroke();
}

function drawLine(p, q, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const dx = q.x - p.x;
  const dy = q.y - p.y;

  if (dx === 0) {
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, canvas.height);
    ctx.stroke();
    return;
  }

  const m = dy / dx;
  const b = p.y - m * p.x;

  // Compute intersection with canvas edges
  const edgePoints = [];

  // Left edge (x = 0)
  let y = m * 0 + b;
  if (y >= 0 && y <= canvas.height) edgePoints.push({ x: 0, y });

  // Right edge (x = canvas.width)
  y = m * canvas.width + b;
  if (y >= 0 && y <= canvas.height) edgePoints.push({ x: canvas.width, y });

  // Top edge (y = 0)
  let x = (0 - b) / m;
  if (x >= 0 && x <= canvas.width) edgePoints.push({ x, y: 0 });

  // Bottom edge (y = canvas.height)
  x = (canvas.height - b) / m;
  if (x >= 0 && x <= canvas.width) edgePoints.push({ x, y: canvas.height });

  if (edgePoints.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(edgePoints[0].x, edgePoints[0].y);
    ctx.lineTo(edgePoints[1].x, edgePoints[1].y);
    ctx.stroke();
  }
}

// Utility: Clear canvas and redraw points (and partial hull if available)
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPoints();
  // if (hull.length > 0) {
  //   // Draw already stepped hull edges
  //   ctx.strokeStyle = "red";
  //   ctx.lineWidth = 2;
  //   ctx.beginPath();
  //   if (currentStep > 0) {
  //     ctx.moveTo(hull[0].x, hull[0].y);
  //     // Only draw edges up to the current step
  //     for (let i = 1; i < currentStep; i++) {
  //       ctx.lineTo(hull[i].x, hull[i].y);
  //     }
  //     ctx.stroke();
  //   }
  // }
}

// Event: Canvas mouse click to add a point
canvas.addEventListener("click", function (e) {
  // Get bounding rectangle for correct mouse position within the canvas.
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  points.push({ x, y });
  algoCtx.reset();
  redraw();
});

// Handle algorithm selection change
algoSelect.addEventListener("change", function () {
  algorithm = this.value;

  switch (this.value) {
    case "naive": {
      algoCtx = new Naive();
      break;
    }
    case "divide-and-conquer": {
      algoCtx = new DivideAndConquer();
      break;
    }
    default: {
      console.assert(false); // Unreachable
    }
  }

  redraw();
});

// Simulation "step" button: reveal one more edge of the convex hull
stepBtn.addEventListener("click", function () {
  if (points.length < 3) {
    alert("At least 3 points are needed to compute a convex hull.");
    return;
  }

  algoCtx.step();
  algoCtx.draw();
});

// "Continue" button: complete the hull drawing immediately.
continueBtn.addEventListener("click", function () {
  if (points.length < 3) {
    alert("At least 3 points are needed to compute a convex hull.");
    return;
  }

  while (algoCtx.state !== "done") {
    algoCtx.step();
  }

  algoCtx.draw();
});

// "Reset" button: clear canvas and simulation state.
resetBtn.addEventListener("click", function () {
  points = [];
  algoCtx.reset();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Select Naive as the default algorithm.
window.addEventListener("load", function () {
  document.getElementById("algoSelect").value = "naive";
});
