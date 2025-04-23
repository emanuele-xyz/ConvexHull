"use strict";

// TODO: divide and conquer upper tangent needs at least 6 points
// TODO: draw segments and then draw points on top

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

function determinant(u, v) {
  return u.x * v.y - u.y * v.x;
}

//
// Convex hull utility functions
//
function isHullClockwise(hull) {
  if (hull.length < 3) {
    console.assert(false);
  }
  const a = hull[0];
  const b = hull[1];
  const c = hull[2];
  const aToB = sub(b, a);
  const bToC = sub(c, b);
  return determinant(aToB, bToC) <= 0;
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
}

class DivideAndConquerUpperTangent {
  constructor(points) {
    // 7 states: start, divide, hulls, rightmost-and-leftmost, advance, intersect, done
    this.state = "start";
    this.points = [...points];
    this.half = -1;
    this.middleX = 0;
    this.leftHull = [];
    this.rightHull = [];
    this.leftIdx = -1;
    this.rightIdx = -1;
    this.leftNextIdx = -1;
    this.rightNextIdx = -1;
    this.intersectY = 0;
    this.nextLeftIntersectY = 0;
    this.nextRightIntersectY = 0;
    this.advanceChoice = "";
  }

  getIntersectY(middleX, p, q) {
    const m = (p.y - q.y) / (p.x - q.x);
    const b = p.y - m * p.x;
    return m * middleX + b;
  }

