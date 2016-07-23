/*
The MIT License (MIT)

Copyright (c) 2014 Chris Wilson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var lastPitches = [];
var pitchesFactorCount = 15;
var pitchMiddle = Math.floor(pitchesFactorCount/2)

var audioContext = null;
var isPlaying = false;
var sourceNode = null;
var analyser = null;
var theBuffer = null;
var DEBUGCANVAS = true;
var mediaStreamSource = null;
// var detectorElem, 
// 	canvasElem,
// 	waveCanvas,
// 	pitchElem,
// 	noteElem,
// 	detuneElem,
// 	detuneAmount;


window.onload = function() {
	//Интерфейс работы со звуком
	audioContext = new AudioContext();
	//задаем максимальный размер выборки, для FFT
	MAX_SIZE = Math.max(4,Math.floor(audioContext.sampleRate/3000));	// corresponds to a 5kHz signal
	//загрузка данных и их расшифровка (из файла или с оригинала).
	var request = new XMLHttpRequest();
	request.open("GET", "../sounds/whistling3.ogg", true);
	request.responseType = "arraybuffer";
	request.onload = function() {
	  audioContext.decodeAudioData( request.response, function(buffer) { 
	    	theBuffer = buffer;
		} );
	}
	request.send();
	
}

function error() {
    alert('Stream generation failed.');
}

function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia = 
        	navigator.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    var biquadFilter = audioContext.createBiquadFilter();
    biquadFilter.type = 'bandpath';
    biquadFilter.frequency.value = 440;
    biquadFilter.Q.value = 0.2;


	var compressor = audioContext.createDynamicsCompressor();
	compressor.threshold.value = -50;
	compressor.knee.value = 40;
	compressor.ratio.value = 12;
	compressor.reduction.value = -20;
	compressor.attack.value = 0;
	compressor.release.value = 0.25;


    // Connect it to the destination.
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.maxDecibels = 10;
    analyser.minDecibels = -90;

    // analyser.maxDecibels = 80;
    // analyser.minDecibels = 10;

    analyser.smoothingTimeConstant = 0;
    
    mediaStreamSource.connect(biquadFilter);
    mediaStreamSource.connect(compressor);

    biquadFilter.connect(analyser);
    updatePitch();
}

function toggleOscillator() {
  //   if (isPlaying) {
  //       //stop playing and return
  //       sourceNode.stop( 0 );
  //       sourceNode = null;
  //       analyser = null;
  //       isPlaying = false;
		// if (!window.cancelAnimationFrame)
		// 	window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
  //       window.cancelAnimationFrame( rafID );
  //       return "play oscillator";
  //   }
  //   sourceNode = audioContext.createOscillator();
  //   sourceNode.frequency.value = 440; 
  //   sourceNode.type = 'sine';

  //   analyser = audioContext.createAnalyser();
  //   analyser.fftSize = 2048;
  //   sourceNode.connect( analyser );
  //   analyser.connect( audioContext.destination );
  //   isPlaying = false;
  //   isLiveInput = false;
  //   updatePitch();
   

	// analyser = audioContext.createAnalyser();
	// analyser.fftSize = 2048;
	// isPlaying = true;
	// isLiveInput = false;
	// updatePitch();
	// analyser.connect( audioContext.destination );
    return "stop";
}
function startOscilator(frequency) {
	isPlaying = true;
	var oscillator = audioContext.createOscillator();
	oscillator.frequency.value = frequency;
	oscillator.connect(audioContext.destination);
	currentTime = audioContext.currentTime;
	oscillator.start(currentTime);
	oscillator.stop(currentTime + 0.5);

	setTimeout(function() {
		isPlaying = false;
		oscillator.disconnect( audioContext.destination );
	},500);

}
function stopOscilator() {
	// sourceNode.disconnect(audioContext.destination);
	isPlaying = false;
	sourceNode.stop(sourceNode.currentTime);
}
//Живой ввод подготовка UI и передача данных функции по обработке звука
function toggleLiveInput() {
    if (isPlaying) {
        //stop playing and return
        sourceNode.stop( 0 );
        sourceNode = null;
        analyser = null;
        isPlaying = false;
		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
        window.cancelAnimationFrame( rafID );
    }
    getUserMedia(
    	{
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream);
}

function togglePlayback() {
    if (isPlaying) {
        //stop playing and return
        sourceNode.stop( 0 );
        sourceNode = null;
        analyser = null;
        isPlaying = false;
		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
        window.cancelAnimationFrame( rafID );
        return "start";
    }

    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = theBuffer;
    sourceNode.loop = true;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode.connect( analyser );
    analyser.connect( audioContext.destination );
    sourceNode.start( 0 );
    isPlaying = true;
    isLiveInput = false;
    updatePitch();

    return "stop";
}

var rafID = null;
var tracks = null;
var buflen = 1024;
var buf = new Float32Array( buflen );

var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteFromPitch( frequency ) {
	var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
	return Math.round( noteNum ) + 69;
}

function frequencyFromNoteNumber( note ) {
	return 440 * Math.pow(2,(note-69)/12);
}

function centsOffFromPitch( frequency, note ) {
	return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note ))/Math.log(2) );
}

// this is a float version of the algorithm below - but it's not currently used.
/*
function autoCorrelateFloat( buf, sampleRate ) {
	var MIN_SAMPLES = 4;	// corresponds to an 11kHz signal
	var MAX_SAMPLES = 1000; // corresponds to a 44Hz signal
	var SIZE = 1000;
	var best_offset = -1;
	var best_correlation = 0;
	var rms = 0;

	if (buf.length < (SIZE + MAX_SAMPLES - MIN_SAMPLES))
		return -1;  // Not enough data

	for (var i=0;i<SIZE;i++)
		rms += buf[i]*buf[i];
	rms = Math.sqrt(rms/SIZE);

	for (var offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
		var correlation = 0;

		for (var i=0; i<SIZE; i++) {
			correlation += Math.abs(buf[i]-buf[i+offset]);
		}
		correlation = 1 - (correlation/SIZE);
		if (correlation > best_correlation) {
			best_correlation = correlation;
			best_offset = offset;
		}
	}
	if ((rms>0.1)&&(best_correlation > 0.1)) {
		console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")");
	}
//	var best_frequency = sampleRate/best_offset;
}
*/

