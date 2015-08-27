var currentSite = null;
var currentTabId = null;
var startTime = null; // beginning of interval

var updateInterval = 1000 * 3; // 3 seconds - how frequently the bg page updates

var badUrls = []

var URLRegEx = /^(\w+:\/\/[^\/]+).*$/;

function getSiteFromUrl(url) {
	// gets the key part of the URL from a site
  var match = url.match(URLRegEx)[1].split("//")[1]
  if (match) {
    // if match found, checks match against the ignore list
    badSites = localStorage.badSites;
    if (!badSites) {
    	// if empty, creates ignoredSites
      badSites = [];
    } else {
    	// if exists, parse for reading
      badSites = JSON.parse(badSites);
    }
    for (i in badSites) {
    	// loop through to check each bad site for a match
      if (badSites[i] == match[1]) {
      	// if match found
        console.log("Uh oh, this site is on your bad list: " + match);
        // console that site is on ignore list and say what site
        return null;
        // return from loop early
      }
    }
    return match;
    // return matched url if the regex works, but not found in badSites
  }
  return null;
  // return nothing if regex fails
}

function isUserIdle(newState) {
  console.log("Checking idle behavior " + newState);
  // check the updated state against idle, locked, paused conditions
  if ((newState == "idle" || newState == "locked") &&
      localStorage.paused == "false") {
  	// if user has gone idle or machine is locked, and localStorage paused prop set as false, run pause() to set paused as true
    pause();
  } else if (newState == "active") {
  	// if user state is now active, run resume() which starts timer again
    resume();
  }
}

function pause() {
  console.log("Pause timer");
  localStorage.paused = "true";
  chrome.browserAction.setIcon({path: 'images/icon_paused.png'});
  // set new icon
}

function resume() {
  console.log("Resume timer");
  localStorage.paused = "false";
  // turn off paused
  chrome.browserAction.setIcon({path: 'images/icon.png'});
  // set new icon
}

function updateCounter() {
  // if currently paused, set currentSite as null and just return
  if (localStorage.paused == "true") {
    currentSite = null;
    return;
  }

  if (currentTabId == null) {
  	// if currentTabId has not been set, just return
    return;
  }

  chrome.tabs.get(currentTabId, function(tab) {
    // return tab with various properties
    chrome.windows.get(tab.windowId, function(window) {
      if (!window.focused) {
      	// if the window is not focused, ignore it
        return;
      }
      var site = getSiteFromUrl(tab.url);
      	// set variable site == regex match to the tab url
      if (site == null) {
      	// if regex returns null (because url is either bad, or site was on ignore list)
        return;
      }

      if (currentSite == null) {
      	// if site exists and currentSite doesn't exist, set as site
        currentSite = site;
        startTime = new Date();
        // set startTime as current Date and "start"
        return;
      }

      // so if window is focused, site exists, and currentSite exists (meaning this is a second loop on updateCounter) then do counting functions
      var now = new Date();
      // current time
      var delta = now.getTime() - startTime.getTime();
      // difference between currentTime and startTime (set in previous loop) in milliseconds
      if (delta < updateInterval*1.5) {
      	// if delta smaller than the interval, updateTime with site and time passed - typical interval is 60 sec or 1 min
        updateTime(currentSite, delta/1000);
        // adds number of seconds to currentSite record
      } else {
      	// if delta is too big (browser shutdown, etc) ignore
      }
      currentSite = site;
      // keep currentSite as site
      startTime = now;
      // reset startTime for timer to right now, ending loop
    });
  });
}

function addSite(site){
  console.log("Adding" + site)
  site = getSiteFromUrl(site);
  if (!site) {
    // regex match confirmation before moving forward
    return
  }

  badSites = localStorage.badSites
  if (!badSites) {
    badSites = []
  } else {
    badSites = JSON.parse(badSites)
    // pull site watchlist from localstorage
  }
  
  badSites.push(site)
  // add site to watchlist
  localStorage.badSites = JSON.stringify(badSites)
  // push watchlist back in
}

function removeSite(site){
	site = getSiteFromUrl(site);
	if (!site) {
    // regex match confirmation before moving forward
		return
	}
	badSites = JSON.parse(localStorage.badSites)
	// pull site watchlist from localstorage
	var index = badSites.indexOf(site)
  if (index > -1) {
    badSites.splice(index,1);
  }
	// delete site from watchlist
	localStorage.badSites = JSON.stringify(badSites)
	// push watchlist back in
}

