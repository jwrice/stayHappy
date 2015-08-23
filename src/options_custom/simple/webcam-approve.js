navigator.getUserMedia = navigator.getUserMedia || 
										navigator.webkitGetUserMedia ||
										navigator.mozGetUserMedia || 
										navigator.msGetUserMedia || 
										navigator.oGetUserMedia;

var video
navigator.getUserMedia({video: true}, function(stream){}, function(){return});

video.pause();