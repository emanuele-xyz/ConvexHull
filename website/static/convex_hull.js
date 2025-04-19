"use strict";

//
// Global variables
//
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const algoSelect = document.getElementById("algoSelect");
const stepBtn = document.getElementById("stepBtn");
const continueBtn = document.getElementById("continueBtn");
const resetBtn = document.getElementById("resetBtn");

let globalPoints = []; // Holds the points added by the user

//
// Linear algebra utility functions
//
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
  return { x: -v.y, y: v.x };
}

//
// Convex hull algorithms
//
class Naive {
  constructor(points) {
    // 3 states: checkSegment, nextSegment, hull, done
    this.state = "checkSegment";
    this.points = points;
    this.edges = [];
    this.hull = [];
    this.i = 0;
    this.j = this.i + 1;
  }

  step() {
    switch (this.state) {
      case "checkSegment": {
        const u = v2(this.points[this.i].x, this.points[this.i].y);
        const v = v2(this.points[this.j].x, this.points[this.j].y);
        const u_to_v = sub(v, u);
        const normal_ = normal(u_to_v);

        let positiveHalfplane = 0;
        let negativeHalfplane = 0;

        for (let k = 0; k < this.points.length; k++) {
          if (k === this.i || k === this.j) {
            continue;
          }

          const p = this.points[k];
          const u_to_p = sub(u, p);
          const dot_ = dot(normal_, u_to_p);

          console.assert(dot_ !== 0);
          if (dot_ > 0) {
            positiveHalfplane++;
          } else {
            negativeHalfplane++;
          }
        }

        if (positiveHalfplane === 0 || negativeHalfplane === 0) {
          this.edges.push({
            from: this.points[this.j],
            to: this.points[this.i],
          });

          this.edges.push({
            from: this.points[this.i],
            to: this.points[this.j],
          });
        }

        this.state = "nextSegment";

        break;
      }
      case "nextSegment": {
        this.j++;

        if (this.j >= this.points.length) {
          this.i++;
          this.j = this.i + 1;
        }

        if (this.i >= this.points.length - 1) {
          this.state = "hull";
        } else {
          this.state = "checkSegment";
        }

        break;
      }
      case "hull": {
        const start = this.edges[0].from;
        let prev = this.edges[0].from;
        let cur = this.edges[0].to;
        this.hull.push(start);

        do {
          this.hull.push(cur);
          let to = null;

          for (let i = 0; i < this.edges.length; i++) {
            if (
              this.edges[i].to.x === prev.x &&
              this.edges[i].to.y === prev.y
            ) {
              continue;
            }

            if (
              cur.x === this.edges[i].from.x &&
              cur.y === this.edges[i].from.y
            ) {
              to = this.edges[i].to;
            }
          }

          prev = cur;
          cur = to;
        } while (cur !== null && !(cur.x === start.x && cur.y === start.y));

        console.log(this.hull); // TODO: to be removed?
        console.log(this.edges); // TODO: to be removed?

        this.state = "done";
        break;
      }
      case "done": {
        // Do nothing
        break;
      }
      default: {
        console.assert(false); // Unreachable
        break;
      }
    }
  }

  continue() {
    while (this.state !== "done") {
      this.step();
    }
  }

  draw() {
    clearCanvas();
    drawPoints(this.points);

    for (const edge of this.edges) {
      drawSegment(edge.from, edge.to, "red");
    }

    if (this.state === "nextSegment") {
      drawLine(this.points[this.i], this.points[this.j], "steelblue");
    } else if (this.state === "done") {
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      ctx.fillText("Done", 10, 20);
    }
  }

  reset(points) {
    this.state = "checkSegment";
    this.points = points;
    this.edges = [];
    this.hull = [];
    this.i = 0;
    this.j = this.i + 1;
  }
}

class DCStackFrame {
  constructor(points, state = "start") {
    // 6 states: start, divide, convex-hull-left, convex-hull-right, merge, done
    if (points.length > 1) {
      this.state = state;
      this.hull = [];
    } else {
      this.state = "done";
      this.hull = [...points];
    }

    this.points = [...points];
    this.points.sort((a, b) => a.x - b.x);

    this.half = Math.trunc(this.points.length / 2);

    this.leftHull = [];
    this.rightHull = [];
  }
}

class DivideAndConquer {
  constructor(points) {
    this.points = points;
    this.stackIndex = 0;
    this.stack = [];
    this.stack.push(new DCStackFrame(this.points));
  }

