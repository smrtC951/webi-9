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
let currentURL = null;
let pageStatus = null;
let bookmarks = loadData("webiBookmarks", []);
let visitedPages = loadData("webiHistory", []);
let currentWebiPoints = loadData("webiPoints", 0);
let activeNotif = [];
const maxNotif = 3;
// setting values
let navTheme = loadData("navTheme", "default");
let notifMode = loadData("notifMode", "default");
let browserTheme = loadData("browserTheme", "default");

// some notif stuff
let notificationContainer = document.getElementById("notificationContainer");

if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notificationContainer";
    document.body.appendChild(notificationContainer);
}

// localstorage stuff
function saveData(key, data) {
	try {
		localStorage.setItem(key, JSON.stringify(data));
		return true;
	} catch (error) {
		console.error("Webi cannot save data:", error);
		return false;
	}
}
function loadData(key, fallback) {
	try {
		const saved = localStorage.getItem(key);
		if (saved === null) {
			return fallback;
		}
		return JSON.parse(saved);
	} catch (error) {
		console.error("webi cannot load data: ", error);
		return fallback;
	}
}

// points stuff
function editPoints(amount) {
	currentWebiPoints = Math.max(0, currentWebiPoints + amount);
	saveData("webiPoints", currentWebiPoints);
	showNotifyUI("You received " + amount.toLocaleString() + " Webi Points!", "webiPoints");
}

// bookmark stuff
function getPageTitle(url) {
	const page = searchIndex.find(item => item.url === url);
	if (page) return page.title;
	return url;
}

function toggleBookmark() {
	const content = getContentFromURL(currentURL);
	if (!content) {
		showNotifyUI("Only webi intranet pages can be bookmarked.", "warning");
		return;
	}
	const url = parseWebiURL(currentURL).path;
	const existing = bookmarks.findIndex(item => item.url === url);
	
	if (existing !== -1 || !content) {
		bookmarks.splice(existing, 1);
		showNotifyUI("bookmark removed!", "notify");
	} else {
		bookmarks.push({
			title: getPageTitle(url),
			url: url
		});
		showNotifyUI("bookmark saved!", "notify");
	}
	saveData("webiBookmarks", bookmarks);
	updateBookmarkButton();
}

function updateBookmarkButton() {
	const button = document.getElementById("otherBtn");
	if (!button) return;
	const url = currentURL ? parseWebiURL(currentURL).path : "";
	const saved = bookmarks.some(item => item.url === url);
	button.textContent = saved ? "Bookmarked" : "Bookmark";
}

function renderBookmarks() {
    const container = document.getElementById("bookmarkList");
    if (!container) return;

    container.replaceChildren();

    if (bookmarks.length === 0) {
        container.textContent = "No bookmarks yet!";
        return;
    }

    bookmarks.forEach(function(item) {
        const row = document.createElement("p");

        const link = document.createElement("button");
        link.textContent = item.title;
        link.dataset.url = item.url;

        const remove = document.createElement("button");
        remove.textContent = "Remove";

        remove.addEventListener("click", function() {
            bookmarks = bookmarks.filter(
                saved => saved.url !== item.url
            );

            saveData("webiBookmarks", bookmarks);
            renderBookmarks();
            updateBookmarkButton();
			showNotifyUI(`Bookmark "${item.url}" was removed!`, "notify");
        });

        row.append(link, " ", remove);
        container.appendChild(row);
    });
}

// settings stuff
function applyTheme(theme) {
	if (theme !== "default" && theme !== "blue" && theme !== "red" && theme !== "aero") {
		theme = "default";
	}
	navTheme = theme;
	document.documentElement.dataset.theme = theme;
	saveData("navTheme", theme);
}

function applyBrowserTheme(theme) {
	if (!theme) {
		theme = "default";
	}
	browserTheme = theme;
	if (browserTheme === "dark") {
		document.documentElement.classList.toggle("dark-theme", browserTheme === "dark");
	} else {
		document.documentElement.classList.toggle("default-theme", browserTheme === "default");
	}
}

