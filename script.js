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
let navTheme = loadData("navTheme", "default");
let visitedPages = loadData("webiHistory", []);

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
function loadData(key, fallback = null) {
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

// theme stuff
function applyTheme(theme) {
	if (theme !== "default" && theme !== "blue" && theme !== "red" && theme !== "aero") {
		theme = "default";
	}
	navTheme = theme;
	document.documentElement.dataset.theme = theme;
	saveData("navTheme", theme);
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
	const searchTerm = query.trim().toLowerCase();
	if (!searchTerm) {
		return [];
	}
	return searchIndex.filter(function(page) {
		return (
		page.title.toLowerCase().includes(searchTerm) ||
		page.url.toLowerCase().includes(searchTerm) ||
		page.desc.toLowerCase().includes(searchTerm)
		);
	});
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
const pageHTML = {
	// example site
	'example.com':`
		<div style="padding: 10px;">
			<h1>Example page</h1>
			<p>This page is for example pages.</p>
		</div>
	`,
	// bonus page!11
	'bonus.com':`
		<div style="padding: 10px; background-color: #000000; height: 100vh; color: #ffffff;">
			<h1>Bonus Page!</h1>
			<p>You like bonuses, right? You found this secret page, so you deserve one!</p>
			<br>
			<button>Click me!</button>
		</div>
	`,
	// webi pages
	'webi:home':`
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
			<hr>
			<p>Want to see some experiments? Click the button beside "Click me!"!</p>
			<button id="butt">Click me!</button>
			<button data-url="webi:experiment">Experiments</button>
		</div>
	`,
	'webi:updates':`
		<div style="padding: 10px;">
			<h1>Updates to Webi 9</h1>
			<p>Webi calculates updates using the semantic versioning! View the Updates folder on the GitHub repository for earlier updates!</p>
			<hr>
			<h2>Version 0.1.0</h2>
			<h3>October 17, 2026</h3>
			<ul>
				<li>Bookmark system!</li>
				<li>More advanced History!</li>
				<li>Settings is now functional and has some settings available to change!</li>
				<li>Navigation bar themes are now available!</li>
				<li>Some visual changes</li>
				<li>Search engine system is now added!</li>
			</ul>
			<br>
			<button data-url="webi:home">Home</button>
		</div>
	`,
	'webi:settings':`
		<div style="padding: 10px;">
			<h1>Settings</h1>
			<p>Change your prefrences!</p>
			<hr>
			<h2>Appearance</h2>
			<p>Choose your navigation color:</p>
			<button data-theme="default">Default</button>
			<button data-theme="blue">Blue</button>
			<button data-theme="red">Red</button>
			<button data-theme="aero">Aero</button>
			<p id="currentTheme"></p>
			<hr>
			<a href="#" data-url="webi:home">Return home</a>
		</div>
	`,
	'webi:terminal':`
		<div style="background-color: #000000; height: 100vh; font-family: Consolas; color: #00FF00; display: flex;">
			<p>WEBI TERMINAL // type "help" for commands</p>
		</div>
	`,
	'webi:search':`
		<div style="padding: 10px;">
			<img src="img/logo.png" style="height: 50px; width: 150px;">
			<br>
			<form id="webiSearchForm">
				<input type="search" id="webiSearchBar" placeholder="Search the intranet.." class="webiSearchBox">
				<button id="webiSearchBtn" type="submit">Search!</button>
			</form>
		</div>
	`,
	'webi:search/results':`
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
	'webi:experiment':`
		<div style="padding: 10px;">
			<h1>WEBI EXPERIMENT PAGE</h1>
			<p>This site is for experimental features only. Try them out!</p>
			<hr>
			<button id="notifyBtn">Notify Button</button>
			<button id="downloadBtn">Download Button</button>
		</div>
	`,
	'webi:bookmarks': `
    <div style="padding: 10px;">
        <h1>Bookmarks</h1>
        <p>Your saved Webi sites.</p>
        <div id="bookmarkList"></div>
        <button data-url="webi:home">Home</button>
    </div>
	`,
	'webi:history':`
		<div style="padding: 10px;">
			<h1>Browsing History</h1>
			<p>Your recently visited Webi pages.</p>
			<button id="clearHistoryBtn">Clear History</button>
			<div id="historyList"></div>
		</div>
	`,
	'webi:games':`
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
	'webi:points':`
		<div style="padding: 10px;">
			<h1>Webi Points</h1>
			<p>Webi Points is a currency awarded for using Webi 9!</p>
		</div>
	`,
}

// load functions and/or procedures
function getContentFromURL(sanitizedURL) {
	return pageHTML[sanitizedURL] || null;
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
		}
		if (pagePath === "webi:history") {
			renderHistory();
		}
		updateBookmarkButton();
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

// some other functions
function showNotifyUI(message, type) {
	const notifyUI = document.createElement("div");
	const heading = document.createElement("h2");
	const p = document.createElement("p");
	
	notifyUI.id = `notifyUI`;
	// main text or information
	p.innerText = message;
	
	if (type === "warning") {
		notifyUI.style.backgroundColor = "#ff0000";
		heading.innerText = "Warning";
	} else {
		heading.innerText = "Notification";
	}
	
	notifyUI.appendChild(heading);
	notifyUI.appendChild(p);
	document.body.appendChild(notifyUI);
	
	setTimeout(function() {
		notifyUI.remove();
	}, 5000);
}

function showDownloadUI() {
	console.log("hi");
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
	} else if (pageStatus === "safe") {
		alert("This is a safe site!");
	} else if (pageStatus === "webi safe") {
		alert("This is a Webi-verified safe site!");
	}
};

function initGame(game) {
	const gameBox = document.getElementById("gameBox");	
	if (!game) return;
	
	const loadingTxt = document.createElement("p");
	loadingTxt.innerText = `Loading ${game}...`;
	gameBox.appendChild(loadingTxt);
	setTimeout(() => {
		loadingTxt.innerText = `${game}`;
	}, 1200);
}
function stopGame() {
	const gameBox = document.getElementById("gameBox");
	const gameDiv = document.getElementById("gameDiv");
	if (gameDiv.style.visibility !== "hidden") {
		gameBox.replaceChildren();
	}
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
		const button = event.target.closest("[data-theme]");
		if (!button || !pageBody.contains(button)) return;
		setTheme(button.dataset.theme);
		
		const label = document.getElementById("currentTheme");

		if (label) {
			label.textContent = "Current theme: " + navTheme;
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
			const button = event.target.closest("[data-game");
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