  getCurrentFrame() {
    return this.stack[this.stackIndex];
  }

  getNextFrame() {
    return this.stack[this.stackIndex + 1];
  }

  merge() {
    const frame = this.getCurrentFrame();

    console.assert(frame.leftHull.length > 0);
    console.assert(frame.rightHull.length > 0);

    const naivePoints = [...frame.leftHull, ...frame.rightHull];
    if (naivePoints.length <= 3) {
      frame.hull = naivePoints;
    } else {
      const naive = new Naive(naivePoints);
      naive.continue();
      frame.hull = naive.hull;
    }
  }

  step() {
    const frame = this.getCurrentFrame();
    switch (frame.state) {
      case "start": {
        frame.state = "divide";
        break;
      }
      case "divide": {
        if (frame.points.length <= 1) {
          frame.state = "done";
          frame.hull = [...frame.points];
        } else {
          frame.state = "convex-hull-left";
          const slice = frame.points.slice(0, frame.half);
          this.stack.push(new DCStackFrame(slice, "divide"));
          this.stackIndex++;
        }
        break;
      }
      case "convex-hull-left": {
        const nextFrame = this.getNextFrame();
        frame.leftHull = [...nextFrame.hull];
        this.stack.pop();
        frame.state = "convex-hull-right";
        const slice = frame.points.slice(frame.half, frame.points.length);
        this.stack.push(new DCStackFrame(slice, "divide"));
        this.stackIndex++;
        break;
      }
      case "convex-hull-right": {
        const nextFrame = this.getNextFrame();
        frame.rightHull = [...nextFrame.hull];
        this.stack.pop();
        frame.state = "merge";
        break;
      }
      case "merge": {
        this.merge();
        frame.state = "done";
        break;
      }
      case "done": {
        this.stackIndex = Math.max(0, this.stackIndex - 1);
        break;
      }
      default:
        console.assert(false); // Unreachable
        break;
    }
  }

  continue() {
    while (this.stack[0].state !== "done") {
      this.step();
    }
  }

  draw() {
    const frame = this.getCurrentFrame();
    clearCanvas();
    drawPoints(frame.points);

    if (frame.state !== "done" && frame.points.length > 1) {
      // Divide the canvas using a vertical line.
      const x =
        (frame.points[frame.half - 1].x + frame.points[frame.half].x) / 2;
      drawLine({ x: x, y: 0 }, { x: x, y: canvas.height }, "steelblue");
    }

    if (frame.hull.length > 0) {
      // Hull has been computed. Draw it
      drawPolygon(frame.hull, "red");
    } else {
      // Hull has yet to be computed. Draw left and right hulls
      if (frame.leftHull.length > 0) {
        drawPolygon(frame.leftHull, "red");
      }
      if (frame.rightHull.length > 0) {
        drawPolygon(frame.rightHull, "red");
      }
    }

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(frame.state, 10, 20);
  }

  reset(points) {
    this.points = points;
    this.stackIndex = 0;
    this.stack = [];
    this.stack.push(new DCStackFrame(this.points));
  }
}

class AklToussaint {
  constructor(points) {
    // 5 states: start, kill-zone, survivors, convex-path, done
    this.state = "start";
    this.points = points;
    this.killZone = [];
    this.survivors = [];
    this.hull = [];
  }

  buildKillZone() {
    let xmin = this.points[0];
    let xmax = this.points[0];
    for (const p of this.points) {
      if (p.x < xmin.x) xmin = p;
      if (p.x > xmax.x) xmax = p;
    }

    let ymin = this.points[0];
    let ymax = this.points[0];
    for (const p of this.points) {
      if (p.y < ymin.y) ymin = p;
      if (p.y > ymax.y) ymax = p;
    }

    const quadrilateral = [xmin, ymax, xmax, ymin];

    for (const p of quadrilateral) {
      if (!this.killZone.some((kp) => kp.x === p.x && kp.y === p.y)) {
        this.killZone.push(p);
      }
    }
  }

  applyHeuristic() {
    for (const p of this.points) {
      if (!this.fallsWithinKillZone(p, this.killZone)) {
        this.survivors.push(p);
      }
    }
  }