function applySetting(setting) {
	if (setting === "notif") {
		const modes = ["default", "alert", "none"];
		const currentIndex = modes.indexOf(notifMode);
	
		notifMode = modes[(currentIndex + 1) % modes.length];
		saveData("notifMode", notifMode);
		updateSettingsButton("notif");
		if (notifMode !== "none") {
			showNotifyUI(`Notification mode: ${notifMode}`, "notify");
		}
	} else if (setting === "browserTheme") {
		const themes = ["default", "dark"];
		const currentIndex = themes.indexOf(browserTheme);
		
		browserTheme = themes[(currentIndex + 1) % themes.length];
		saveData("browserTheme", browserTheme);
		updateSettingsButton("browserTheme");
		applyBrowserTheme(browserTheme);
		showNotifyUI(`Browser theme: ${browserTheme}`, "notify");
	}
};

function updateSettingsButton(setting) {
	if (setting === "notif") {
		const button = document.querySelector('[data-setting="notif"]');
		if (!button) return;

		const labels = {
			default: "Notification (Default)",
			alert: "Notification (Alert)",
			none: "Notification (None)"
		};

		button.textContent = labels[notifMode] || labels.default;
	} else if (setting === "browserTheme") {
		const button = document.querySelector('[data-setting="browserTheme"]');
		if (!button) return;
		
		const labels = {
			default: "Browser Theme (Default)",
			dark: "Browser Theme (Dark)",
		};
		button.textContent = labels[browserTheme] || labels.default;
	}
}

function setTheme(theme) {
	applyTheme(theme);
	showNotifyUI(`Theme changed to ${theme}!`, "notify");
}
applyTheme(navTheme);

// history indexes (localstorage)
function recordVisit(url) {
    const pagePath = parseWebiURL(url).path;
    if (
        visitedPages.length > 0 &&
        visitedPages[0].url === url
    ) {
        return;
    }
    visitedPages.unshift({
        title: getPageTitle(pagePath),
        url: url,
        visitedAt: new Date().toISOString()
    });
    visitedPages = visitedPages.slice(0, 100);
    saveData("webiHistory", visitedPages);
}

function renderHistory() {
    const container = document.getElementById("historyList");
    if (!container) return;

    container.replaceChildren();

    if (visitedPages.length === 0) {
        container.textContent = "No browsing history yet!";
        return;
    }

    visitedPages.forEach(function(item) {
        const row = document.createElement("p");

        const link = document.createElement("button");
        link.textContent = item.title;
        link.dataset.url = item.url;

        const date = document.createElement("small");
        date.textContent = " — " +
            new Date(item.visitedAt).toLocaleString();

        row.append(link, date);
        container.appendChild(row);
    });
}


// them search engine results
const searchIndex = [
{
	title: "Webi 9",
	url: "webi:home",
	desc: "Home page of Webi 9",
},
{
	title: "Webi Updates",
	url: "webi:updates",
	desc: "Check out updates for Webi 9!",
},
{
	title: "Webi Prefrences",
	url: "webi:settings",
	desc: "Change your prefrences!",
},
{
	title: "Webi Bookmarks",
	url: "webi:bookmarks",
	desc: "Save your pages in case you want to revisit it later!",
},
{
	title: "example.com",
	url: "example.com",
	desc: "example.com",
},
{
	title: "Webi Games",
	url: "webi:games",
	desc: "Play some games for fun!",
},
{
	title: "Webi Points",
	url: "webi:points",
	desc: "Get some points for other uses just by browsing Webi 9!",
},
]

// search engine functions/events
function searchWebi(query) {
	const cleanedQuery = query.trim().toLowerCase();
	if (!cleanedQuery) return [];
	
	const queryWords = cleanedQuery.split(/\s+/);
	return searchIndex
		.map(item => {
			const title = item.title.toLowerCase();
			const url = item.url.toLowerCase();
			const desc = item.desc.toLowerCase();
			
			let score = 0;
			
			if (title === cleanedQuery) {
				score += 100;
			} else if (title.startsWith(cleanedQuery)) {
				score += 60;
			} else if (title.includes(cleanedQuery)) {
				score += 40;
			}
			if (url.includes(cleanedQuery)) {
				score += 20;
			}
			if (desc.includes(cleanedQuery)) {
				score += 10;
			}
			
			for (const word of queryWords) {
				if (title.includes(word)) {
					score += 5;
				}
			}
			return { ...item, score };
		})
		.filter(item => item.score > 0)
		.sort((a, b) => b.score - a.score);
};

