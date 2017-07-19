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
      var freq = document.getElementById('freq').value; // Get initial frequency
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

var ver = '0.5a';
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

console.log('[INIT] Creating audio context...');
var context = new AudioContext(); // Create audio context

console.log('[INIT] Creating gain node for volume control...');
var volume = context.createGain(); // Create gain node for volume control
volume.gain.value = 0.5; // Set volume to 0.5;

console.log('[INIT] Creating biquad filters...');
var hpf = createFilter('highpass', 660); // Create highpass filter
var lpf = createFilter('lowpass', 440); // Create lowpass filter

console.log('[INIT] Creating modulation LFO...');
var modLfo = osc('sawtooth', 440);
