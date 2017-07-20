/*jshint esversion: 6*/

// TODO:
// [ ] Fix individual volume control not working
// [ ] Cleanly delete oscillators and volume envelopes when stop() is used
// [ ] Add sequencer, ADSR, and LFOs

function osc(type, freq, detune = 0, vol = 1){
  console.log('[OSC] Creating oscillator with waveform ' + type + ' and frequency ' + freq + 'hZ...');
  oscs.push(context.createOscillator()); // Create oscilllator
  var i = oscs.length - 1; // Get oscillator's item number in array

  oscs[i].type = type; // Set oscillator's waveform
  oscs[i].frequency.value = freq; // Set oscillator's frequency
  oscs[i].detune.value = detune; // Set oscillator's detune

  var oscVol = createVolumeEnvelope((Math.exp(vol.value / 100) - 1) / (Math.E - 1)); // Create volume envelope for oscillator
  oscs[i].connect(envs[oscVol]); // Connect oscillator to volume envelope

  oscs[i].start(); // Start oscillator
  return oscVol;
}

function play(freq = 440){
  console.log('[PLAY] Stopping existing oscillators...');
  for (var i = 0; i < 3; i++){
    console.log('[PLAY] Checking if oscillator ' + i + ' is on or off...');
    var checked = document.getElementById('osc' + i).checked; // Get osc on or off

    if (checked){
      console.log('[PLAY] Oscillator ' + i + ' is on. Getting other inputs...');
      var detune = document.getElementById('freq' + i).value; // Get value of detune
      console.log(detune);
      var type = document.getElementById('type' + i).value; // Get value of waveform
      var uni = document.getElementById('uni' + i).checked; // Get value of unison
      var offset = document.getElementById('ofs' + i).value; // Get value of unison offset
      var vol = document.getElementById('vol' + i).value / 100; // Get value of volume

      console.log('[PLAY] Setting cutoff frequencies for filters...');
      filts[lpf].frequency.value = document.getElementById('lpfCut').value; // Set cutoff for LPF
      filts[hpf].frequency.value = document.getElementById('hpfCut').value; // Set cutoff for HPF

      if (uni){
        console.log('[PLAY] Unison is on. Starting unison oscillators...');
        flow( osc(type, freq, detune - offset, vol) ); // Start & flow lower unison oscillator
        flow( osc(type, freq, detune + offset, vol) ); // Start & flow higher unison oscillator
      } else {
        console.log('[PLAY] Unison is off for oscillator ' + i + '.');
      }

      console.log('[PLAY] Starting main oscillator ' + i + '...');
      flow( osc(type, freq, detune, vol) ); // Start main oscillator
    } else {
      console.log('[PLAY] Oscillator ' + i + ' is off.');
    }
  }
}

function stop(){
  console.log('[STOP] Stopping oscillators...');
  for (var i = 0; i in oscs; i++){
    oscs[i].stop(); // Stop all oscillators in array
  }
  console.log('[STOP] Deleting oscillators...');
  oscs = []; // Delete all oscillators in array
}

function flow(i, detune = 0){
  var lpfOn = document.getElementById('lpfOn').checked;
  var hpfOn = document.getElementById('hpfOn').checked;
  var adsr = createVolumeEnvelope();

  if (!lpfOn && !hpfOn){
    console.log('[FLOW] Signal path = osc -> vol -> out. Setting...');
    envs[i].connect(volume); // Connect oscillator to volume (out)
  } else if (!lpfOn && hpfOn){
    console.log('[FLOW] Signal path = hpf -> vol -> out. Setting...');
    envs[i].connect(filts[0]); // Connect oscillator to HPF (out)
    filts[0].connect(volume); // Connect HPF to volume (out)
  } else if (lpfOn && !hpfOn){
    console.log('[FLOW] Signal path = lpf -> vol -> out. Setting...');
    envs[i].connect(filts[1]); // Connect oscillator to LPF (out)
    filts[1].connect(volume); // Connect LPF to volume (out)
  } else if (lpfOn && hpfOn){
    console.log('[FLOW] Signal path = hpf -> lpf -> vol -> out. Setting...');
    envs[i].connect(filts[0]); // Connect oscillator to HPF (out)
    filts[0].connect(filts[1]); // Connect HPF to LPF (out)
    filts[1].connect(volume); // Connect LPF to volume (out)
  }

  volume.connect(context.destination); // Connect volume control to audio out (out)
}

function adsr(i){
  var att = document.getElementById('att'),
    dec = document.getElementById('dec'),
    sust = document.getElementById('sust'),
    rel = document.getElementById('rel');
}

function createFilter(type, cutoff){
  console.log('[CREATEFILTER] Creating biquad filter with type ' + type + ' and cutoff ' + cutoff + 'hZ...');
  var filter = context.createBiquadFilter(); // Create biquad filter
  filter.type = type; // Set filter type
  filter.frequency.value = cutoff; // Set cutoff frequency
  filts.push(filter); // Push filter to array
  var num = filts.length - 1; // Get filter position
  console.log('[CREATEFILTER] Filter position in array is ' + num.toString() + '.');
  return num; // Return filter position
}