function renderSearchResults(query) {
	const resultsContainer = document.getElementById("searchResults");
	const queryText = document.getElementById("searchQueryText");
	const searchBar = document.getElementById("webiSearchBar");
	
	if (!resultsContainer || !queryText) return;
	
	queryText.textContent = `Search results for "${query}"`;
	if (searchBar) {
		searchBar.value = query;
	}
	
	const results = searchWebi(query);
	if (results.length === 0) {
		resultsContainer.textContent = "No results found. Try another search!";
		return;
	}
	resultsContainer.replaceChildren();
	
	results.forEach(function(result) {
		const resultDiv = document.createElement("div");
		const title = document.createElement("h2");
		const link = document.createElement("a");
		const desc = document.createElement("p");
		
		link.href = "#"
		title.textContent = result.title;
		link.textContent = result.url;
		link.dataset.url = result.url;
		
		desc.textContent = result.desc;
		resultDiv.appendChild(title);
		resultDiv.appendChild(link);
		resultDiv.appendChild(desc);
		resultDiv.appendChild(document.createElement("hr"));
		
		resultsContainer.appendChild(resultDiv);
	});
};

function parseWebiURL(url) {
    const questionMark = url.indexOf("?");
    const path = questionMark === -1 ? url : url.slice(0, questionMark);
    const queryString = questionMark === -1 ? "" : url.slice(questionMark + 1);

    return {
        path: path,
        params: new URLSearchParams(queryString)
    };
}