var MIN_SAMPLES = 0;  // will be initialized when AudioContext is created.

function autoCorrelate( buf, sampleRate ) {
	var SIZE = buf.length;
	var MAX_SAMPLES = Math.floor(SIZE/2);
	var best_offset = -1;
	var best_correlation = 0;
	var rms = 0;
	var foundGoodCorrelation = false;
	var correlations = new Array(MAX_SAMPLES);

	for (var i=0;i<SIZE;i++) {
		var val = buf[i];
		rms += val*val;
	}
	rms = Math.sqrt(rms/SIZE);
	if (rms<0.01) // not enough signal
		return -1;

	var lastCorrelation=1;
	for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
		var correlation = 0;

		for (var i=0; i<MAX_SAMPLES; i++) {
			correlation += Math.abs((buf[i])-(buf[i+offset]));
		}
		correlation = 1 - (correlation/MAX_SAMPLES);
		correlations[offset] = correlation; // store it, for the tweaking we need to do below.
		if ((correlation>0.9) && (correlation > lastCorrelation)) {
			foundGoodCorrelation = true;
			if (correlation > best_correlation) {
				best_correlation = correlation;
				best_offset = offset;
			}
		} else if (foundGoodCorrelation) {
			// short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
			// Now we need to tweak the offset - by interpolating between the values to the left and right of the
			// best offset, and shifting it a bit.  This is complex, and HACKY in this code (happy to take PRs!) -
			// we need to do a curve fit on correlations[] around best_offset in order to better determine precise
			// (anti-aliased) offset.

			// we know best_offset >=1, 
			// since foundGoodCorrelation cannot go to true until the second pass (offset=1), and 
			// we can't drop into this clause until the following pass (else if).
			var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];  
			return sampleRate/(best_offset+(8*shift));
		}
		lastCorrelation = correlation;
	}
	if (best_correlation > 0.01) {
		// console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
		return sampleRate/best_offset;
	}
	return -1;
//	var best_frequency = sampleRate/best_offset;
}

function updatePitch( time ) {
	var cycles = new Array;
	analyser.getFloatTimeDomainData( buf );
	var ac = autoCorrelate( buf, audioContext.sampleRate );

	var myDataArray = new Float32Array(analyser.frequencyBinCount); // Float32Array should be the same length as the frequencyBinCount 
	analyser.getFloatFrequencyData(myDataArray);
	buf2=[]
	for (i=0;i<buf.length;i++) buf2[i]=buf[i]*10000;
	frequencies = buf2;

	currentNote = false;
	middlePitch = false;


 	if (ac == -1) {
		lastPitches = [];
 	} else {
	 	// detectorElem.className = "confident";
	 	pitch = ac;
	 	// pitchElem.innerText = Math.round( pitch ) ;

	 	lastPitches.push(pitch);

	 	if (lastPitches.length>pitchesFactorCount) {
	 		lastPitches.shift();

	 		lastPitches.sort(function(a, b) {
	 			if (a<b) return -1;
	 			else if (a>b) return 1;
	 			return 0;
	 		});


	 		middlePitch = lastPitches[pitchMiddle];

	 		var note =  noteFromPitch( middlePitch );
		 	console.log(noteStrings[note%12]);
			// noteElem.innerHTML = noteStrings[note%12];
			currentNote = noteStrings[note%12];
			var detune = centsOffFromPitch( pitch, note );
	 	}
	}
	

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = window.webkitRequestAnimationFrame;
	rafID = window.requestAnimationFrame( updatePitch );
}