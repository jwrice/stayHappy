
var happyUnits = 0 // this is the counter for the amount of "happy" the user has logged in the popup
var vid = document.getElementById('videoel');

var overlay = document.getElementById('overlay');
var overlayCC = overlay.getContext('2d');

var vidchop = document.getElementById('videochop');
var overlaychop = vidchop.getContext('2d')

// check camera and setup video

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// check for camerasupport
if (navigator.getUserMedia) {
	// set up stream
	var videoSelector = {video : true};
	if (window.navigator.appVersion.match(/Chrome\/(.*?) /)) {
		var chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
		if (chromeVersion < 20) {
			videoSelector = "video";
		}
	};

	navigator.getUserMedia(videoSelector, function( stream ) {
		if (vid.mozCaptureStream) {
			vid.mozSrcObject = stream;
		} else {
			vid.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
		}
		vid.play();
	}, function() {
		//insertAltVideo(vid);
		alert("There was some problem trying to fetch video from your webcam. If you have a webcam, please make sure to accept when the browser asks for access to your webcam.");
	});
} else {
	//insertAltVideo(vid);
	alert("This demo depends on getUserMedia, which your browser does not seem to support. :(");
}

// emotion detection setup

var ctrack = new clm.tracker({useWebGL : true});
ctrack.init(pModel);

function startVideo() {
	// start video
	vid.play();
	// start tracking
	ctrack.start(vid);
	// start loop to draw face
	drawLoop();
}

var currentPosition

function drawLoop() {
	
	requestAnimFrame(drawLoop);
	overlayCC.clearRect(0, 0, 400, 400);
	overlaychop.clearRect(0, 0, 200, 200)
	
	currentPosition = ctrack.getCurrentPosition();
	
	function findMinMax(bigArr) {
		var xmin = 400, xmax = 0, ymin = 400, ymax = 0, deltx, delty;
		bigArr.forEach(function(smArr){
			if (smArr[0]<xmin) xmin = smArr[0]
			if (smArr[1]<ymin) ymin = smArr[1]
			if (smArr[0]>xmax) xmax = smArr[0]
			if (smArr[1]>ymax) ymax = smArr[1]
		})
		deltx = xmax-xmin
		delty = ymax-ymin
		// console.log('xm', xmin, 'ym', ymin, 'dx', deltx, 'dy', delty)
		return [xmin-10, ymin-50, deltx+20, delty+50]
	}
	var drawInputs = findMinMax(currentPosition)
	var x = (100-(drawInputs[2]/2))
	// var y = (300-drawInputs[3])*2/3
	var y =10
	var w = (drawInputs[2])
	var h = (drawInputs[3])
	var r = 10
	// old code for finessing the overlay into a smaller window. it proved cumbersome
	// overlaychop.save()
	// 	overlaychop.beginPath();
	//   	overlaychop.moveTo(x + r, y);
	//   	overlaychop.lineTo(x + w - r, y);
	//   	overlaychop.quadraticCurveTo(x + w, y, x + w, y + r);
	//   	overlaychop.lineTo(x + w, y + h - r);
	//   	overlaychop.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	//   	overlaychop.lineTo(x + r, y + h);
	//   	overlaychop.quadraticCurveTo(x, y + h, x, y + h - r);
	//   	overlaychop.lineTo(x, y + r);
	//   	overlaychop.quadraticCurveTo(x, y, x + r, y);
	//   	overlaychop.closePath();
 //  			overlaychop.clip()
	overlaychop.drawImage(vid,
		// (drawInputs[0])*640/400,
		// (drawInputs[1])*480/300,
		// (drawInputs[2])*640/400,
		// (drawInputs[3])*480/300,
		240,
		140,
		(200)*640/400,
		(200)*480/300,
		0,0, // destination x, y
		200,200  // destination width, height
		)
	overlaychop.restore()
	

	if (currentPosition) {
		ctrack.draw(overlay);
	}
	var cp = ctrack.getCurrentParameters();
	
	var er = ec.meanPredict(cp);
	if (er) {
		updateData(er);
		for (var i = 0;i < er.length;i++) {
			if (er[i].value > 0.4 && i !== 3) {
				document.getElementById('icon'+(i+1)).style.visibility = 'visible';
			} else {
				document.getElementById('icon'+(i+1)).style.visibility = 'hidden';
			}
			if (i==3){
				if (er[3].value > .4){
					happyUnits = happyUnits + .35
					if (happyUnits > 100) {
						chrome.extension.sendRequest(
							{action: "allowBrowsing",},
							function(response) {
								console.log('reset request sent to background.js')
								happyUnits = 0
							});
					}

				} else {
					happyUnits = 0
					document.getElementById('progress_bar').style.width = ""+ 0 +"%"
				}
				if (happyUnits > 0){
					var barUnits = happyUnits*3
					document.getElementById('progress_bar').style.width = ""+ barUnits +"%"
				} else {document.getElementById('happy_container').innerHTML = ""}
				
			}
		}
	}
}