// them pages
const pageHTML = [
	{ // example site
		title: "example.com",
		url: "example.com",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<h1>Example page</h1>
			<p>This page is for example pages.</p>
		</div>
		`,
	},
	{ // bonus site
		title: "Bonus Site!",
		url: "bonus.com",
		favicon: null,
		searchable: false,
		innerHTML:`
		<div style="padding: 10px; background-color: #000000; height: 100vh; color: #ffffff;">
			<h1>Bonus Page!</h1>
			<p>You like bonuses, right? You found this secret page, so you deserve one!</p>
			<br>
			<button>Click me!</button>
		</div>
		`,
	},
	{ // home site
		title: "Webi 9",
		url: "webi:home",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<img src="img/logo.png" style="height: 50px; width: 150px;">
			<p>Welcome to Webi 9; an intranet browser! Elements from an earlier project of mine (FExplorer) will be in here!</p>
			<h2>What is Webi 9?</h2>
			<p>Webi 9 is an intranet browser which allows you to experience freedom! It will have a currency similar to how Microsoft Rewards work!</p>
			<h2>Hyperlinks</h2>
			<p>Some quick links to start your journey!</p>
			<button data-url="webi:search">Start Searching!</button>
			<button data-url="webi:games">Games</button>
			<button data-url="webi:updates">Updates</button>
			<button data-url="webi:bookmarks">Bookmarks</button>
			<button data-url="webi:settings">Settings</button>
			<hr>
			<p>Want to see some experiments? Click the button beside "Click me!"!</p>
			<button id="butt">Click me!</button>
			<button data-url="webi:experiment">Experiments</button>
		</div>
		`,
	},
	{ // updates site
		title: "Webi Updates",
		url: "webi:updates",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<h1>Updates to Webi 9</h1>
			<p>Webi calculates updates using the semantic versioning! View the Releases section on the GitHub repository page for earlier updates!</p>
			<hr>
			<h2>Version 0.2.0</h2>
			<h3>October 21, 2026</h3>
			<ul>
				<li>Added an Office game!</li>
				<li>Webi Points! - Where you can get points just from searching!</li>
				<li>Added new Settings options, bugged though.</li>
				<li>More experimental features! (only download works)</li>
				<li>Added Webi Workspace, with an unfinished presentation program!</li>
			</ul>
			<p>There will be a patch update but enjoy the update for now!</p>
			<br>
			<button data-url="webi:home">Home</button>
		</div>
		`,
	},
	{ // settings page
		title: "Webi Settings",
		url: "webi:settings",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<h1>Settings</h1>
			<p>Change your prefrences!</p>
			<hr>
			<h2>Personalization</h2>
			<h3>Navigation Color</h3>
			<p>Choose your navigation color:</p>
			<button data-theme="default">Default</button>
			<button data-theme="blue">Blue</button>
			<button data-theme="red">Red</button>
			<button data-theme="aero">Aero</button>
			<p id="currentTheme"></p>
			<h3>Browser Theme</h3>
			<p>Choose your browser theme</p>
			<button data-setting="browserTheme">Browser Theme (Default)</button>
			<hr>
			<h2>Display</h2>
			<h3>Visibility</h3>
			<p>Click on a button you want to modify their setting.</p>
			<button data-setting="notif">Notification (Default)</button>
			<hr>
			<button data-url="webi:home">Return Home</button>
		</div>
		`,
	},
	{ // terminal site
		title: "webi:terminal",
		url: "webi:terminal",
		favicon: null,
		searchable: false,
		innerHTML:`
		<div style="background-color: #000000; height: 100vh; font-family: Consolas; color: #00FF00; display: flex;">
			<p>WEBI TERMINAL // type "help" for commands</p>
		</div>
		`,
	},
	{ // webi search engine
		title: "Webi 9 Search!",
		url: "webi:search",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<img src="img/logo.png" style="height: 50px; width: 150px;">
			<br>
			<form id="webiSearchForm">
				<input type="search" id="webiSearchBar" placeholder="Search the intranet.." class="webiSearchBox">
				<button id="webiSearchBtn" type="submit">Search!</button>
			</form>
		</div>
		`,
	},
	{ // webi search engine results
		title: "Results",
		url: "webi:search/results",
		favicon: null,
		searchable: false,
		innerHTML:`
		<div style="padding: 10px;">
			<img src="img/logo.png" style="height: 25px; width: 70px;">
			<form id="webiSearchForm">
				<input type="search" id="webiSearchBar" placeholder="Search the intranet.." class="webiSearchBox">
				<button id="webiSearchBtn" type="submit">Search!</button>
			</form>
			<br>
			<p id="searchQueryText"></p>
			<div id="searchResults"></div>
		</div>
		`,
	},
	{ // experimental site
		title: "Webi Labs",
		url: "webi:experiment",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<h1>WEBI EXPERIMENT PAGE</h1>
			<p>Try out exclusive features that are in development and may be added in the future!</p>
			<hr>
			<h2>Interface</h2>
			<button data-lab="compact">Compact Notifications (Off)</button>
			<p>Make notifications compact and smaller!</p>
			<button id="downloadBtn">Download Button</button>
			<p>Experiment with downloading!</p>
			<hr>
			<h2>Customization</h2>
			<button data-lab="customNavBtn">Custom Navigation Button (Bookmarks)</button>
			<p>Customize your 5th navigation button! Currently it's the Bookmark button but you can change it to other things!</p>
		</div>
		`,
	},
	{ // bookmarks Site
		title: "Webi Bookmarks",
		url: "webi:bookmarks",
		favicon: null,
		searchable: true,
		innerHTML:`
	    <div style="padding: 10px;">
			<h1>Bookmarks</h1>
			<p>Your saved Webi sites.</p>
			<div id="bookmarkList"></div>
			<button data-url="webi:home">Home</button>
		</div>
		`,
	},
	{ // history Site
		title: "Webi History",
		url: "webi:history",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<h1>Browsing History</h1>
			<p>Your recently visited Webi pages.</p>
			<button id="clearHistoryBtn">Clear History</button>
			<div id="historyList"></div>
		</div>
		`,
	},
	{ // gamez site
		title: "Webi Games",
		url: "webi:games",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<h1>Webi Games</h1>
			<p>Play some cool games in Webi!</p>
			<h2>How does it work?</h2>
			<p>Basically there's a game box below the line, and you need to click the button below this text for the game box to start boxing!</p>
			<div id="gameDiv" style="visibility: visible; z-index: 1;">
				<button id="gameBtn" data-game="office">Work at an Office!</button>
			</div>
			<div id="exitDiv" style="visibility: hidden; z-index: 2;">
				<button id="exitBtn">Stop Playing</button>
			</div>
			<hr>
			<div id="gameBox" style="background-color: #f0f0f0; border: 1px solid var(--nav-bg); width: 50vh; height: 40vh;">
			</div>
		`,
	},
	{ // pointz site
		title: "Webi Points!",
		url: "webi:points",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<h1>Webi Points</h1>
			<p>Webi Points is a currency awarded for using Webi 9!</p>
			<hr>
			<p id="webiShow">If you're seeing this, the script probably broke.</p>
		</div>
		`,
	},
	{ // Webi Workspace Site
		title: "Webi Workspace",
		url: "webi:workspace",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<h1>Webi Workspace</h1>
			<p>Webi Workspace is a set of programs just for you to work well!</p>
			<hr>
			<button data-url="webi:workspace/slides">Webi Slides</button>
		</div>
		`,
	},
	{ // Webi Slides
		title: "Webi Slides",
		url: "webi:workspace/slides",
		favicon: null,
		searchable: true,
		innerHTML:`
		<div style="padding: 10px;">
			<div id="slidesMenu">
				<div id="mainProp">
					<button>Insert</button>
					<button>Draw</button>
					<button>Design</button>
					<button>Transition</button>
					<button>Animations</button>
					<button>Slide Show</button>
					<button>Developer</button>
					<button>Help</button>
				</div>
				<div id="propSlides">
					<button>1</button>
				</div>
			</div>
			<div id="slidesUI">
			
			</div>
		</div>
		`,
	},
]

