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
let video1;
let estadoVideo1 = false;
let video1YaFueActivado = false;
let mostrarEsqueleto = true;
let mostrarEspejo = true;
let gestoCerrar = false;

let camIndex = 0; // índice actual de la cámara

function preload() {
  bodyPose = ml5.bodyPose();
  video1 = createVideo("assets/videoplayback.mp4");
}

async function setup() {
  createCanvas(innerWidth, innerHeight);

  camaras = await ObtenerCamarasDisponibles();
  console.log("Cámaras:", camaras);

  iniciarCamara(camaras[0].deviceId);

  connections = bodyPose.getSkeleton();

  video1.loop(); // reproduce en bucle
  video1.hide();
}

function draw() {
  background(0);

  puntos = [];

  // --- video ---
  push();
  translate(width + xOffsetVideo, 0);
  scale(-2.5, 2.5);
  //scale(1);
  image(video, 0, 0, anchoVideo, altoVideo);
  pop();

  if (!mostrarEspejo) {
    fill(0);
    rect(0, 0, width, height);
  }

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
        //scale(1);
        if (mostrarEsqueleto) {
          line(Ax, Ay, Bx, By);
        }
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
        //scale(1);
        fill(0, 255, 0);
        if (mostrarEsqueleto) {
          circle(Kx, Ky, 10);
          text(j, Kx + 10, Ky);
        }

        pop();

        puntos.push(createVector(Kx, Ky));
      }
    }
  }

  // --- ejemplo: distancia entre puntos 9 y 10 ---
  if (puntos[9] && puntos[10]) {
    let d = distanciaEntrePuntos(puntos[9], puntos[10]);
    //ellipse(width / 2, height / 2, d, d);
    if (video1YaFueActivado == false) {
      if (d > 200) {
        video1.play();
        estadoVideo1 = true;
        video1YaFueActivado = true;
      }
    }

    if (video1YaFueActivado) {
      if (d < 180) {
        estadoVideo1 = false;
        video1YaFueActivado = false;
      }
    }
  }

  if (estadoVideo1) {
    // image(video1, 0, 0, width * 2, height);
  }

  if (puntos[9] && puntos[10] && puntos[0]) {
    let d1 = distanciaEntrePuntos(puntos[9], puntos[10]);
    let d2 = distanciaEntrePuntos(puntos[10], puntos[0]);

    if (d1 < 100 && d2 < 100) {
      gestoCerrar = true;
    }
    if (d1 > 100) {
      gestoCerrar = false;
      // iniciarCamara();
    }
  }

  console.log(poses.length);
  if (poses.length > 0) {
    mostrarEspejo = true;
    if (gestoCerrar) {
      mostrarEspejo = false;
    }
  } else {
    mostrarEspejo = false;
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
  return devices.filter((d) => d.kind === "videoinput");
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
    tracks.forEach((t) => t.stop());
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
  if (key === "c" || key === "C") {
    camIndex = (camIndex + 1) % camaras.length;
    cambiarCamara(camaras[camIndex].deviceId);
    connections = bodyPose.getSkeleton();
  }
  if (key == "v" || key == "V") {
    video1.play();
    estadoVideo1 = true;
  }
  if (key == "e" || key == "E") {
    if (mostrarEsqueleto == true) {
      mostrarEsqueleto = false;
    } else {
      mostrarEsqueleto = true;
    }
  }

  if (key == "a" || key == "A") {
    if (mostrarEspejo == true) {
      mostrarEspejo = false;
    } else {
      mostrarEspejo = true;
    }
  }
}