var ec = new emotionClassifier();
ec.init(emotionModel);
var emotionData = ec.getBlank();
emotionData = [emotionData[1],emotionData[3]]
var margin = {top : 20, right : 20, bottom : 10, left : 40},
	width = 400 - margin.left - margin.right,
	height = 100 - margin.top - margin.bottom;

var barWidth = 30;

var formatPercent = d3.format(".0%");

var x = d3.scale.linear()
	.domain([0, 3]).range([margin.left, width+margin.left]);

var y = d3.scale.linear()
	.domain([0,1]).range([0, height]);

var svg = d3.select("#emotion_chart").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)

svg.selectAll("rect").
  data(emotionData).
  enter().
  append("svg:rect").
  attr("x", function(datum, index) { return x(index); }).
  attr("y", function(datum) { return height - y(datum.value); }).
  attr("height", function(datum) { return y(datum.value); }).
  attr("width", barWidth).
  attr("fill", "#2d578b");

svg.selectAll("text.labels").
  data(emotionData).
  enter().
  append("svg:text").
  attr("x", function(datum, index) { return x(index) + barWidth; }).
  attr("y", function(datum) { return height - y(datum.value); }).
  attr("dx", -barWidth/2).
  attr("dy", "1.2em").
  attr("text-anchor", "middle").
  text(function(datum) { return datum.value;}).
  attr("fill", "white").
  attr("class", "labels");

svg.selectAll("text.yAxis").
  data(emotionData).
  enter().append("svg:text").
  attr("x", function(datum, index) { return x(index) + barWidth; }).
  attr("y", height).
  attr("dx", -barWidth/2).
  attr("text-anchor", "middle").
  attr("style", "font-size: 12").
  text(function(datum) { return datum.emotion;}).
  attr("transform", "translate(0, 18)").
  attr("class", "yAxis");

function updateData(data) {
	// update
	data = [data[1],data[3]]
	var rects = svg.selectAll("rect")
		.data(data)
		.attr("y", function(datum) { return height - y(datum.value); })
		.attr("height", function(datum) { return y(datum.value); });
	var texts = svg.selectAll("text.labels")
		.data(data)
		.attr("y", function(datum) { return height - y(datum.value); })
		.text(function(datum) { return datum.value.toFixed(1);});					
	// enter
	// console.log(data[0].emotion, data[0].value, data[1].emotion, data[1].value, data[2].emotion, data[2].value, data[3].emotion, data[3].value)
	rects.enter().append("svg:rect");
	texts.enter().append("svg:text");

	// exit
	rects.exit().remove();
	texts.exit().remove();
}

var seconds_left = 4;
setInterval(function() {
    document.getElementById('happy_container').innerHTML = "countdown: " + --seconds_left + " seconds - ready to smile?";

    if (seconds_left <= 0)
    {
        document.getElementById('happy_container').innerHTML = '';
        clearInterval();
    }
}, 1000)

setTimeout(startVideo, 4000);

// toggle buttons to show model, face, and emotion graph elements in the pop up
var toggleModel = function(){
	var model = document.getElementById("container")
	if (model.style.display == ''){
		model.style.display = 'none'
	} else {
		model.style.display = ''
	}
}

var toggleFace = function(){
	var face = document.getElementById("videochop")
	if (face.style.display == ''){
		face.style.display = 'none'
	} else {
		face.style.display = ''
	}
}

var toggleEmotions = function(){
	var emotions = document.getElementById("emotion_chart")
	if (emotions.style.display == ''){
		emotions.style.display = 'none'
	} else {
		emotions.style.display = ''
	}
}

// listeners for click events

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("modelButton").addEventListener("click", toggleModel);
  document.getElementById("faceButton").addEventListener("click", toggleFace); 
  document.getElementById("emotionButton").addEventListener("click", toggleEmotions); 
});