// load functions and/or procedures
function getContentFromURL(sanitizedURL) {
	for (var i = 0; i < pageHTML.length; i++) {
		if (pageHTML[i].url === sanitizedURL) {
			return pageHTML[i].innerHTML;
		}
	}
	return null;
}

// load page function
function loadPage(urlToLoad) {
	const sanitizedURL = urlToLoad.toLowerCase().trim();
	const parsed = parseWebiURL(sanitizedURL);
	const pagePath = parsed.path;
	const content = getContentFromURL(pagePath);
	
	if (!pageBody || !addressBar) {
		console.error("required HTML elements are missing!");
		return;
	}
	addressBar.value = sanitizedURL;
	currentURL = sanitizedURL;
	pageBody.innerHTML = `
	<div style="padding: 10px;">
		<p>Loading ${pagePath}...</p>
	</div>
	`;
	setTimeout(() => {
		if (content !== null) {
			pageBody.innerHTML = content;
			editPoints(5);
		} else {
			pageBody.innerHTML = `
			<div style="padding: 10px;">
				<h1>Page not found</h1>
				<p>Webi 9 cannot find the site "${pagePath}".</p>
				<hr>
				<button data-url="webi:home">Home</button>
			</div>
		`;
		}
		if (pagePath === "webi:search/results") {
			const query = parsed.params.get("q") || "";
			renderSearchResults(query);
		}
		if (pagePath === "webi:bookmarks") {
			renderBookmarks();
		}
		if (pagePath === "webi:settings") {
			const label = document.getElementById("currentTheme");
			if (label) {
				label.textContent = "Current theme: " + navTheme;
			}
			updateSettingsButton();
		}
		if (pagePath === "webi:history") {
			renderHistory();
		}
		updateBookmarkButton();
		updatePointsNav();
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
	recordVisit(sanitizedURL);
	loadPage(sanitizedURL);
}

// notification function
let notifyTimeout;
function showNotifyUI(message, type) {
	if (notifMode === "none") return;
	if (notifMode === "alert") {
		alert(`${message}`);
		return;
	}
	if (activeNotif.length >= maxNotif) {
		return;
	}
	
	const notifyUI = document.createElement("div");
	notifyUI.id = `notifyUI-${Date.now()}-${Math.random()}`;
	const heading = document.createElement("h2");
	heading.id = "heading";
	const p = document.createElement("p");
	p.id = "p";
	p.innerText = message;
	
	if (type === "warning") {
		notifyUI.style.backgroundColor = "rgba(255,0,0,0.5)";
		heading.innerText = "Warning";
	} else if (type === "webiPoints") {
		notifyUI.style.backgroundColor = "rgba(3,161,252,0.5)";
		heading.innerText = "Webi Points";
	} else {
		
		heading.innerText = "Notification";
	}
	notifyUI.classList.add("notifyUI");
	notifyUI.appendChild(heading);
	notifyUI.appendChild(p);
	notificationContainer.appendChild(notifyUI);
	
	activeNotif.push(notifyUI);
	
	setTimeout(function() {
		notifyUI.remove();
		activeNotif = activeNotif.filter(
			notif => notif !== notifyUI
		);
	}, 5000);
}

// download function
function showDownloadUI(filename, amount) {
	let time = (Math.random(1, 10) * 2000);
	
	const downloadUI = document.createElement("div");
	downloadUI.id = `downloadUI`;
	const heading = document.createElement("h2");
	heading.id = "heading";
	heading.textContent = `Downloading ${filename}...`;
	const p = document.createElement("p");
	p.id = "p";
	p.textContent = `${amount} in ${(time / 1000)}`;
	
	downloadUI.appendChild(heading);
	downloadUI.appendChild(p);
	downloadUI.classList.add("downloadUI");
	notificationContainer.appendChild(downloadUI);
	setTimeout(function() {
		downloadUI.remove();
	}, time);
}

function information() {
	if (pageBody) {
		pageStatus = "safe";
	};
	if (currentURL.startsWith("webi:")) {
		pageStatus = "webi safe";
	};
	// check
	if (pageStatus === null) {
		alert("bruh");
	} else if (pageStatus === "unsafe") {
		alert("This is an unsafe site. Be cautious.");
	} else if (pageStatus === "safe") {
		alert("This is a safe site!");
	} else if (pageStatus === "webi safe") {
		alert("This is a Webi-verified safe site!");
	}
};

// game stuff :D
function officeGame() {
	let currentEmail = 0;
	let earnedPoints = 0;
	
	const gameBox = document.getElementById("gameBox");
	const emailText = document.createElement("p");
	const approveBtn = document.createElement("button");
	const deleteBtn = document.createElement("button");
	const jobBtn = document.createElement("button");
	const emails = [
	{
		type: "approve",
		email: "approve test",
	},
	{
		type: "delete",
		email: "scam",
	},
	{
		type: "approve",
		email: "approve this burger",
	},
	];
	
	approveBtn.textContent = "Approve";
	deleteBtn.textContent = "Delete";
	jobBtn.textContent = "Quit";
	
	gameBox.appendChild(emailText);
	gameBox.appendChild(approveBtn);
	gameBox.appendChild(deleteBtn);
	gameBox.appendChild(jobBtn);
	
	function showEmail() {
		emailText.textContent = emails[currentEmail].email;
	}
	function nextEmail() {
		currentEmail++;
		
		if (currentEmail >= emails.length) {
			emailText.textContent = "Work finished! Score: " + earnedPoints;
			approveBtn.disabled = true;
			deleteBtn.disabled = true;
			return;
		}
		showEmail();
	}
	
	approveBtn.onclick = function() {
		if (emails[currentEmail].type === "approve") {
			alert("email approved!");
			earnedPoints += 5;
		} else {
			alert("WRONG!!");
			earnedPoints -= 5;
		}
		nextEmail();
	};
	deleteBtn.onclick = function() {
		if (emails[currentEmail].type === "delete") {
			alert("email deleted!");
		} else {
			alert("WRONG!!");
			earnedPoints -= 5;
		}
		nextEmail();
	};
	jobBtn.onclick = function() {
		alert("you quit your job!");
		editPoints(earnedPoints);
		earnedPoints = 0;
	};
	
	showEmail();
}

function initGame(game) {
	const gameBox = document.getElementById("gameBox");	
	if (!game) return;
	
	const loadingTxt = document.createElement("p");
	loadingTxt.innerText = `Loading ${game}...`;
	gameBox.appendChild(loadingTxt);
	setTimeout(() => {
		if (game === "office") {
			loadingTxt.remove();
			officeGame();
		} else {
			loadingTxt.innerText = `${game}`;
		}
	}, 1200);
}
function stopGame() {
	const gameBox = document.getElementById("gameBox");
	const gameDiv = document.getElementById("gameDiv");
	if (gameDiv.style.visibility !== "hidden") {
		gameBox.replaceChildren();
	}
}

// points stuff 2: electric bogaloo
function updatePointsNav() {
	const pointsBtn = document.getElementById("pointsBtn");
	const webiShow = document.getElementById("webiShow");
	if (pointsBtn) {
		pointsBtn.textContent = `${currentWebiPoints.toLocaleString()} Webi Points`;
	}
	if (webiShow && pageBody && pageBody.contains(webiShow)) {
		if (currentWebiPoints < 0) {
			webiShow.textContent = `How are you in debt? You have ${currentWebiPoints.toLocaleString()} Webi Points.`;
		} else if (currentWebiPoints < 100) {
			webiShow.textContent = `You have ${currentWebiPoints.toLocaleString()} Webi Points. Save up!`;
		} else {
			webiShow.textContent = `You have ${currentWebiPoints.toLocaleString()} Webi Points.`;
		}
	}
};

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
// pagebody click
pageBody.addEventListener("click", function(event) {
	if (event.target.id === "butt") {
		alert("hello!");
	};
	if (currentURL !== null && currentURL === "webi:experiment") {
		if (event.target.id === "notifyBtn") {
			let input = prompt("what message do you want to convey?");
			if (input !== null) {
				showNotifyUI(input, "notify");
			} else if (input === "") {
				alert("you didn't enter anything!");
			} else {
				alert("you canceled the input");
			}
		}
		if (event.target.id === "downloadBtn") {
			showDownloadUI();
		}
	}
	if (currentURL !== null && currentURL === "webi:settings") {
		
		// theme setting
		const datathemeBtn = event.target.closest("[data-theme]");
		if (datathemeBtn && pageBody.contains(datathemeBtn)) {
			setTheme(datathemeBtn.dataset.theme);
			const label = document.getElementById("currentTheme");
			if (label) {
			label.textContent = "Current theme: " + navTheme;
			}
		}
		// other settings
		const settingBtn = event.target.closest("[data-setting]");
		if (settingBtn && pageBody.contains(settingBtn)) {
			applySetting(settingBtn.dataset.setting);
		}
	};
	if (currentURL !== null && currentURL === "webi:history") {
		if (event.target.id !== "clearHistoryBtn") return;

		visitedPages = [];
		saveData("webiHistory", []);
		renderHistory();

		showNotifyUI("Browsing history cleared!");
	};
	if (currentURL !== null && currentURL === "webi:games") {
		if (event.target.id !== "exitBtn") {
			const button = event.target.closest("[data-game]");
			if (!button) return;
		
			const gameDiv = document.getElementById("gameDiv");
			const exitDiv = document.getElementById("exitDiv");
			gameDiv.style.visibility = "hidden";
			exitDiv.style.visibility = "visible";
			const gameName = button.dataset.game;
			initGame(gameName);
		} else {
			const button = document.getElementById("exitBtn");
			if (!button) return;
			
			const gameDiv = document.getElementById("gameDiv");
			const exitDiv = document.getElementById("exitDiv");
			const gameBox = document.getElementById("gameBox");
			
			exitDiv.style.visibility = "hidden";
			gameDiv.style.visibility = "visible";
			stopGame();
		}
	}
});

// pagebody submit
pageBody.addEventListener("submit", function(event) {
	if (event.target.id !== "webiSearchForm") return;
	event.preventDefault();
	const input = document.getElementById("webiSearchBar");
	const query = input.value.trim();
	if (!query) return;
	navigate("webi:search/results?q=" + encodeURIComponent(query));
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

statusBtn.addEventListener("click", function() {
	information();
});

pointsBtn.addEventListener("click", function() {
	navigate("webi:points");
});

document.getElementById("otherBtn").addEventListener("click", toggleBookmark);

// main initialize
attachDyamicEventListeners();
window.addEventListener("load", function() {
	navigate("webi:home");
});