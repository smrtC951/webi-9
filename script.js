const butt = document.getElementById("butt");
const pageBody = document.getElementById("body");
const addressBar = document.getElementById("addressBar");

// navbars
const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");
const reloadBtn = document.getElementById("reloadBtn");
const otherBtn = document.getElementById("otherBtn");

// values
let history = [];
let historyIndex = -1;

// them pages
const pageHTML = {
	// example site
	'example.com':`
		<h1>Example page</h1>
		<p>This page is for example pages.</p>
	`,
	// webi homepage
	'webi:home':`
		<div style="padding: 10px;">
			<h1 style="color: #03a1fc;">Webi 9</h1>
			<p>Welcome to Webi 9; an intranet browser! Elements from an earlier project of mine (FExplorer) will be in here!</p>
			<h2>What is Webi 9?</h2>
			<p>Webi 9 is an intranet browser which allows you to experience freedom! It will have a currency similar to how Microsoft Rewards work!</p>
			<h2>Hyperlinks</h2>
			<button data-url="webi:search">Search Engine</button>
			<button data-url="webi:games">Games</button>
			<button data-url="webi:updates">Updates</button>
			<hr>
			<button id="butt">Click me!</button>
	`,
	'webi:updates':`
		<div style="padding: 10px;">
			<h1>Updates to Webi 9</h1>
			<p>Webi calculates updates using "9.X" for major updates, and "9.X.Y" for minor ones.</p>
			<hr>
			<p>No updates yet..</p>
			<br>
			<button data-url="webi:home">Home</button>
		</div>
	`,
	'webi:settings':`
		<div style="padding: 10px;">
			<h1>Settings</h1>
			<p>Change your prefrences!</p>
			<hr>
			<a href="#" data-url="webi:home">Return home</a>
		</div>
	`,
	'webi:terminal':`
		<p>test</p>
	`,
	'webi:search':`
		<div style="padding: 5px;">
			<img src="logo.png" style="height: 50px; width: 150px;">
			<br>
			<input type="search" id="webiSearchBar" placeholder="Search the intranet.." class="webiSearchBox">
			<button id="webiSearchBtn" class="button">Search!</button>
		</div>
	`,
}

// load functions and/or procedures
function getContentFromURL(sanitizedURL) {
	return pageHTML[sanitizedURL] || null;
}

function loadPage(urlToLoad) {
	const sanitizedURL = urlToLoad.toLowerCase().trim();
	const content = getContentFromURL(sanitizedURL);
	
	if (!pageBody || !addressBar) {
		console.error("required HTML elements are missing!");
		return;
	}
	addressBar.value = sanitizedURL;
	
	pageBody.innerHTML = `
	<div style="padding: 10px;">
		<p>Loading ${sanitizedURL}...</p>
	</div>
	`;
	setTimeout(() => {
		if (content !== null) {
			pageBody.innerHTML = content;
		} else {
			pageBody.innerHTML = `
			<div style="padding: 10px;">
				<h1>Page not found</h1>
				<p>Webi 9 cannot find the site "${sanitizedURL}".</p>
				<hr>
				<button data-url="webi:home">Home</button>
			</div>
		`;
	}
	}, 250);
}

// navbar exclusive function
function navigate(url) {
	const sanitizedURL = url.toLowerCase().trim();
	if (history[historyIndex] === sanitizedURL) {
		loadPage(sanitizedURL);
		updateNavButt();
		return;
	}
	history = history.slice(0, historyIndex + 1);
	history.push(sanitizedURL);
	historyIndex = history.length - 1;
	updateNavButt();
	loadPage(sanitizedURL);
}

// page-based events
function attachDyamicEventListeners() {
	pageBody.addEventListener("click", function(event) {
		const element = event.target.closest("[data-url]");
		if (!element || !pageBody.contains(element)) {
			return;
		}
		event.preventDefault();
		const url = element.dataset.url;
		if (url) {
			navigate(url);
		}
	});
};

pageBody.addEventListener("click", function(event) {
	if (event.target.id === "butt") {
		alert("hello!");
	};
});

// navbar events
addressBar.addEventListener("keydown", function(event) {
	if (event.key === "Enter") {
		navigate(addressBar.value);
	};
});

function updateNavButt() {
    backBtn.disabled = historyIndex <= 0;
    forwardBtn.disabled = historyIndex >= history.length - 1;
}

backBtn.addEventListener("click", function() {
	if (historyIndex > 0) {
		historyIndex--;
		updateNavButt();
		loadPage(history[historyIndex]);
	}
});

forwardBtn.addEventListener("click", function() {
	if (historyIndex < history.length - 1) {
		historyIndex++;
		updateNavButt();
		loadPage(history[historyIndex]);
	}
});

reloadBtn.addEventListener("click", function() {
	if (historyIndex >= 0) {
		loadPage(history[historyIndex]);
	}
});

// main initialize
attachDyamicEventListeners();
window.addEventListener("load", function() {
	navigate("webi:home");
});