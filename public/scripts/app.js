// create web audio api context
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var effect, analyser, oscillator, gainNode, mode;

// mute button
var mute = document.querySelector('.mute');

mute.onclick = function() {
  if(mute.getAttribute('data-muted') === 'false') {
    analyser.disconnect(audioCtx.destination);
    mute.setAttribute('data-muted', 'true');
    mute.innerHTML = "Unmute";
  } else {
    analyser.connect(audioCtx.destination);
    mute.setAttribute('data-muted', 'false');
    mute.innerHTML = "Mute";
  }
};

// Socket io
var socket = io();
socket.on('new input', function(value){
    // console.log(value, typeof value);
    if (typeof value === "number") {
      if(mode == "voice" && effect.setPitchOffset) {
        effect.setPitchOffset(value);
      }
      if(mode == "synth") {
        oscillator.frequency.value = value;
      }
    }
});

// mode button
var playingMode = document.querySelector('.mode');

playingMode.onclick = function() {

  if(mute.getAttribute('data-muted') === 'true') {
    analyser.connect(audioCtx.destination);
    mute.setAttribute('data-muted', 'false');
    mute.innerHTML = "Mute";
  }

  if(playingMode.getAttribute('data-mode') === 'voice') {
    playingMode.setAttribute('data-mode', 'synth');
    playingMode.innerHTML = "Voice Input";
    if(analyser)
      analyser.disconnect(audioCtx.destination);
    init(undefined, "synth");
  } else {
    analyser.connect(audioCtx.destination);
    playingMode.setAttribute('data-mode', 'voice');
    playingMode.innerHTML = "Synth Input";
    if(analyser)
      analyser.disconnect(audioCtx.destination);
    if (!navigator.getUserMedia) {

         alert('Your browser does not support the Media Stream API');

     } else {

         navigator.getUserMedia(

             {audio: true, video: false},

             function (stream) {
                 var audioSource = audioCtx.createMediaStreamSource(stream);
                 init(audioSource, "voice");
             },

             function (error) {
                 alert('Unable to get the user media');
             }
         );
     }
  };
}

function init(audioSource, newMode) {
  mode = newMode;
  socket.emit("change_mode", mode);
  // create Oscillator and gain node
  if(mode == "synth") {
    oscillator = audioCtx.createOscillator();
  }

  gainNode = audioCtx.createGain();
  analyser = audioCtx.createAnalyser();


  // connect oscillator to gain node to speakers

  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  switch(mode) {
    case "synth":
      oscillator.connect(gainNode);
      break;
    case "voice":
      effect = new Jungle(audioCtx);
      effect.output.connect(gainNode);
      audioSource.connect(effect.input);
      break;
  }

  gainNode.connect(analyser);
  analyser.connect(audioCtx.destination);

  // create initial theremin frequency and volume values

  var WIDTH = window.innerWidth;
  var HEIGHT = window.innerHeight;

  var maxFreq = 6000;
  var maxVol = 0.02;

  var initialFreq = 0;
  var initialVol = 1;

  // set options for the oscillator
  if(mode == "synth") {
    oscillator.type = 'square';
    oscillator.frequency.value = initialFreq; // value in hertz
    oscillator.detune.value = 100; // value in cents
    oscillator.start(0);
  }

  gainNode.gain.value = initialVol;

  function draw() {
    var canvas = document.getElementById("canvas_audio");

    var WIDTH = canvas.width;
    var HEIGHT = canvas.height;

    var ctx = canvas.getContext("2d");

    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(128, 255, 0)';

    ctx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;

    for (var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    window.requestAnimationFrame(draw);
  }

  draw();
}
init(undefined, "synth");
