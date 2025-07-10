let figuras = [];
let figura;
let lasFiguras = [];
let cant = 10;
let cantFiguras = 15;
let dibujadas = 0;
let paleta;
let cuadrado;
let losCuadrados = [];
let cantidad = 0;

let mic;
let audioContext;

let AMP_MIN = 0.001;
let AMP_MAX = 0.1;
let NOTE_MIN = 40;
let NOTE_MAX = 74;

let amortigua = 0.9;
let amp;
let gestorAmp, gestorPitch;
let umbral = 0.1;

let haySonido = false;
let antesHabiaSonido = false;

let numeroDeNota;
let pitchActual = 0;

let tiempoSinSonido = 0;
let tiempoDeReinicio = 5000; //10 segundos
let tiempoUltimoSonido = 0;

const model_url = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';


function preload() {

    paleta = new Paleta("data/paleta2.png");

    for (let i = 0; i < cant; i++) {
        let nombre = "data/Figura" + i + ".png";
        figuras[i] = loadImage(nombre);
    }
}

function setup() {
    createCanvas(200, 300);
    background(200);
    imageMode(CENTER);
    noStroke();

    audioContext = getAudioContext();
    mic = new p5.AudioIn();
    //mic.start();
    mic.start(startPitch);
    userStartAudio();

    gestorAmp = new GestorSenial(AMP_MIN, AMP_MAX);
    gestorPitch = new GestorSenial(NOTE_MIN, NOTE_MAX);

    startPitch();
}

function draw() {
    background(255);
    let ampCruda = mic.getLevel();
    gestorAmp.actualizar(ampCruda);
    amp = gestorAmp.filtrada;

    //let texto = "Amplitud: " + nfc(amp, 4);
    //text(texto, 50,50);

    haySonido = amp > umbral;
    noHaySonido = !haySonido;

    let empezoElSonido = !antesHabiaSonido && haySonido;

    let terminoElSonido = !haySonido && antesHabiaSonido;

    let pitch = gestorPitch.filtrada;

    if(haySonido){
        tiempoUltimoSonido = millis();
    }

    tiempoSinSonido = millis() - tiempoUltimoSonido;

    if(tiempoSinSonido > tiempoDeReinicio){
        reiniciarObra();
    }

    if (!haySonido) {
  for (let i = 0; i < cantidad; i++) {
    let figura = lasFiguras[i];
    figura.x += map(noise(frameCount * 0.01 + i), 0, 1, -1, 1);
    figura.y += map(noise(frameCount * 0.01 + 100 + i), 0, 1, -1, 1);
  }
}


/*
    if (!haySonido) {
    for (let i = 0; i < cantidad; i++) {
        lasFiguras[i].x += random(-1, 1);
        lasFiguras[i].y += random(-1, 1);
    }
}
*/
    if (haySonido) {
        if (cantidad < cantFiguras) {
            figura = new Figura(random(width), random(height), random(10, 100), random(10, 100), figuras, int(random(cant)), paleta);
            lasFiguras[cantidad] = figura;
            cantidad++;
        }
    }
    for (let i = 0; i < cantidad; i++) {
    lasFiguras[i].dibujar(haySonido);
    }
    if (haySonido) {
        for (let i = 0; i < cantidad; i++) {
            lasFiguras[i].crecer();
        }
    }

    //rotar con pitch
    /*
    if (numeroDeNota > NOTE_MIN && numeroDeNota < NOTE_MAX) {
        if (numeroDeNota >= NOTE_MIN) {
            for (let i = 0; i < cantidad; i++) {
                lasFiguras[i].rotar(); // <-- ROTAR SEGÚN LA NOTA
            }
        }
    }*/
    if (haySonido) {
        for (let i = 0; i < cantidad; i++) {
            lasFiguras[i].rotar(pitchActual); // cambia el ángulo según la nota
        }
    }                  




}



/*
function keyPressed() {
  if (key === 'c') {
    let cual = int(random(cant));
    let x = random( 0 , width);
    let y = random( 0 , height);
    let t = random(20, 200);
    let figura = new Figura(x, y, t, figuras, cual);
    push();
    tint( paleta.darColor());

    figura.dibujar();
    pop();


     
  }

}*/


function dibujarFigura() {

    push();
    noStroke();
    tint(paleta.darColor());

    let cual = int(random(cant));
    let x = random(0, width);
    let y = random(0, height);

    translate(x, y);
    let angulo = radians(map(x, 0, width, 90, 540));
    rotate(angulo);
    scale(random(0.2, 0.8));


    //image(figuras[cual], 0, 0);
    pop();
    dibujadas++;
}

function reiniciarObra() {
  lasFiguras = [];
  cantidad = 0;
  tiempoUltimoSonido = millis(); // reseteamos el reloj
  background(255); // limpiar canvas (opcional, ya se hace al inicio del draw)
  antesHabiaSonido = false;

}


//--------------------------------------------------------------------
//inicia el modelo de Machine Learning para deteccion de pitch (altura tonal)
function startPitch() {
    pitch = ml5.pitchDetection(model_url, audioContext, mic.stream, modelLoaded);
}

//--------------------------------------------------------------------
function modelLoaded() {
    //select('#status').html('Model Loaded');
    getPitch();
    //console.log( "entro aca !" );
}

//--------------------------------------------------------------------
function getPitch() {
    pitch.getPitch(function (err, frequency) {
        //aca ingresa la frecuencia 'cruda'
        if (frequency) {
            //transforma la frevcuencia en nota musical
            numeroDeNota = freqToMidi(frequency);
            // console.log( numeroDeNota );
            console.log("Nota: " + numeroDeNota + "  Frecuencia: " + frequency);

            gestorPitch.actualizar(numeroDeNota);

        }

        getPitch();
    })
}


/* function startPitch() {
    pitch = ml5.pitchDetection(model_url, audioContext, mic.stream, modelLoaded);
}
 */
function modelLoaded() {
    getPitch();
}

function getPitch() {
    pitch.getPitch(function (err, frequency) {
        if (frequency) {
            numeroDeNota = freqToMidi(frequency);
            console.log("Nota: " + numeroDeNota + "  Frecuencia: " + frequency);
            gestorPitch.actualizar(numeroDeNota);
            pitchActual = numeroDeNota;
        }
        getPitch(); // loop recursivo
    });
}

//------------------------------------------------------------
// Función para convertir frecuencia en número de nota MIDI
function freqToMidi(f) {
    return Math.round(69 + 12 * Math.log2(f / 440));
}

