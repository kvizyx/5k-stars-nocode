const { writeFileSync, readFileSync } = require("fs");
const { GITHUB_API_URL, GITHUB_REPOSITORY, GH_TOKEN } = process.env;

async function updateStargazersList() {
	let CURRENT_PAGE = 1;
	let requestURL = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/stargazers`;

	let stargazersFetched = [];

	let readmeData;

	try {
		const readReadme = readFileSync("README.md", "utf8");

		readmeData = readReadme.replace(/^\d+\. \[@.*]\(.*\)/gm, "").trimEnd();
	} catch (err) {
		throw new Error(err);
	}

	while (true) {
		const request = await fetch(`${requestURL}?per_page=100&page=${CURRENT_PAGE}`, {
			headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/json" },
		});

		if (request.status === 403 || request.status === 429 || request.status === 401) {
			throw new Error(`Request failed with status code ${request.status} (${request.statusText})`);
		}

		const data = await request.json();

		if (data.length === 0) break;

		data.map(({ login, html_url }) => {
			return stargazersFetched.push({ login, html_url });
		});

		CURRENT_PAGE++;
	}

	const updatedStargazers = stargazersFetched.map((x, i) => `${i + 1}. [@${x.login}](${x.html_url})`).join("\n");
	const updatedDescription = readmeData.replace(/\d+\//gm, `${stargazersFetched.length}/`);

	writeFileSync("README.md", `${updatedDescription}\n\n${updatedStargazers}\n`, "utf8");
}

updateStargazersList();