function updateTime(site, seconds) {
  var badThreshold = parseInt(localStorage.badThreshold, 10)
  var badTimer = parseInt(localStorage.badTimer, 10)
	badSites = JSON.parse(localStorage.badSites)
	// pull site watchlist from localstorage
	if (badSites.indexOf(site) < 0){
		// if site doesnt exist in badSites
		return
    // ignore
	}
  console.log('Oh FUCK dude, youre in dangerous site territory and ' + seconds + ' seconds have passed')
	badTimer = badTimer + seconds
	// add seconds incrementer (from delta/1000) to timer
	localStorage.badTimer = badTimer
  console.log('There are ' + badTimer/60 + ' minutes on your bad timer, against a threshold of ' + badThreshold/60)
	// push timer back in
  if (badTimer > badThreshold){
<<<<<<< HEAD
    chrome.browserAction.setIcon({path: "icons/sadicon16.png"}, function(){
          console.log('in callback')
          alert('Uh oh! You are out of time. Go log some happy')
        });
=======
    alert('Uh oh! You are out of time. Go log some happy')
>>>>>>> 9175b1c9f9d708a2976bbccf5496d4529bce1688

  }
}

function logHappiness(){

}

function blockBrowsing(){
  localStorage.allowedToBrowse = "false"
}

function initialize(){
  if (!localStorage.badTimer) {
    localStorage.badTimer = 0
  }

  if (!localStorage.allowedToBrowse) {
    localStorage.allowedToBrowse = "true"
  }

  if (!localStorage.badThreshold) {
    localStorage.badThreshold = 1800
  }

	if (!localStorage.badSites){
		localStorage.badSites = JSON.stringify([])
		//open 'er up
	}

	if (!localStorage.paused) {
		localStorage.paused = "false";
		// create paused property and set to false
	}

	if (localStorage.paused == "true") {
		pause()
		// if pause property exists and set to true, run pause again to set icon properly
	}

	if (!localStorage.idleDetection) {
		// create idleDetection property and set to true
		localStorage.idleDetection = "true";
	}

	//setting listeners for tab, window, url changes
	chrome.tabs.onActivated.addListener(
	  function(activeTab) {
      if (localStorage.allowedToBrowse == "false"){
        alert('Please log happiness units to get rid of this alert')
        return
      }
	    currentTabId = activeTab.tabId;
	    updateCounter();
  });

	chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab) {
    if (localStorage.allowedToBrowse == "false"){
      alert('Please log happiness units to get rid of this alert')
      return
    }
    if (tabId == currentTabId) {
      updateCounter();
    }
  });

	chrome.windows.onFocusChanged.addListener(
	  function(windowId) {
      if (localStorage.allowedToBrowse == "false"){
        alert('Please log happiness units to get rid of this alert')
        chrome.browserAction.setIcon({path: "icons/sadicon16.png"}, function(){
          console.log('in callback')
        });
        return
      }
	    var queryInfo = {
	    	'lastFocusedWindow': true,
	    	'active': true
	    }
	    chrome.tabs.query(queryInfo,
  	    function(tab) {
  	      currentTabId = tab[0].id;
  	      updateCounter();
  		});
	});

  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
      if (request.action == "allowBrowsing") {
        // alert('Good job! You can now browse again.')
        chrome.browserAction.setIcon({path: "icons/happyicon16.png"}, function(){
          console.log('in callback')
        });
      }
  })

  // setting listeners for requests
  // chrome.webRequest.onBeforeRequest.addListener(function(details){
  //   console.log('intercepted'+details.url.split(".")[1])
  //   var badUrls = []
  //   for (i=0; i<badSites.length; i++){
  //     badUrls[i] = ""
  //     badUrls[i] = "*//"+badSites[i]+"/*"
  //   }
  //   console.log(badUrls)
  //   // if (details.url.split(".")[1] != "scientificamerican"){
  //   return {
  //     redirectUrl: 'http://www.scientificamerican.com/article/smile-it-could-make-you-happier/'}
      
  //   },
  //   {
  //     urls: badUrls
  //   },
  //   ['blocking'])

  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
      if (request.action == "allowBrowsing") {
        alert('Good job! You can now browse again.')
        localStorage.allowedToBrowse = "true"
        localStorage.badTimer = 0
        sendResponse({});
      } else if (request.action == "addSite") {
        addSite(request.site)
        sendResponse({});
      } else if (request.action == "pause") {
        pause();
      } else if (request.action == "resume") {
        resume();
      } else {
        console.log("Invalid action given.");
      }
  });

  window.setInterval(updateCounter, updateInterval)

  // Keep track of idle time - starting value 60 sec
  chrome.idle.queryState(60, isUserIdle);
  chrome.idle.onStateChanged.addListener(isUserIdle);
  chrome.tabs.create({ url: "options/options.html" });

}

initialize()