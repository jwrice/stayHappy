// this script requests access to the webcam, which then allows the browser popup to access the webcam
// chrome does not allow chrome extensions to access the webcam - so getting approval in the options page is sort of a hack to get around that
navigator.getUserMedia = navigator.getUserMedia || 
										navigator.webkitGetUserMedia ||
										navigator.mozGetUserMedia || 
										navigator.msGetUserMedia || 
										navigator.oGetUserMedia;

var video
navigator.getUserMedia({video: true}, function(stream){}, function(){return});

video.pause();