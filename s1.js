

let video;
let bodyPose;
let poses = [];
let connections;
let anchoVideo = 1280;
let altoVideo = 720;
let xOffsetVideo = 1000;
let xOffsetEsqueleto = 600;
let ajusteAltura = 1.2;

function preload() {
  // Load the bodyPose model
  bodyPose = ml5.bodyPose();
}

function setup() {
  createCanvas(innerWidth, innerHeight);

  //printAvailableResolutions(); 

  // Create the video and hide it
  video = createCapture(VIDEO);
  video.size(anchoVideo, altoVideo*ajusteAltura);
  video.hide();

  // Start detecting poses in the webcam video
  bodyPose.detectStart(video, gotPoses);
  // Get the skeleton connection information
  connections = bodyPose.getSkeleton();
}

function draw() {
  background(0);
  push();
  translate(width+xOffsetVideo, 0); // move to the right edge
  scale(-2.5, 2.5); // flip horizontally
  image(video, 0, 0, anchoVideo, altoVideo*1.2);
  pop();

  
  push();
  // Draw the skeleton connections (mirrored)
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];

    for (let j = 0; j < connections.length; j++) {
      let pointAIndex = connections[j][0];
      let pointBIndex = connections[j][1];
      let pointA = pose.keypoints[pointAIndex];
      let pointB = pose.keypoints[pointBIndex];

      if (pointA.confidence > 0.1 && pointB.confidence > 0.1) {
        stroke(255, 0, 0);
        strokeWeight(2);

        // MIRROR coordinates
        const Ax = width - pointA.x;
        const Ay = pointA.y;
        const Bx = width - pointB.x;
        const By = pointB.y;
        push();
        translate(-xOffsetEsqueleto, 0);
        scale(2.5);
        line(Ax, Ay, Bx, By);
        pop();
      }
    }
  }

  // Draw keypoints (mirrored)
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];

    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];

      if (keypoint.confidence > 0.1) {
        fill(0, 255, 0);
        noStroke();

        // MIRROR coordinates
        const Kx = width - keypoint.x;
        const Ky = keypoint.y;
        push();
        translate(-xOffsetEsqueleto, 0);
        scale(2.5);
        circle(Kx, Ky, 10);
        text(j, Kx+10, Ky);
        pop();
      }
    }
  }
}

// Callback function for when bodyPose outputs data
function gotPoses(results) {
  // Save the output to the poses variable
  poses = results;
}


async function printAvailableResolutions() {
  const constraints = {
    video: true
  };

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');

    console.log("Video inputs:");
    console.log(videoInputs);

    for (let device of videoInputs) {
      console.log(`\nTesting device: ${device.label}`);

      // Try a list of common resolutions
      const testResolutions = [
        [160, 120],
        [320, 240],
        [640, 480],
        [800, 600],
        [1024, 576],
        [1280, 720],
        [1920, 1080],
        [2560, 1440],
        [3840, 2160]
      ];

      for (let [w, h] of testResolutions) {
        try {
          await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: device.deviceId,
              width: { exact: w },
              height: { exact: h }
            }
          });
          console.log(`✔️ Supported: ${w}x${h}`);
        } catch (err) {
          console.log(`❌ Not supported: ${w}x${h}`);
        }
      }
    }
  } catch (err) {
    console.error("Error listing resolutions:", err);
  }
}