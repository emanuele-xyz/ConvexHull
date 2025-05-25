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
const undoBtn = document.getElementById("undoBtn");
const kSliderContainer = document.getElementById("kSliderContainer");
const kSlider = document.getElementById("kSlider");
const kValueLabel = document.getElementById("kValueLabel");
const pointsTooClose = document.getElementById("pointsTooClose");

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
    // 3 states: check-segment, next-segment, hull, done
    this.minRequiredPoints = 3;
    this.state = "check-segment";
    this.points = points;
    this.edges = [];
    this.hull = [];
    this.i = 0;
    this.j = this.i + 1;
  }

  step() {
    switch (this.state) {
      case "check-segment": {
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

        this.state = "next-segment";

        break;
      }
      case "next-segment": {
        this.j++;

        if (this.j >= this.points.length) {
          this.i++;
          this.j = this.i + 1;
        }

        if (this.i >= this.points.length - 1) {
          this.state = "hull";
        } else {
          this.state = "check-segment";
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

    for (const edge of this.edges) {
      drawSegment(edge.from, edge.to, "red");
    }

    if (this.state === "next-segment") {
      drawLine(this.points[this.i], this.points[this.j], "steelblue");
    }

    drawPoints(this.points);

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(this.state, 10, 20);
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
    this.minRequiredPoints = 3;
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

    drawPoints(frame.points);

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(frame.state, 10, 20);
  }
}

class DivideAndConquerUpperTangent {
  constructor(points) {
    // 7 states: start, divide, hulls, rightmost-and-leftmost, advance, intersect, done
    this.minRequiredPoints = 6;
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
        this.middleX =
          (this.points[this.half - 1].x + this.points[this.half].x) / 2;
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
          const naive = new Naive(
            this.points.slice(this.half, this.points.length)
          );
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
        this.state = "rightmost-and-leftmost";
        break;
      }
      case "rightmost-and-leftmost":
      case "advance": {
        this.leftNextIdx = (this.leftIdx + 1) % this.leftHull.length;
        this.rightNextIdx =
          (((this.rightIdx - 1) % this.rightHull.length) +
            this.rightHull.length) %
          this.rightHull.length;
        this.intersectY = this.getIntersectY(
          this.middleX,
          this.leftHull[this.leftIdx],
          this.rightHull[this.rightIdx]
        );
        this.nextLeftIntersectY = this.getIntersectY(
          this.middleX,
          this.leftHull[this.leftNextIdx],
          this.rightHull[this.rightIdx]
        );
        this.nextRightIntersectY = this.getIntersectY(
          this.middleX,
          this.leftHull[this.leftIdx],
          this.rightHull[this.rightNextIdx]
        );
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
          this.rightNextIdx =
            (((this.rightIdx - 1) % this.rightHull.length) +
              this.rightHull.length) %
            this.rightHull.length;
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
        drawLine(
          { x: this.middleX, y: 0 },
          { x: this.middleX, y: canvas.height },
          "steelblue"
        );
        drawPoints(this.points);
        break;
      }
      case "hulls": {
        drawLine(
          { x: this.middleX, y: 0 },
          { x: this.middleX, y: canvas.height },
          "steelblue"
        );
        drawPolygon(this.leftHull, "red");
        drawPolygon(this.rightHull, "red");
        drawPoints(this.points);
        break;
      }
      case "rightmost-and-leftmost":
        {
          drawLine(
            { x: this.middleX, y: 0 },
            { x: this.middleX, y: canvas.height },
            "steelblue"
          );
          drawPolygon(this.leftHull, "red");
          drawPolygon(this.rightHull, "red");
          drawPoints(this.points);
          drawPoint(this.leftHull[this.leftIdx], "lightgreen");
          drawPoint(this.rightHull[this.rightIdx], "lightgreen");
        }
        break;
      case "intersect": {
        drawLine(
          { x: this.middleX, y: 0 },
          { x: this.middleX, y: canvas.height },
          "steelblue"
        );
        drawPolygon(this.leftHull, "red");
        drawPolygon(this.rightHull, "red");
        drawPoints(this.points);
        drawSegment(
          this.leftHull[this.leftIdx],
          this.rightHull[this.rightIdx],
          "lightgreen"
        );
        drawSegment(
          this.leftHull[this.leftNextIdx],
          this.rightHull[this.rightIdx],
          "purple"
        );
        drawSegment(
          this.leftHull[this.leftIdx],
          this.rightHull[this.rightNextIdx],
          "purple"
        );
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
        drawLine(
          { x: this.middleX, y: 0 },
          { x: this.middleX, y: canvas.height },
          "steelblue"
        );
        drawPolygon(this.leftHull, "red");
        drawPolygon(this.rightHull, "red");
        drawPoints(this.points);
        drawPoint(this.leftHull[this.leftIdx], "lightgreen");
        drawPoint(this.rightHull[this.rightIdx], "lightgreen");
        drawPoint(this.leftHull[this.leftNextIdx], "green");
        drawPoint(this.rightHull[this.rightNextIdx], "green");
        break;
      }
      case "done": {
        drawPolygon(this.leftHull, "red");
        drawPolygon(this.rightHull, "red");
        drawPoints(this.points);
        drawSegment(
          this.leftHull[this.leftIdx],
          this.rightHull[this.rightIdx],
          "lightgreen"
        );
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
    this.minRequiredPoints = 3;
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

      const fromTo = sub(to, from);
      const n = normal(fromTo);
      const fromP = sub(p, from);
      fallsWithin = dot(n, fromP) < 0;
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
      drawPolygon(this.killZone, "steelblue");
      drawPoints(this.points);
    } else if (this.state === "survivors") {
      drawPolygon(this.killZone, "steelblue");
      drawPoints(this.survivors);
    } else if (this.state === "convex-path") {
      drawPolygon(this.killZone, "steelblue");
      drawPolygon(this.hull, "red");
      drawPoints(this.survivors);
    } else if (this.state === "done") {
      drawPolygon(this.hull, "red");
      drawPoints(this.points);
    }

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(this.state, 10, 20);
  }
}

class AklToussaintConvexPath {
  constructor(points) {
    // 6 states: start, kill-zone, kill-zone-edge, region, convex-path, done
    this.minRequiredPoints = 3;
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

    const fromTo = sub(this.to, this.from);
    if (fromTo.x > 0) {
      // we either are in region 1 or 2
      this.region.sort((a, b) => a.x - b.x);
    } else if (fromTo.x < 0) {
      // we either are in region 3 or 4
      this.region.sort((a, b) => b.x - a.x);
    }

    this.regionStart = [...this.region];
  }

  fallsWithinRegion(p, from, to) {
    const fromTo = sub(to, from);
    const n = normal(fromTo);
    const fromP = sub(p, from);
    return dot(n, fromP) > 0;
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
        drawPolygon(this.killZone, "steelblue");
        drawPoints(this.points);
        break;
      }
      case "kill-zone-edge": {
        drawLine(this.from, this.to, "steelblue");
        drawPoints(this.points);
        break;
      }
      case "region": {
        drawLine(this.from, this.to, "steelblue");
        drawPoints(this.region);
        break;
      }
      case "convex-path": {
        drawSegment(this.from, this.to, "steelblue");
        drawPolyLine(this.region, "red");
        drawPoints(this.region);
        if (0 <= this.k + 2 && this.k + 2 <= this.region.length - 1) {
          drawPoint(this.region[this.k + 2], "green");
        }
        if (0 <= this.k + 1 && this.k + 1 <= this.region.length - 1) {
          drawPoint(this.region[this.k + 1], "green");
        }
        if (0 <= this.k && this.k <= this.region.length - 1) {
          drawPoint(this.region[this.k], "lightgreen");
        }
        break;
      }
      case "done": {
        drawSegment(this.from, this.to, "steelblue");
        drawPolyLine(this.region, "red");
        drawPoints(this.regionStart);
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

class TORCH {
  constructor(points) {
    // 7 states: start, xmin-xmax, ymin-ymax, lateral-hulls, merge, inflate, done
    this.minRequiredPoints = 3;
    this.state = "start";
    this.points = [...points];
    this.west_idx = -1;
    this.east_idx = -1;
    this.north_idx = -1;
    this.south_idx = -1;
    this.north_west = [];
    this.north_east = [];
    this.south_west = [];
    this.south_east = [];
    this.hull = [];
  }

  step() {
    switch (this.state) {
      case "start": {
        this.points.sort((a, b) => a.x - b.x);
        this.west_idx = 0;
        this.east_idx = this.points.length - 1;
        this.state = "xmin-xmax";
        break;
      }
      case "xmin-xmax": {
        this.north_idx = 0;
        this.south_idx = 0;
        for (let i = 0; i < this.points.length; i++) {
          if (this.points[i].y < this.points[this.north_idx].y) {
            this.north_idx = i;
          }
          if (this.points[i].y > this.points[this.south_idx].y) {
            this.south_idx = i;
          }
        }
        this.state = "ymin-ymax";
        break;
      }
      case "ymin-ymax": {
        // find south west hull (from west to south)
        this.south_west = [];
        {
          let max_y = this.points[this.west_idx].y;
          this.south_west.push(this.points[this.west_idx]);
          for (let i = this.west_idx + 1; i <= this.south_idx; i++) {
            if (this.points[i].y >= max_y) {
              max_y = this.points[i].y;
              this.south_west.push(this.points[i]);
            }
          }
        }

        // find south east hull (from east to south)
        this.south_east = [];
        {
          let max_y = this.points[this.east_idx].y;
          this.south_east.push(this.points[this.east_idx]);
          for (let i = this.east_idx - 1; i >= this.south_idx; i--) {
            if (this.points[i].y >= max_y) {
              max_y = this.points[i].y;
              this.south_east.push(this.points[i]);
            }
          }
        }

        // find north west hull (from west to north)
        this.north_west = [];
        {
          let min_y = this.points[this.west_idx].y;
          this.north_west.push(this.points[this.west_idx]);
          for (let i = this.west_idx + 1; i <= this.north_idx; i++) {
            if (this.points[i].y <= min_y) {
              min_y = this.points[i].y;
              this.north_west.push(this.points[i]);
            }
          }
        }

        // find north east hull (from east to north)
        this.north_east = [];
        {
          let min_y = this.points[this.east_idx].y;
          this.north_east.push(this.points[this.east_idx]);
          for (let i = this.east_idx - 1; i >= this.north_idx; i--) {
            if (this.points[i].y <= min_y) {
              min_y = this.points[i].y;
              this.north_east.push(this.points[i]);
            }
          }
        }

        this.state = "lateral-hulls";
        break;
      }
      case "lateral-hulls": {
        this.state = "merge";
        break;
      }
      case "merge": {
        const naive = new Naive(this.points);
        naive.continue();
        this.hull = naive.hull;
        this.state = "inflate";
        break;
      }
      case "inflate": {
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

    switch (this.state) {
      case "xmin-xmax": {
        drawPoints(this.points);
        drawPoint(this.points[this.west_idx], "lightgreen");
        drawPoint(this.points[this.east_idx], "yellow");
        break;
      }
      case "ymin-ymax": {
        drawPoints(this.points);
        drawPoint(this.points[this.west_idx], "lightgreen");
        drawPoint(this.points[this.east_idx], "yellow");
        drawPoint(this.points[this.north_idx], "orange");
        drawPoint(this.points[this.south_idx], "red");
        break;
      }
      case "lateral-hulls": {
        drawPolyLine(this.north_west, "lightgreen");
        drawPolyLine(this.north_east, "orange");
        drawPolyLine(this.south_east, "yellow");
        drawPolyLine(this.south_west, "red");
        drawPoints(this.points);
        drawPoint(this.points[this.west_idx], "lightgreen");
        drawPoint(this.points[this.east_idx], "yellow");
        drawPoint(this.points[this.north_idx], "orange");
        drawPoint(this.points[this.south_idx], "red");
        break;
      }
      case "merge": {
        drawPolyLine(this.north_west, "steelblue");
        drawPolyLine(this.north_east, "steelblue");
        drawPolyLine(this.south_east, "steelblue");
        drawPolyLine(this.south_west, "steelblue");
        drawPoints(this.points);
        drawPoint(this.points[this.west_idx], "lightgreen");
        drawPoint(this.points[this.east_idx], "yellow");
        drawPoint(this.points[this.north_idx], "orange");
        drawPoint(this.points[this.south_idx], "red");
        break;
      }
      case "inflate": {
        drawPolyLine(this.north_west, "steelblue");
        drawPolyLine(this.north_east, "steelblue");
        drawPolyLine(this.south_east, "steelblue");
        drawPolyLine(this.south_west, "steelblue");
        drawPolygon(this.hull, "red");
        drawPoints(this.points);
        drawPoint(this.points[this.west_idx], "lightgreen");
        drawPoint(this.points[this.east_idx], "yellow");
        drawPoint(this.points[this.north_idx], "orange");
        drawPoint(this.points[this.south_idx], "red");
        break;
      }
      case "done": {
        drawPolygon(this.hull, "red");
        drawPoints(this.points);
        break;
      }
      default: {
        console.assert(false); // Unreachable
        break;
      }
    }

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(this.state, 10, 20);
  }
}

class TORCHSouthWestHull {
  constructor(points) {
    // n states: start, ..., done
    this.minRequiredPoints = 3;
    this.state = "start";
    this.points = [...points];
    this.west_idx = -1;
    this.south_idx = -1;
    this.south_west = [];
    this.max_y = 0;
    this.i = -1;
  }

  step() {
    switch (this.state) {
      case "start": {
        this.points.sort((a, b) => a.x - b.x);
        this.west_idx = 0;
        this.state = "west";
        break;
      }
      case "west": {
        this.south_idx = 0;
        for (let i = 0; i < this.points.length; i++) {
          if (this.points[i].y > this.points[this.south_idx].y) {
            this.south_idx = i;
          }
        }
        this.state = "south";
        break;
      }
      case "south": {
        this.south_west = [];
        this.max_y = this.points[this.west_idx].y;
        this.south_west.push(this.points[this.west_idx]);
        this.i = this.west_idx + 1;
        this.state = "south-west-hull";
        break;
      }
      case "south-west-hull": {
        if (this.i <= this.south_idx) {
          if (this.points[this.i].y >= this.max_y) {
            this.max_y = this.points[this.i].y;
            this.south_west.push(this.points[this.i]);
          }
          this.i++;
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
      case "west": {
        drawPoints(this.points);
        drawPoint(this.points[this.west_idx], "lightgreen");
        break;
      }
      case "south": {
        drawPoints(this.points);
        drawPoint(this.points[this.west_idx], "lightgreen");
        drawPoint(this.points[this.south_idx], "red");
        break;
      }
      case "south-west-hull": {
        if (this.south_west.length > 1) {
          drawPolyLine(this.south_west, "green");
        }
        drawLine(
          { x: this.points[this.i].x, y: 0 },
          { x: this.points[this.i].x, y: canvas.height },
          "lightgreen",
          true
        );
        drawPoints(this.points);
        drawPoint(this.points[this.west_idx], "lightgreen");
        drawPoint(this.points[this.south_idx], "red");
        drawPoint(this.points[this.i], "lightgreen");
        break;
      }
      case "done": {
        if (this.south_west.length > 1) {
          drawPolyLine(this.south_west, "lightgreen");
        }
        drawPoints(this.points);
        drawPoint(this.points[this.west_idx], "lightgreen");
        drawPoint(this.points[this.south_idx], "red");
        break;
      }
      default: {
        console.assert(false); // Unreachable
        break;
      }
    }

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    if (this.state === "south-west-hull") {
      ctx.fillText(this.state + ": maxy = " + Math.trunc(this.max_y), 10, 20);
    } else {
      ctx.fillText(this.state, 10, 20);
    }
  }
}

class BentleyFaustPreparataApproximation {
  constructor(points, k = 1) {
    // 7 states: start, minx-maxx, strips, sample, sample-hull, points-hull, done
    this.minRequiredPoints = 3;
    this.state = "start";
    this.points = points;
    this.k = k;
    this.minXIdx = 0;
    this.maxXIdx = 0;
    this.dx = 0;
    this.stripDx = 0;
    this.sampled = [];
    this.sampleHull = [];
    this.hull = [];
  }

  step() {
    switch (this.state) {
      case "start": {
        for (let i = 0; i < this.points.length; i++) {
          if (this.points[i].x < this.points[this.minXIdx].x) {
            this.minXIdx = i;
          }
          if (this.points[i].x > this.points[this.maxXIdx].x) {
            this.maxXIdx = i;
          }
        }
        this.state = "minx-maxx";
        break;
      }
      case "minx-maxx": {
        this.dx = this.points[this.maxXIdx].x - this.points[this.minXIdx].x;
        this.stripDx = this.dx / this.k;
        this.state = "strips";
        break;
      }
      case "strips": {
        const strips = Array.from({ length: this.k }, () => {
          return { minYIdx: -1, maxYIdx: -1 };
        });

        // populate strips
        for (let i = 0; i < this.points.length; i++) {
          if (i === this.minXIdx || i === this.maxXIdx) {
            continue;
          }

          // get point
          const p = this.points[i];

          // get the index of the strip in which the point falls into
          const stripIdx = Math.floor(
            (p.x - this.points[this.minXIdx].x) / this.stripDx
          );

          // update strip min y, if necessary
          if (
            strips[stripIdx].minYIdx === -1 ||
            p.y < this.points[strips[stripIdx].minYIdx].y
          ) {
            strips[stripIdx].minYIdx = i;
          }

          // update strip max y, if necessary
          if (
            strips[stripIdx].maxYIdx === -1 ||
            p.y > this.points[strips[stripIdx].maxYIdx].y
          ) {
            strips[stripIdx].maxYIdx = i;
          }
        }

        // sample point set
        this.sampled = [];
        {
          const sampledIdxs = new Set(); // set of points indices used for the sampling
          sampledIdxs.add(this.minXIdx);
          sampledIdxs.add(this.maxXIdx);
          for (let i = 0; i < strips.length; i++) {
            if (strips[i].minYIdx >= 0) {
              sampledIdxs.add(strips[i].minYIdx);
            }
            if (strips[i].maxYIdx >= 0) {
              sampledIdxs.add(strips[i].maxYIdx);
            }
          }

          for (const sampledIdx of sampledIdxs) {
            this.sampled.push(this.points[sampledIdx]);
          }
        }

        this.state = "sample";
        break;
      }
      case "sample": {
        const naive = new Naive(this.sampled);
        naive.continue();
        this.sampleHull = naive.hull;
        this.state = "sample-hull";
        break;
      }
      case "sample-hull": {
        const naive = new Naive(this.points);
        naive.continue();
        this.hull = naive.hull;
        this.state = "points-hull";
        break;
      }
      case "points-hull":
      case "done": {
        this.state = "done";
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
      case "minx-maxx": {
        const minX = this.points[this.minXIdx].x;
        const maxX = this.points[this.maxXIdx].x;
        drawLine({ x: minX, y: 0 }, { x: minX, y: canvas.height }, "red");
        drawLine({ x: maxX, y: 0 }, { x: maxX, y: canvas.height }, "red");
        drawPoints(this.points);
        break;
      }
      case "strips": {
        const minX = this.points[this.minXIdx].x;
        const maxX = this.points[this.maxXIdx].x;
        drawLine({ x: minX, y: 0 }, { x: minX, y: canvas.height }, "red");
        drawLine({ x: maxX, y: 0 }, { x: maxX, y: canvas.height }, "red");
        let startX = minX;
        for (let i = 0; i < this.k - 1; i++) {
          startX += this.stripDx;
          drawLine(
            { x: startX, y: 0 },
            { x: startX, y: canvas.height },
            "steelblue"
          );
        }
        drawPoints(this.points);
        break;
      }
      case "sample": {
        const minX = this.points[this.minXIdx].x;
        const maxX = this.points[this.maxXIdx].x;
        drawLine({ x: minX, y: 0 }, { x: minX, y: canvas.height }, "red");
        drawLine({ x: maxX, y: 0 }, { x: maxX, y: canvas.height }, "red");
        let startX = minX;
        for (let i = 0; i < this.k - 1; i++) {
          startX += this.stripDx;
          drawLine(
            { x: startX, y: 0 },
            { x: startX, y: canvas.height },
            "steelblue"
          );
        }
        drawPoints(this.points);
        drawPoints(this.sampled, "lightgreen", false);
        break;
      }
      case "sample-hull": {
        drawPolygon(this.sampleHull, "steelblue");
        drawPoints(this.points);
        drawPoints(this.sampled, "lightgreen", false);
        break;
      }
      case "points-hull":
      case "done": {
        drawPolygon(this.sampleHull, "steelblue");
        drawPolygon(this.hull, "red");
        drawPoints(this.points);
        drawPoints(this.sampled, "lightgreen", false);
        break;
      }
      default: {
        console.assert(false); // Unreachable
        break;
      }
    }

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(this.state + ": (k=" + this.k + ")", 10, 20);
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

function drawPoints(points, color = "black", label = true) {
  for (const point of points) {
    if (label) {
      let coords = `(${Math.trunc(point.x)},${Math.trunc(point.y)})`;
      ctx.fillStyle = "black";
      ctx.font = "11px Arial";
      ctx.fillText(coords, point.x - 20, point.y - 10);
    }
    drawPoint(point, color);
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
    const fromIdx = i;
    const toIdx = i + 1;
    drawSegment(points[fromIdx], points[toIdx], color);
  }
}

function drawPolygon(points, color) {
  drawPolyLine(points, color);
  drawSegment(points[points.length - 1], points[0], color);
}

function drawLine(p, q, color, dashed = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (dashed) {
    ctx.setLineDash([10, 5]);
  }

  const dx = q.x - p.x;
  const dy = q.y - p.y;

  if (dx === 0) {
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
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
    ctx.setLineDash([]);
  }
}

// Clear canvas and redraw points
function redraw() {
  clearCanvas();
  drawPoints(globalPoints);
}

//
// Event listeners
//
function updateKSlider() {
  if (algoSelect.value === "bentley-faust-preparata-approximation") {
    const maxK = Math.max(1, globalPoints.length);
    kSlider.max = maxK;
    // clamp current value
    if (kSlider.value > maxK) kSlider.value = maxK;
    kValueLabel.textContent = kSlider.value;
    kSliderContainer.style.display = "block";
    // re-init BFP with the slider's k
    algoCtx.k = kSlider.value;
  } else {
    kSliderContainer.style.display = "none";
  }
}

// Handle canvas mouse click to add a point
canvas.addEventListener("click", function (e) {
  // Get bounding rectangle for correct mouse position within the canvas.
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Reject if within the NxN square of any existing point
  const N = 5;
  const tooClose = globalPoints.some(
    (p) => Math.abs(p.x - x) < N && Math.abs(p.y - y) < N
  );

  if (tooClose) {
    pointsTooClose.style.display = "block";
  } else {
    pointsTooClose.style.display = "none";
    globalPoints.push({ x, y });
    algoCtx = new algoCtx.constructor(globalPoints);
    redraw();
    updateKSlider();
  }
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
    case "torch": {
      algoCtx = new TORCH(globalPoints);
      break;
    }
    case "torch-south-west-hull": {
      algoCtx = new TORCHSouthWestHull(globalPoints);
      break;
    }
    case "bentley-faust-preparata-approximation": {
      algoCtx = new BentleyFaustPreparataApproximation(globalPoints);
      break;
    }
    default: {
      console.assert(false); // Unreachable
    }
  }

  updateKSlider();
  redraw();
});

kSlider.addEventListener("input", function () {
  kValueLabel.textContent = this.value;

  if (algoSelect.value === "bentley-faust-preparata-approximation") {
    algoCtx = new BentleyFaustPreparataApproximation(globalPoints, this.value);
    clearCanvas();
    drawPoints(globalPoints);
  }
});

// "Step" button: execute a single step of the algorithm.
stepBtn.addEventListener("click", function () {
  if (globalPoints.length < algoCtx.minRequiredPoints) {
    alert("Bisogna inserire almeno " + algoCtx.minRequiredPoints + " punti.");
    return;
  }

  algoCtx.step();
  algoCtx.draw();
});

// "Continue" button: draw the complete hull.
continueBtn.addEventListener("click", function () {
  if (globalPoints.length < algoCtx.minRequiredPoints) {
    alert("Bisogna inserire almeno " + algoCtx.minRequiredPoints + " punti.");
    return;
  }

  algoCtx.continue();
  algoCtx.draw();
});

// "Undo" button: remove the last inserted point and reset algorithm state.
undoBtn.addEventListener("click", function () {
  globalPoints.pop();
  algoCtx = new algoCtx.constructor(globalPoints);
  clearCanvas();
  updateKSlider();
  drawPoints(globalPoints);
});

// "Reset" button: clear canvas and reset algorithm state.
resetBtn.addEventListener("click", function () {
  globalPoints = [];
  algoCtx = new algoCtx.constructor(globalPoints);
  clearCanvas();
  updateKSlider();
});

// Select "Naive" as the default algorithm.
window.addEventListener("load", function () {
  document.getElementById("algoSelect").value = "naive";
});
