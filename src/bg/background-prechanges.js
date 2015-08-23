var currentSite = null;
var currentTabId = null;
var startTime = null;
var updateCounterInterval = 1000 * 60;

var siteRegexp = /^(\w+:\/\/[^\/]+).*$/;

function getSiteFromUrl(url) {
	// gets the key part of the URL from a site
  var match = url.match(siteRegexp);
  if (match) {
    // if match found, checks match against the ignore list
    var ignoredSites = localStorage["ignoredSites"];
    if (!ignoredSites) {
    	// if empty, creates ignoredSites
      ignoredSites = [];
    } else {
    	// if exists, parse data for reading
      ignoredSites = JSON.parse(ignoredSites);
    }
    for (i in ignoredSites) {
    	// loop through to check each ignoredSite
      if (ignoredSites[i] == match[1]) {
      	// if match found
        console.log("Site is on ignore list: " + match[1]);
        // console that site is on ignore list and say what site
        return null;
        // return from loop early
      }
    }
    return match[1];
    // return match (if it exists)
  }
  return null;
  // return nothing if match not found
}


function checkIdleTime(newState) {
  console.log("Checking idle behavior " + newState);
  // check some newState property against conditions
  if ((newState == "idle" || newState == "locked") &&
      localStorage["paused"] == "false") {
  	// if user is idle or locked, and localStorage prop paused not active, run pause()
    pause();
  } else if (newState == "active") {
  	// if user state is active, run resume() which starts timer again
  	// we could also check to see if current site is on badList before activating - && currentSite matches badList or whatever
    resume();
  }
}

function pause() {
  console.log("Pausing timer.");
  localStorage["paused"] = "true";
  chrome.browserAction.setIcon({path: 'images/icon_paused.png'});
  // set new icon
}

function resume() {
  console.log("Resume timer.");
  localStorage["paused"] = "false";
  // turn off paused
  chrome.browserAction.setIcon({path: 'images/icon.png'});
  // set new icon
}

function updateCounter() {
  // if paused, set currentSite as null and just return
  if (localStorage["paused"] == "true") {
    currentSite = null;
    return;
  }

  if (currentTabId == null) {
  	// if no tabs open? just return
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
        console.log("Bad url");
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
      if (delta < updateCounterInterval) {
      	// if delta smaller than the interval, updateTime with site and time passed - typical interval is 60 sec or 1 min
        updateTime(currentSite, delta/1000);
        // adds number of seconds to currentSite record
      } else {
      	// if delta is too big (browser shutdown, etc) ignore
        console.log("Delta of " + delta/1000 + " seconds too long; ignored.");
      }
      currentSite = site;
      // keep currentSite as site
      startTime = now;
      // reset startTime for timer to right now, ending loop
    });
  });
}

function resetStats(){
	localStorage.sites = JSON.stringify({})
	// reset "sites" storage
}

function addIgnoredSite(site) {
    console.log("Removing " + site);
    site = getSiteFromUrl(site);
    if (!site) {
      return;
    }
    var ignoredSites = localStorage.ignoredSites;
    if (!ignoredSites) {
      ignoredSites = [];
    } else {
      ignoredSites = JSON.parse(ignoredSites);
    }
    ignoredSites.push(site);
    localStorage.ignoredSites = JSON.stringify(ignoredSites);

    var sites = JSON.parse(localStorage.sites);
    delete sites[site];
    localStorage.sites = JSON.stringify(sites);
  }

function removeSite(site){
	console.log("Removing" + site)
	site = getSiteFromUrl(site);
	// regex match
	if (!site) {
		return
		// ignore if not found by regex
	}
	var sites = JSON.parse(localStorage.sites)
	// pull site watchlist from localstorage
	delete sites[site];
	// delete site from watchlist
	localStorage.sites = JSON.stringify(sites)
	// push watchlist back in
}

function updateTime(site, seconds) {
	var sites = JSON.parse(localStorage.sites)
	// pull site watchlist from localstorage
	if (!sites[site]){
		// if watchList property for site does not exist
		sites[site] = 0
		// set timer as zero
	}
	sites[site] = sites[site] + seconds
	// add seconds incrementer (from delta/1000) to site property on sites
	localStorage.sites = JSON.stringify(sites)
	// push watchlist and timer back in
}

function initialize(){
	if (!localStorage.sites){
		localStorage.sites = JSON.stringify({})
		//open 'er up
	}

	if (!localStorage.paused) {
		localStorage.paused = "false";
		// create paused property and set to false
	}

	if (localStorage["paused"] == "true") {
		pause()
		// if pause property exists and set to true, set to pause again?
	}

	if (!localStorage.idleDetection) {
		// create idleDetection property and set to true
		localStorage.idleDetection = "true";
	}

	//setting listeners
	chrome.tabs.onActivated.addListener(
	  function(activeTab) {
	    console.log("Tab changed");
	    currentTabId = activeTab.tabId;
	    updateCounter();
	  });

  	chrome.tabs.onUpdated.addListener(
	  function(tabId, changeInfo, tab) {
	    if (tabId == currentTabId) {
	      console.log("Tab updated");
	      updateCounter();
	    }
	  });

  	chrome.windows.onFocusChanged.addListener(
	  function(windowId) {
	    console.log("Detected window focus change");
	    var queryInfo = {
	    	'lastFocusedWindow': true
	    	'active': true
	    }
	    chrome.tabs.query(queryInfo,
	    function(tab) {
	      console.log("Window/Tab changed");
	      currentTabId = tab.id;
	      updateCounter();
		});
  	});

  chrome.browserAction.onClicked.addListener(function(tab) {
      sendStatistics();
    });

  /* Listen for update requests. These come from the popup. */
  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
      if (request.action == "sendStats") {
        console.log("Sending statistics by request.");
        sendStatistics();
        sendResponse({});
      } else if (request.action == "clearStats") {
        console.log("Clearing statistics by request.");
        clearStatistics();
        sendResponse({});
      } else if (request.action == "addIgnoredSite") {
        addIgnoredSite(request.site);
        sendResponse({});
      } else if (request.action == "pause") {
        pause();
      } else if (request.action == "resume") {
        resume();
      } else {
        console.log("Invalid action given.");
      }
    });

  /* Force an update of the counter every minute. Otherwise, the counter
     only updates for selection or URL changes. */
  window.setInterval(updateCounter, updateCounterInterval);

  /* Periodically check to see if we should be clearing stats. */
  window.setInterval(periodicClearStats, 60 * 1000);

  if (!localStorage["sendStatsInterval"]) {
    localStorage["sendStatsInterval"] = 3600 * 1000;
  }

  /* Default is to use local only storage. */
  // if (!localStorage["storageType"]) {
  //  localStorage["storageType"] = "local";
  // }
  localStorage["storageType"] = "local";

  // Keep track of idle time - starting value 60 sec
  chrome.idle.queryState(60, checkIdleTime);
  chrome.idle.onStateChanged.addListener(checkIdleTime);
}

initialize()