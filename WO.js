/*jshint esversion: 6*/

function osc(type, freq){
  console.log('[OSC] Creating oscillator with waveform ' + type + ' and frequency ' + freq + 'hZ...');
  oscs.push(context.createOscillator()); // Create oscilllator
  var i = oscs.length - 1; // Get oscillator's item number in array

  oscs[i].type = type; // Set oscillator's waveform
  oscs[i].frequency.value = freq; // Set oscillator's frequency

  oscs[i].start(); // Start oscillator
  return i;
}

function play(){
  console.log('[PLAY] Stopping existing oscillators...');
  stop();
  for (var i = 0; i < 3; i++){
    var num = i + 1; // Use same numbering system as HTML
    console.log('[PLAY] Checking if oscillator ' + num + ' is on or off...');
    var checked = document.getElementById('osc' + num).checked; // Get osc on or off

    if (checked){
      console.log('[PLAY] Oscillator ' + num + ' is on. Getting other inputs...');
      var freq = 440; // Get initial frequency
      var play = document.getElementById('freq' + num).value; // Get value of freq offset
      var type = document.getElementById('type' + num).value; // Get value of waveform
      var uni = document.getElementById('uni' + num).checked; // Get value of unison
      var offset = document.getElementById('ofs' + num).value; // Get value of unison offset

      console.log('[PLAY] Setting cutoff frequencies for filters...'); // Move this code to the switchboard!
      filts[lpf].frequency.value = document.getElementById('lpfCut').value; // Set cutoff for LPF
      filts[hpf].frequency.value = document.getElementById('hpfCut').value; // Set cutoff for HPF

      play = parseFloat(play) + parseFloat(freq); // Add freq offset to initial freq

      if (uni){
        console.log('[PLAY] Unison is on. Starting unison oscillators...');
        flow( osc(type, play - offset) ); // Start & flow lower unison oscillator
        flow( osc(type, parseFloat(play) + parseFloat(offset)) ); // Start & flow higher unison oscillator
      } else {
        console.log('[PLAY] Unison is off for oscillator ' + num + '.');
      }

      console.log('[PLAY] Starting main oscillator ' + num + '...');
      flow( osc(type, play) ); // Start main oscillator
    } else {
      console.log('[PLAY] Oscillator ' + num + ' is off.');
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

function flow(i){
  var path = document.getElementById('filters').value; // Get value of filter select
  var adsr = createVolumeEnvelope();

  if (path == 'none'){
    console.log('[FLOW] Signal path = osc -> vol -> out. Setting...');
    oscs[i].connect(volume); // Connect oscillator to volume (out)
  } else if (path == 'hpf'){
    console.log('[FLOW] Signal path = hpf -> vol -> out. Setting...');
    oscs[i].connect(filts[0]); // Connect oscillator to HPF (out)
    filts[0].connect(volume); // Connect HPF to volume (out)
  } else if (path == 'lpf'){
    console.log('[FLOW] Signal path = lpf -> vol -> out. Setting...');
    oscs[i].connect(filts[1]); // Connect oscillator to LPF (out)
    filts[1].connect(volume); // Connect LPF to volume (out)
  } else if (path == 'both'){
    console.log('[FLOW] Signal path = hpf -> lpf -> vol -> out. Setting...');
    oscs[i].connect(filts[0]); // Connect oscillator to HPF (out)
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
  console.log('[CREATEVOLUMEENVELOPE] Creating volume envelope with gain' + gain + '...');
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

var ver = '0.5c';
var log = true;

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

console.log('[INIT] Creating modulation LFO...');
var modLfo = osc('sawtooth', 440);