  fallsWithinKillZone(p) {
    let fallsWithin = true;

    for (let i = 0; i < this.killZone.length && fallsWithin; i++) {
      const from = this.killZone[i];
      const to = this.killZone[(i + 1) % this.killZone.length];

      const from_to = sub(to, from);
      const n = normal(from_to);
      const from_p = sub(p, from);
      fallsWithin = dot(n, from_p) < 0;
    }

    return fallsWithin;
  }

  fallWithinRegion(p, from, to) {
    const from_to = sub(to, from);
    const normal = normal(from_to);
    const from_p = sub(p, from);
    return dot(normal, from_p) > 0;
  }

  step() {
    switch (this.state) {
      case "start": {
        this.buildKillZone();
        this.state = "kill-zone";
        break;
      }
      case "kill-zone": {
        this.applyHeuristic();
        this.state = "survivors";
        break;
      }
      case "survivors": {
        const naive = new Naive(this.survivors);
        naive.continue();
        this.hull = naive.hull;
        this.state = "convex-path";
        break;
      }
      case "convex-path": {
        this.state = "done";
        break;
      }
      case "done": {
        break;
      }
      default: {
        console.assert(false); // Unreachable
        break;
      }
    }
  }

  continue() {
    while (this.state !== "done") {
      this.step();
    }
  }

  draw() {
    clearCanvas();

    if (this.state === "kill-zone") {
      drawPoints(this.points);
      drawPolygon(this.killZone, "steelblue");
    } else if (this.state === "survivors") {
      drawPoints(this.survivors);
      drawPolygon(this.killZone, "steelblue");
    } else if (this.state === "convex-path") {
      drawPoints(this.survivors);
      drawPolygon(this.killZone, "steelblue");
      drawPolygon(this.hull, "red");
    } else if (this.state === "done") {
      drawPoints(this.points);
      drawPolygon(this.hull, "red");
    }

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(this.state, 10, 20);
  }

  reset(points) {
    // 5 states: start, kill-zone, survivors, convex-path, done
    this.state = "start";
    this.points = points;
    this.killZone = [];
    this.survivors = [];
    this.hull = [];
  }
}

// algoCtx must have the following methods
// step() // execute one step of the algorithm
// draw() // draws the current state of the algorithm
let algoCtx = new Naive(globalPoints);

//
// Drawing functions
//
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPoint(point) {
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
  ctx.fill();
}

function drawPoints(points) {
  for (const point of points) {
    let coords = `(${Math.trunc(point.x)},${Math.trunc(point.y)})`;
    ctx.fillStyle = "black";
    ctx.font = "11px Arial";
    ctx.fillText(coords, point.x - 20, point.y - 10);
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

function drawPolygon(points, color) {
  for (let i = 0; i < points.length; i++) {
    const from_idx = i;
    const to_idx = (i + 1) % points.length;
    drawSegment(points[from_idx], points[to_idx], color);
  }
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
  clearCanvas();
  drawPoints(globalPoints);
}

//
// Event listeners
//

// Event: Canvas mouse click to add a point
canvas.addEventListener("click", function (e) {
  // Get bounding rectangle for correct mouse position within the canvas.
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  globalPoints.push({ x, y });
  algoCtx.reset(globalPoints);
  redraw();
});

// Handle algorithm selection change
algoSelect.addEventListener("change", function () {
  switch (this.value) {
    case "naive": {
      algoCtx = new Naive(globalPoints);
      break;
    }
    case "divide-and-conquer": {
      algoCtx = new DivideAndConquer(globalPoints);
      break;
    }
    case "akl-toussaint": {
      algoCtx = new AklToussaint(globalPoints);
      break;
    }
    default: {
      console.assert(false); // Unreachable
    }
  }

  redraw();
});

// "Step" button: execute a single step of the algorithm.
stepBtn.addEventListener("click", function () {
  if (globalPoints.length < 3) {
    alert("At least 3 points are needed to compute a convex hull.");
    return;
  }

  algoCtx.step();
  algoCtx.draw();
});

// "Continue" button: draw the complete hull.
continueBtn.addEventListener("click", function () {
  if (globalPoints.length < 3) {
    alert("At least 3 points are needed to compute a convex hull.");
    return;
  }

  algoCtx.continue();
  algoCtx.draw();
});

// "Reset" button: clear canvas and reset algorithm state.
resetBtn.addEventListener("click", function () {
  globalPoints = [];
  algoCtx.reset(globalPoints);
  clearCanvas();
});

// Select "Naive" as the default algorithm.
window.addEventListener("load", function () {
  document.getElementById("algoSelect").value = "naive";
});
