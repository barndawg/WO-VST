/*jshint esversion: 6*/

// TODO:
// [-] Fix individual volume control not working
// [ ] Cleanly delete oscillators and volume envelopes when stop() is used
// [ ] Add sequencer, ADSR, and LFOs

var WO = {
  synth: {
    createOsc: function(freq = 440, type = 'sawtooth'){
      var i = WO.data.oscs.push( WO.context.createOscillator() - 1 ); // Create oscillator, add it to data.oscs and set basic attributes
      WO.data.oscs[i].frequency.value = freq;
      WO.data.oscs[i].type = type;
      return i;
    },
    startOsc: function(i){
      WO.data.oscs[i].start();
    },
    stopOsc: function(i){
      if (i === 'all'){
        for (var i2 = 0; i2 in oscs; i2++){
          WO.data.oscs[i2].stop();
          WO.data.oscs.splice(i2, 1);
        }
      } else {
        WO.data.oscs[i].stop();
        WO.data.oscs.splice(i, 1);
      }
    },
    createFilt: function(cut = 440, type = 'lowpass'){
      var i = WO.data.oscs.push( WO.context.createBiquadFilter() ); // Create biquad filter, add it to data.filts and set basic attributes
      WO.data.filts[i].frequency.value = cut;
      WO.data.filts[i].type = type;
      return i;
    },
    setFilt(i = 0, cut = 440){
      WO.data.filts[i].frequency.value = cut;
    },
    createEnvelope: function(gain = 1){
      var i = WO.data.envs.push( WO.context.createGain() ); // Create gain node, add it to data.envs and set gain value
      WO.data.envs[i].gain.value = gain;
      return i;
    }
  },

  play: {
    freq: function(freq = 440, type = 'sawtooth'){
      var i = WO.synth.createOsc(freq, type);
      WO.synth.startOsc(i);
      WO.play.path(i);
      return i;
    },
    note: function(note = 'C5', type = 'sawtooth'){
      playFreq( WO.util.noteToFreq(note), type );
    },
    path: function(i, path){
      WO.data.oscs[i].connect(path[0]); // Connect oscillator to determined signal path
      for (var i2 = 0; i2 + 1 in path; i2++){
        path[i2].connect(path[i2 + 1]);
      }
    }
  },

  util: {
    noteToFreq: function(){
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
        noteName = 'C'; // Not a valid note
      }

      if (noteName.charAt(1) === 'b'){
        noteName = notes[notes.indexOf(noteName.charAt(0)) - 1]; // Deal with flats here
      }

      if (!notes.includes(noteName)){
        noteName = 'C'; // Not a valid note
      }

      if (noteName.length === 1){
        noteOct = parseInt(note.substring(1)); // Normal note
      } else {
        noteOct = parseInt(note.substring(2)); // Note with accidental
      }

      if (isNaN(noteOct)){
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
      return freq;
    }
  },

  init: function(){
    WO.synth.createEnvelope(1);
    WO.synth.createFilter('highpass', 660);
    WO.synth.createFilter('lowpass', 440);
    return true;
  },

  data: {
    oscs: [],
    filts: [],
    envs: []
  },

  context: new AudioContext(),
  version: '9a'
};

var front = {
  getValues: function(){
    function allVals(tag, attr, max = 3){
      var toReturn = [];
      for (var i = 0; i < max; i++){
        toReturn.push(document.getElementById(tag + i)[attr]);
      }
      return toReturn;
    }

    var v = {};
    v.on = allVals('osc', 'checked');
    v.gain = allVals('gain', 'value');
    v.det = allVals('det', 'value');
    v.type = allVals('type', 'value');
    v.uniOn = allVals('uni', 'checked');
    v.uniOfs = allVals('ofs', 'value');
    v.filtOn = allVals('filt', 'checked', 2);
    v.filtCut = allVals('cut', 'value', 2);
    return v;
  },
  getPath: function(){
    var v = getValues(),
      lpf = v.filtOn[0],
      hpf = v.filtOn[1],
      path = [];
    if (lpf){
      path.push(WO.data.filts[0]);
    }
    if (hpf){
      path.push(WO.data.filts[1]);
    }
    path.push(WO.data.envs[0]);
    path.push(WO.context.destination);
    return path;
  },
  play: function(){
    var v = getValues();
  },
  changeStylesheet: function(){
    var css = document.getElementById('css');
    if (front.data.white){
      css.href = 'stylesheet.css';
      front.data.white = false;
    } else {
      css.href = 'stylesheet_white.css';
      front.data.white = true;
    }
  },
  init: function(){
    // Run this after WO.init
    document.getElementById('version').innerHTML = 'VER ' + front.data.version;
    var volumeControl = document.getElementById('vol');
    volumeControl.addEventListener('input', function(){
      if (volumeControl.value > 100){
        volumeControl.value = 100;
      } else if (volumeControl.value < 0){
        volumeControl.value = 0;
      }
      WO.data.envs[0].value = (Math.exp(volumeControl.value / 100) - 1) / (Math.E - 1);
    });
  },
  data: {
    white: false,
    version: '0.7'
  }
};

var init = false;
init = WO.init();
var initInterval = setInterval(function(){
  if (init){
    front.init();
    clearInterval(initInterval);
  }
}, 50);