function createVolumeEnvelope(gain = 1){
  console.log('[CREATEVOLUMEENVELOPE] Creating volume envelope with gain ' + gain + '...');
  var envelope = context.createGain(); // Create gain node for volume control
  envelope.gain.value = 1; // Set volume to 1;
  envs.push(envelope); // Push envelope to array
  var num = envs.length - 1; // Get envelope position
  console.log('[CREATEVOLUMEENVELOPE] Filter position in array is ' + num.toString() + '.');
  return num; // Return envelope position
}

function noteToFrequency(note = 'C5'){
  console.log('[NOTETOFREQUENCY] Converting note ' + note + ' to frequency in hZ...');
  var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], // List of all notes in 1 octave (enharmonics not included)
    noteName, noteOct, // For if statements later
    octDiff, singleOctSteps, steps, // For step calculations
    root = Math.pow(2, 1/12); // 12th root of 2 for conversion

  // Processes the note input into a note name and an octave. If it is passed an incorrect value it outputs C5.
  if (!isNaN(parseInt(note.substring(1)))){
    noteName = note.charAt(0); // Normal note (2nd character+ is octave)
  } else if (note.charAt(1) === '#' || note.charAt(1) === 'b') {
    noteName = note.substring(0, 2); // Note with accidental (3rd character+ is octave)
  } else {
    console.log('[NOTETOFREQUENCY] Invalid note name. Setting name to C.');
    noteName = 'C'; // Not a valid note
  }

  if (noteName.charAt(1) === 'b'){
    noteName = notes[notes.indexOf(noteName.charAt(0)) - 1]; // Deal with flats here
  }

  if (!notes.includes(noteName)){
    console.log('[NOTETOFREQUENCY] Invalid note name. Setting name to C.');
    noteName = 'C'; // Not a valid note
  }

  if (noteName.length === 1){
    noteOct = parseInt(note.substring(1)); // Normal note
  } else {
    noteOct = parseInt(note.substring(2)); // Note with accidental
  }

  if (isNaN(noteOct)){
    console.log('[NOTETOFREQUENCY] Invalid note octave. Setting octave to 5.');
    noteOct = 5; // Not a valid octave
  }

  // Figures out the number of semitones between it and A4
  // +-12st for octave difference
  octDiff = noteOct - 4; // + if octave is greater, - if it is less
  singleOctSteps = notes.indexOf(noteName.charAt(0)) - notes.indexOf('A'); // Gets steps in 1 oct from A, not counting accidentals

  if (noteName.charAt(1) === '#'){
    singleOctSteps = singleOctSteps + 1; // Add one step for sharp
  }

  if (octDiff < 0){
    steps = singleOctSteps + 12 * (octDiff); // Step difference with supplemental octaves
  } else if (octDiff > 0) {
    steps = singleOctSteps + 12 * (octDiff); // Step difference with positive octaves
  } else {
    steps = singleOctSteps;
  }
  console.log(steps);

  console.log(isNaN(steps));

  var freq = 440 * Math.pow(root, steps);
  console.log('[NOTETOFREQUENCY] Finished converting! Frequency for ' + note + ' is ' + freq + '.');
  return freq;
}

function changeStylesheet(){
  var ssLink = document.getElementById('css');
  if (white){
    ssLink.href = 'stylesheet.css';
    white = false;
  } else {
    ssLink.href = 'stylesheet_white.css';
    white = true;
  }
}

var ver = '0.5c',
  log = true,
  white = false;

console.out = console.log.bind(console); // Make console.out = normal console.log
console.log = function(text){ // Make console.log only output when log is true
  if (log){
    this.out(text);
  }
};

document.getElementById('version').innerHTML = 'VER ' + ver;
console.log('[INIT] Welcome to WØ-VST v' + ver + '!');

console.log('[INIT] Creating oscillator, filter, and lfo arrays...');
var oscs = []; // Create oscillator array
var filts = []; // Create filter array
var envs = []; // Create envelope array

console.log('[INIT] Creating audio context...');
var context = new AudioContext(); // Create audio context

console.log('[INIT] Creating envelope for volume control...');
var volume = envs[ createVolumeEnvelope(1) ]; // Create gain node for volume control
var volumeControl = document.getElementById('vol'); // Get volume control element
volumeControl.addEventListener('input', function(){
  if (volumeControl.value > 100){
    volumeControl.value = 100;
  } else if (volumeControl.value < 0){
    volumeControl.value = 0;
  }
  volume.gain.value = (Math.exp(volumeControl.value / 100) - 1) / (Math.E - 1); // Logarithmic volume control
});

console.log('[INIT] Creating biquad filters...');
var hpf = createFilter('highpass', 660); // Create highpass filter
var lpf = createFilter('lowpass', 440); // Create lowpass filter
