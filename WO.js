function osc(freq, type){
  oscs.push(context.createOscillator()); // Create oscilllator
  var i = oscs.length - 1; // Get oscillator's item number in array

  oscs[i].type = type; // Set oscillator's waveform
  oscs[i].frequency.value = freq; // Set oscillator's frequency

  flow(i); // Set signal path for oscillator
  oscs[i].start(); // Start oscillator
}

function play(){
  stop();
  for (var i = 0; i < 3; i++){
    var num = i + 1; // Use same numbering system as HTML
    var checked = document.getElementById('osc' + num).checked; // Get osc on or off

    if (checked){
      var freq = document.getElementById('freq').value; // Get initial frequency
      var play = document.getElementById('freq' + num).value; // Get value of freq offset
      var type = document.getElementById('type' + num).value; // Get value of waveform
      var uni = document.getElementById('uni' + num).checked; // Get value of unison
      var offset = document.getElementById('ofs' + num).value; // Get value of unison offset

      filts[lpf].frequency.value = document.getElementById('lpfCut').value; // Set cutoff for LPF
      filts[hpf].frequency.value = document.getElementById('hpfCut').value; // Set cutoff for HPF

      play = parseFloat(play) + parseFloat(freq); // Add freq offset to initial freq

      if (uni){
        osc(play - offset, type); // Start lower unison oscillator
        osc(parseFloat(play) + parseFloat(offset), type); // Start higher unison oscillator
      }

      osc(play, type); // Start main oscillator
    }
  }
}

function stop(){
    for (var i = 0; i in oscs; i++){
      oscs[i].stop(); // Stop all oscillators in array
    }
    oscs = []; // Delete all oscillators in array
}

function flow(i){
  var path = document.getElementById('filters').value; // Get value of filter select

  if (path == 'none'){
    oscs[i].connect(volume); // Connect oscillator to volume (out)
  } else if (path == 'hpf'){
    oscs[i].connect(filts[0]); // Connect oscillator to HPF (out)
    filts[0].connect(volume); // Connect HPF to volume (out)
  } else if (path == 'lpf'){
    oscs[i].connect(filts[1]); // Connect oscillator to LPF (out)
    filts[1].connect(volume); // Connect LPF to volume (out)
  } else if (path == 'both'){
    oscs[i].connect(filts[0]); // Connect oscillator to HPF (out)
    filts[0].connect(filts[1]); // Connect HPF to LPF (out)
    filts[1].connect(volume); // Connect LPF to volume (out)
  }

  volume.connect(context.destination); // Connect volume control to audio out (out)
}

function createFilter(type, cutoff){
  var filter = context.createBiquadFilter(); // Create biquad filter
  filter.type = type; // Set filter type
  filter.frequency.value = cutoff; // Set cutoff frequency
  filts.push(filter); // Push filter to array
  return filts.length - 1; // Return filter position
}

function createLFO(type, amp){
  var lfo = context.createOscillator(); // Create low frequency oscillator
  var lfoAmp = context.createGain(); // Create gain node for amplitude control
  lfo.type = type; // Set LFO type
  lfoAmp.gain.value = amp; // Set LFO amplitude
  lfo.connect(lfoAmp); // Connect LFO amplitude to LFO
  var toPush = {
    lfo: lfo,
    amp: lfoAmp
  }; // Create object with LFO and amplitude
  lfos.push(toPush); // Push object to array
  return lfos.length - 1; // Return LFO position
}

var oscs = []; // Create oscillator array
var filts = []; // Create filter array
var lfos = []; // Create LFO array

var context = new AudioContext(); // Create audio context

var volume = context.createGain(); // Create gain node for volume control
volume.gain.value = 0.5; // Set volume to 0.5;

var hpf = createFilter('highpass', 660); // Create highpass filter
var lpf = createFilter('lowpass', 440); // Create lowpass filter
