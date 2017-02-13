// TO-DO LIST
// Add modulation textbox inputs in their own panel (HTML) []
// Add basic code for modulation from http://tinyurl.com/hpgvg77 (JS) []
// Add way of sequencing sounds (JS) and make input field for code (HTML) []

function osc(freq, type){
  oscs.push(context.createOscillator()); // Create oscilllator
  var i = oscs.length - 1; // Get oscillator's item number in array

  oscs[i].type = type; // Set oscillator's waveform
  oscs[i].frequency.value = freq; // Set oscillator's frequency

  // I need a switching function for the signal path here

  oscs[i].connect(volume);

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

      lpf.frequency.value = document.getElementById('lpfCut').value; // Set cutoff for LPF
      hpf.frequency.value = document.getElementById('hpfCut').value; // Set cutoff for HPF

      play = parseFloat(play) + parseFloat(freq); // Add freq offset to initial freq

      if (uni){
        // osc(play - offset, type); // Start lower unison oscillator
        // osc(parseFloat(play) + parseFloat(offset), type); // Start higher unison oscillator
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

var oscs = []; // Create oscillator array

var context = new AudioContext(); // Create audio context

var volume = context.createGain(); // Create gain node for volume control
volume.connect(context.destination); // Connect gain node to audio output
volume.gain.value = 0.5; // Set volume to 0.2;

var hpf = context.createBiquadFilter(); // Create highpass filter
hpf.connect(volume); // Connect HPF to volume control (out)
hpf.type = 'highpass'; // Set filter type to highpass
hpf.frequency.value = 880; // Set cutoff frequency to 660 HZ

var lpf = context.createBiquadFilter(); // Create lowpass filter
lpf.connect(hpf); // Connect LPF to HPF (out)
lpf.type = 'lowpass'; // Set filter type to lowpass
lpf.frequency.value = 880; // Set cutoff frequency to 440 HZ
