/*jshint esversion: 6*/

// TODO:
// [-] Fix individual volume control not working
// [ ] Cleanly delete oscillators and volume envelopes when stop() is used
// [ ] Add sequencer, ADSR, and LFOs

function osc(fv, i, freq = 440, uni = 0){
  console.log('[OSC] Creating oscillator with waveform ' + fv.type[i] + ' and frequency ' + freq + 'hZ...');
  oscs.push(context.createOscillator()); // Create oscilllator
  var i2 = oscs.length - 1; // Get oscillator position in array

  oscs[i2].type = fv.type[i]; // Set oscillator's waveform
  oscs[i2].frequency.value = freq; // Set oscillator's frequency
  oscs[i2].detune.value = fv.det[i] + uni; // Set oscillator's detune

  oscs[i2].start(); // Start oscillator
  return i2;
}

function play(freq = 440){
  console.log('[PLAY] Stopping existing oscillators...');
  stop();

  var fv = getValues(); // Get all values from front end

  console.log('[PLAY] Setting cutoff frequencies for filters...');
  filts[lpf].frequency.value = fv.filtCut[0]; // Set cutoff for LPF
  filts[hpf].frequency.value = fv.filtCut[1]; // Set cutoff for HPF

  for (var i = 0; i < 3; i++){
    console.log('[PLAY] Checking if oscillator ' + i + ' is on or off...');
    var checked = fv.on[i];

    if (checked){
      console.log('[PLAY] Oscillator ' + i + ' is on.');
      var uni = fv.uniOn;

      if (uni){
        console.log('[PLAY] Unison is on. Starting unison oscillators...');
        flow( osc(fv, i, fv.uniOfs[i]), fv ); // Start & flow higher unison oscillator
        flow( osc(fv, i, -fv.uniOfs[i]), fv ); // Start & flow lower unison oscillator
      } else {
        console.log('[PLAY] Unison is off for oscillator ' + i + '.');
      }

      console.log('[PLAY] Starting main oscillator ' + i + '...');
      flow( osc(fv, i), fv ); // Start main oscillator
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

  console.log('[STOP] Deleting volume envelopes...');
  envs.splice(1); // Delete all oscillator envelopes in array
}

function flow(i, fv){
  var lpfOn = fv.filtOn[0];
  var hpfOn = fv.filtOn[1];
  var adsr = envs[ createVolumeEnvelope() ];
  adsr.gain.value = (Math.exp(vol.value / 100) - 1) / (Math.E - 1);

  if (!lpfOn && !hpfOn){
    console.log('[FLOW] Signal path = osc -> vol -> out. Setting...');
    oscs[i].connect(adsr); // Connect oscillator to volume (out)
    adsr.connect(volume);
  } else if (!lpfOn && hpfOn){
    console.log('[FLOW] Signal path = hpf -> vol -> out. Setting...');
    oscs[i].connect(filts[0]); // Connect oscillator to HPF (out)
    filts[0].connect(adsr); // Connect HPF to volume (out)
    adsr.connect(volume);
  } else if (lpfOn && !hpfOn){
    console.log('[FLOW] Signal path = lpf -> vol -> out. Setting...');
    oscs[i].connect(filts[1]); // Connect oscillator to LPF (out)
    filts[1].connect(adsr); // Connect LPF to volume (out)
    adsr.connect(volume);
  } else if (lpfOn && hpfOn){
    console.log('[FLOW] Signal path = hpf -> lpf -> vol -> out. Setting...');
    oscs[i].connect(filts[0]); // Connect oscillator to HPF (out)
    filts[0].connect(filts[1]); // Connect HPF to LPF (out)
    filts[1].connect(adsr); // Connect LPF to volume (out)
    adsr.connect(volume);
  }

  volume.connect(context.destination); // Connect volume control to audio out (out)
}

function getValues(){
  console.log('[GETVALUES] Getting values from front end...');
  function allVals(tag, attr, max = 3){
    var toReturn = [];
    for (var i = 0; i < max; i++){
      toReturn.push(document.getElementById(tag + i)[attr]);
    }
    return toReturn;
  }

  var fv = {};
  fv.on = allVals('osc', 'checked');
  fv.gain = allVals('gain', 'value');
  fv.det = allVals('det', 'value');
  fv.type = allVals('type', 'value');
  fv.uniOn = allVals('uni', 'checked');
  fv.uniOfs = allVals('ofs', 'value');
  fv.filtOn = allVals('filt', 'checked', 2);
  fv.filtCut = allVals('cut', 'value', 2);

  return fv;
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