  step() {
    switch (this.state) {
      case "start": {
        this.points.sort((a, b) => a.x - b.x);
        this.half = Math.trunc(this.points.length / 2);
        this.middleX = (this.points[this.half - 1].x + this.points[this.half].x) / 2;
        this.state = "divide";
        break;
      }
      case "divide": {
        // build left hull
        {
          const naive = new Naive(this.points.slice(0, this.half));
          naive.continue();
          this.leftHull = naive.hull;
          if (!isHullClockwise(this.leftHull)) {
            this.leftHull.reverse();
          }
        }
        // build right hull
        {
          const naive = new Naive(this.points.slice(this.half, this.points.length));
          naive.continue();
          this.rightHull = naive.hull;
          if (!isHullClockwise(this.rightHull)) {
            this.rightHull.reverse();
          }
        }
        this.state = "hulls";
        break;
      }
      case "hulls": {
        // find left hull rightmost point index
        this.leftIdx = 0;
        for (let i = 1; i < this.leftHull.length; i++) {
          if (this.leftHull[i].x > this.leftHull[this.leftIdx].x) {
            this.leftIdx = i;
          }
        }
        // find right hull leftmost point index
        this.rightIdx = 0;
        for (let i = 1; i < this.rightHull.length; i++) {
          if (this.rightHull[i].x < this.rightHull[this.rightIdx].x) {
            this.rightIdx = i;
          }
        }
        this.state = "rightmost-and-leftmost"
        break;
      }
      case "rightmost-and-leftmost":
      case "advance": {
        this.leftNextIdx = (this.leftIdx + 1) % this.leftHull.length;
        this.rightNextIdx = (((this.rightIdx - 1) % this.rightHull.length) + this.rightHull.length) % this.rightHull.length;
        this.intersectY = this.getIntersectY(this.middleX, this.leftHull[this.leftIdx], this.rightHull[this.rightIdx]);
        this.nextLeftIntersectY = this.getIntersectY(this.middleX, this.leftHull[this.leftNextIdx], this.rightHull[this.rightIdx]);
        this.nextRightIntersectY = this.getIntersectY(this.middleX, this.leftHull[this.leftIdx], this.rightHull[this.rightNextIdx]);
        this.state = "intersect";
        break;
      }
      case "intersect": {
        if (this.nextLeftIntersectY < this.intersectY) {
          this.leftIdx = this.leftNextIdx;
          this.leftNextIdx = (this.leftIdx + 1) % this.leftHull.length;
          this.advanceChoice = "left";
          this.state = "advance";
        } else if (this.nextRightIntersectY < this.intersectY) {
          this.rightIdx = this.rightNextIdx;
          this.rightNextIdx = (((this.rightIdx - 1) % this.rightHull.length) + this.rightHull.length) % this.rightHull.length;
          this.advanceChoice = "right";
          this.state = "advance";
        } else {
          this.state = "done";
        }
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

    switch (this.state) {
      case "divide": {
        drawPoints(this.points);
        drawLine({ x: this.middleX, y: 0 }, { x: this.middleX, y: canvas.height }, "steelblue");
        break;
      }
      case "hulls": {
        drawPoints(this.points);
        drawLine({ x: this.middleX, y: 0 }, { x: this.middleX, y: canvas.height }, "steelblue");
        drawPolygon(this.leftHull, "red");
        drawPolygon(this.rightHull, "red");
        break;
      }
      case "rightmost-and-leftmost": {
        drawPoints(this.points);
        drawLine({ x: this.middleX, y: 0 }, { x: this.middleX, y: canvas.height }, "steelblue");
        drawPolygon(this.leftHull, "red");
        drawPolygon(this.rightHull, "red");
        drawPoint(this.leftHull[this.leftIdx], "lightgreen");
        drawPoint(this.rightHull[this.rightIdx], "lightgreen");
      } break;
      case "intersect": {
        drawPoints(this.points);
        drawLine({ x: this.middleX, y: 0 }, { x: this.middleX, y: canvas.height }, "steelblue");
        drawPolygon(this.leftHull, "red");
        drawPolygon(this.rightHull, "red");
        drawSegment(this.leftHull[this.leftIdx], this.rightHull[this.rightIdx], "lightgreen");
        drawSegment(this.leftHull[this.leftNextIdx], this.rightHull[this.rightIdx], "purple");
        drawSegment(this.leftHull[this.leftIdx], this.rightHull[this.rightNextIdx], "purple");
        drawPoint(this.leftHull[this.leftIdx], "lightgreen");
        drawPoint(this.rightHull[this.rightIdx], "lightgreen");
        drawPoint(this.leftHull[this.leftNextIdx], "green");
        drawPoint(this.rightHull[this.rightNextIdx], "green");
        drawPoint({ x: this.middleX, y: this.intersectY }, "red");
        drawPoint({ x: this.middleX, y: this.nextLeftIntersectY }, "yellow");
        drawPoint({ x: this.middleX, y: this.nextRightIntersectY }, "blue");
        break;
      }
      case "advance": {
        drawPoints(this.points);
        drawLine({ x: this.middleX, y: 0 }, { x: this.middleX, y: canvas.height }, "steelblue");
        drawPolygon(this.leftHull, "red");
        drawPolygon(this.rightHull, "red");
        drawPoint(this.leftHull[this.leftIdx], "lightgreen");
        drawPoint(this.rightHull[this.rightIdx], "lightgreen");
        drawPoint(this.leftHull[this.leftNextIdx], "green");
        drawPoint(this.rightHull[this.rightNextIdx], "green");
        break;
      }
      case "done": {
        drawPoints(this.points);
        drawPolygon(this.leftHull, "red");
        drawPolygon(this.rightHull, "red");
        drawSegment(this.leftHull[this.leftIdx], this.rightHull[this.rightIdx], "lightgreen");
        drawPoint(this.leftHull[this.leftIdx], "lightgreen");
        drawPoint(this.rightHull[this.rightIdx], "lightgreen");
        break;
      }
      default: {
        console.assert(false); // Unreachable
        break;
      }
    }

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    if (this.state === "advance") {
      ctx.fillText(this.state + " (" + this.advanceChoice + ")", 10, 20);
    } else {
      ctx.fillText(this.state, 10, 20);
    }
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
}

class AklToussaintConvexPath {
  constructor(points) {
    // 6 states: start, kill-zone, kill-zone-edge, region, convex-path, done
    this.state = "start";
    this.points = points;
    this.killZone = [];
    this.from = {};
    this.to = {};
    this.region = [];
    this.regionStart = [];
    this.wasThereAnyDeletion = false;
    this.k = 0;
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

  buildRegion() {
    this.region.push(this.from);
    this.region.push(this.to);
    for (const p of this.points) {
      if (this.fallsWithinRegion(p, this.from, this.to)) {
        this.region.push(p);
      }
    }

    const from_to = sub(this.to, this.from);
    if (from_to.x > 0) {
      // we either are in region 1 or 2
      this.region.sort((a, b) => a.x - b.x);
    }
    else if (from_to.x < 0) {
      // we either are in region 3 or 4
      this.region.sort((a, b) => b.x - a.x);
    }

    this.regionStart = [...this.region];
  }

  fallsWithinRegion(p, from, to) {
    const from_to = sub(to, from);
    const n = normal(from_to);
    const from_p = sub(p, from);
    return dot(n, from_p) > 0;
  }

  step() {
    switch (this.state) {
      case "start": {
        this.buildKillZone();
        this.state = "kill-zone";
        break;
      }
      case "kill-zone": {
        this.from = this.killZone[0];
        this.to = this.killZone[1];
        this.state = "kill-zone-edge";
        break;
      }
      case "kill-zone-edge": {
        this.buildRegion();
        this.state = "region";
        break;
      }
      case "region": {
        this.state = "convex-path";
        break;
      }
      case "convex-path": {
        if (0 <= this.k && this.k < this.region.length - 2) {
          const p = this.region[this.k];
          const pn = this.region[this.k + 1];
          const pnn = this.region[this.k + 2];
          const s = determinant(sub(pnn, pn), sub(pn, p));
          if (s >= 0) {
            this.k++;
          } else {
            this.region.splice(this.k + 1, 1);
            this.wasThereAnyDeletion = true;
            this.k--;
          }
        } else {
          if (!this.wasThereAnyDeletion) {
            this.state = "done";
          } else {
            this.wasThereAnyDeletion = false;
            this.k = 0;
            this.state = "convex-path";
          }
        }
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

    switch (this.state) {
      case "kill-zone": {
        drawPoints(this.points);
        drawPolygon(this.killZone, "steelblue");
        break;
      }
      case "kill-zone-edge": {
        drawPoints(this.points);
        drawLine(this.from, this.to, "steelblue");
        break;
      }
      case "region": {
        drawPoints(this.region);
        drawLine(this.from, this.to, "steelblue");
        break;
      }
      case "convex-path": {
        drawPoints(this.region);
        drawSegment(this.from, this.to, "steelblue");
        drawPolyLine(this.region, "red");
        if (0 <= (this.k + 2) && (this.k + 2) <= this.region.length - 1) {
          drawPoint(this.region[this.k + 2], "green");
        }
        if (0 <= (this.k + 1) && (this.k + 1) <= this.region.length - 1) {
          drawPoint(this.region[this.k + 1], "green");
        }
        if (0 <= this.k && this.k <= this.region.length - 1) {
          drawPoint(this.region[this.k], "lightgreen");
        }
        break;
      }
      case "done": {
        drawPoints(this.regionStart);
        drawSegment(this.from, this.to, "steelblue");
        drawPolyLine(this.region, "red");
        break;
      }
      default: {
        console.assert(false); // Unreachable
        break;
      }
    }

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    if (this.state === "convex-path") {
      ctx.fillText(this.state + ": (" + this.k + ")", 10, 20);
    } else {
      ctx.fillText(this.state, 10, 20);
    }
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

function drawPoint(point, color = "black") {
  ctx.fillStyle = color;
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

function drawPolyLine(points, color) {
  for (let i = 0; i < points.length - 1; i++) {
    const from_idx = i;
    const to_idx = (i + 1);
    drawSegment(points[from_idx], points[to_idx], color);
  }
}

function drawPolygon(points, color) {
  drawPolyLine(points, color);
  drawSegment(points[points.length - 1], points[0], color);
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
  algoCtx = new algoCtx.constructor(globalPoints);
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
    case "divide-and-conquer-upper-tangent": {
      algoCtx = new DivideAndConquerUpperTangent(globalPoints);
      break;
    }
    case "akl-toussaint": {
      algoCtx = new AklToussaint(globalPoints);
      break;
    }
    case "akl-toussaint-convex-path": {
      algoCtx = new AklToussaintConvexPath(globalPoints);
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
  // TODO: the required number of points depends on the sort of operation we are doing
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
  algoCtx = new algoCtx.constructor(globalPoints);
  clearCanvas();
});

// Select "Naive" as the default algorithm.
window.addEventListener("load", function () {
  document.getElementById("algoSelect").value = "naive";
});
