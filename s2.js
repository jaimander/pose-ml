let video;
let facemesh;
let predictions = [];

let faceImg;

// We pick a subset of the face mesh points to build a triangle mesh
let TRIANGLES = [
  [10, 338, 297], [297, 332, 284], [284, 251, 389],
  [389, 356, 454], [454, 323, 361], [361, 288, 397],
  [397, 365, 379], [379, 378, 400], [400, 377, 152],

  // Eyes
  [33, 133, 160], [263, 362, 387],

  // Nose region
  [6, 197, 195], [195, 5, 4], [4, 45, 276],

  // Mouth
  [78, 308, 13], [13, 14, 17], [17, 87, 178],
];

function preload() {
  facemesh = ml5.faceMesh();
  faceImg = loadImage("face.jpg"); // <-- put your face photo here
}

function setup() {
  createCanvas(innerWidth, innerHeight);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  facemesh.detectStart(video, gotFaces);
}

function draw() {
  background(0);

  // Draw mirrored webcam
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, 640, 480);
  pop();

  if (predictions.length === 0) return;

  let kp = predictions[0].keypoints;

  // Draw warped face
  drawWarpedFace(kp);
}

function drawWarpedFace(kp) {
  push();
  translate(width, 0);
  scale(-1, 1);

  for (let tri of TRIANGLES) {
    let [i1, i2, i3] = tri;

    let p1 = kp[i1];
    let p2 = kp[i2];
    let p3 = kp[i3];

    // Destination triangle (your face)
    let dx1 = p1.x;
    let dy1 = p1.y;
    let dx2 = p2.x;
    let dy2 = p2.y;
    let dx3 = p3.x;
    let dy3 = p3.y;

    // Source triangle (static face image)
    // Map each triangle from the original image
    let sx1 = faceImg.width * 0.4;
    let sy1 = faceImg.height * 0.25;

    // To improve realism you can map real facial points here:
    let sx2 = sx1 + (p2.x - p1.x);
    let sy2 = sy1 + (p2.y - p1.y);
    let sx3 = sx1 + (p3.x - p1.x);
    let sy3 = sy1 + (p3.y - p1.y);

    // Draw warped triangle using texture mapping
    beginShape();
    texture(faceImg);
    vertex(dx1, dy1, sx1, sy1);
    vertex(dx2, dy2, sx2, sy2);
    vertex(dx3, dy3, sx3, sy3);
    endShape(CLOSE);
  }
  pop();
}

function gotFaces(results) {
  predictions = results;
}

/*
https://www.youtube.com/watch?v=9WywDPOV5nA

*/