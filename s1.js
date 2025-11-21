let video;
let bodyPose;
let poses = [];
let connections;
let anchoVideo = 1280;
let altoVideo = 720;
let xOffsetVideo = 1000;
let yOffsetVideo = 0;
let xOffsetEsqueleto = 620;
let yOffsetEsqueleto = 0;
let camaras;
let puntos = [];

let camIndex = 0; // índice actual de la cámara

function preload() {
  bodyPose = ml5.bodyPose();
}

async function setup() {
  createCanvas(innerWidth, innerHeight);

  camaras = await ObtenerCamarasDisponibles();
  console.log("Cámaras:", camaras);

  iniciarCamara(camaras[0].deviceId);

  connections = bodyPose.getSkeleton();
}

function draw() {
  background(0);
  puntos = [];
  

  // --- video ---
  push();
  translate(width + xOffsetVideo, 0);
  scale(-2.5, 2.5);
  image(video, 0, 0, anchoVideo, altoVideo);
  pop();

  // --- skeleton ---
  push();
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
  pop();

  // --- keypoints ---
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];

      if (keypoint.confidence > 0.1) {
        const Kx = width - keypoint.x;
        const Ky = keypoint.y;

        push();
        translate(-xOffsetEsqueleto, 0);
        scale(2.5);
        fill(0, 255, 0);
        circle(Kx, Ky, 10);
        text(j, Kx + 10, Ky);
        pop();

        puntos.push(createVector(Kx, Ky));
      }
    }
  }

  // --- ejemplo: distancia entre puntos 9 y 10 ---
  if (puntos[9] && puntos[10]) {
    let d = distanciaEntrePuntos(puntos[9], puntos[10]);
    ellipse(width / 2, height / 2, d, d);
  }
}

// ---------------------------------------------
// FUNCIONES
// ---------------------------------------------

function distanciaEntrePuntos(a, b) {
  return dist(a.x, a.y, b.x, b.y);
}

function gotPoses(results) {
  poses = results;
}

async function ObtenerCamarasDisponibles() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(d => d.kind === "videoinput");
}

// Inicializa una cámara (primera vez)
function iniciarCamara(deviceId) {
  poses = []; 

  video = createCapture({
    video: {
      deviceId: { exact: deviceId },
      width: anchoVideo,
      height: altoVideo,
    },
  });

  video.hide();
   
  video.elt.onloadeddata = () => {
    console.log("Video listo, iniciando pose detection");
    bodyPose.detectStart(video, gotPoses);
  };
}

// Cambia la cámara en runtime
async function cambiarCamara(deviceId) {
  console.log("Cambiando a cámara:", deviceId);

  // detener cámara actual
  if (video && video.elt && video.elt.srcObject) {
    let tracks = video.elt.srcObject.getTracks();
    tracks.forEach(t => t.stop());
  }

  // remover capture de p5
  if (video) video.remove();

  // crear nueva cámara
  iniciarCamara(deviceId);
}

// ---------------------------------------------
// TECLA 'C' PARA ROTAR CÁMARAS
// ---------------------------------------------
function keyPressed() {
  if (key === 'c' || key === 'C') {
    camIndex = (camIndex + 1) % camaras.length;
    cambiarCamara(camaras[camIndex].deviceId);
    connections = bodyPose.getSkeleton();
  }
}
