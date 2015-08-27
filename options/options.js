
$(document).ready(function(){

	$('#add_site_button').on('click', function(){
		addSite()
	})

	$('#remove_sites_button').on('click', function(){
		removeSites()
	})

	$('#update_interval').change(function(){
		updateInterval()
	})

	loadLocalStorage()

});

function addSite() {
	var newSite = document.getElementById("new_bad_site").value;
	if (newSite.indexOf("http://") != 0 &&
		newSite.indexOf("https://") != 0) {
		alert("Include http:// or https:// prefix.");
	return;
	}

	chrome.extension.sendRequest(
		{action: "addSite", site: newSite},
		function(response) {
			loadLocalStorage();
		});
	document.getElementById("new_bad_site").value = ""
}

function removeSites() {
	var select = document.getElementById("bad_sites");
	var newBadSites = []
	for (var i = 0; i < select.children.length; i++) {
		var child = select.children[i];
		if (child.selected == false) {
			newBadSites.push(child.value);
		}
	}
	localStorage.badSites = JSON.stringify(newBadSites)
	loadLocalStorage()
}

function updateInterval(){
	var select = document.getElementById("update_interval")
	var option = select.options[select.selectedIndex];
	localStorage.badThreshold = option.value;
	loadLocalStorage()
}

function loadLocalStorage() {
	var badSites = localStorage.badSites;
	if (!badSites) {
	    return;
	}
	badSites = JSON.parse(badSites);
	var select = document.getElementById("bad_sites");
	select.options.length = 0;
	for (var i in badSites) {
		var option = document.createElement("option");
		option.text = badSites[i];
		option.value = badSites[i];
	    select.appendChild(option);
	}

	var badTimer = localStorage.badTimer;
	if (!badTimer) {
		badTimer = 0;
  	}
  	console.log('badTimer is '+badTimer)

  	var badThreshold = localStorage.badThreshold;
	if (!badThreshold) {
		badThreshold = 1800;
  	}

  	select = document.getElementById("update_interval");
  	for (var i = 0; i < select.options.length; i++) {
  		var option = select.options[i];
  		if (option.value == badThreshold) {
  			option.selected = true;
  			break;
  		}
  	}
}