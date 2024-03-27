const BASE_URL = 'https://api.github.com/';
const OWNER = 'folio-org';
const BREAKING_CHANGE_LABEL = 'breaking';
const GET_OPTIONS = {};
const BREAKING_CHANGE_REGEX = /##.?Breaking Change(?<change>[^#]*)/;

// eslint-disable-next-line no-unused-vars
function loadBreakingChanges() {
  let sheet = SpreadsheetApp.getActiveSheet();
  sheet.clear();

  // Row headings
  if (sheet.getLastRow() < 1) {
    sheet.appendRow([
      'Date',
      'PR',
      'Title',
      'Breaking Change',
    ]);
  }

  let repos = loadReposList();
  repos.forEach(repo => {
    Utilities.sleep(2000);
    console.log(`Loading from repo ${repo}`)
    loadFromRepo(repo);
  });
}

function loadReposList() {
  const PAGE_SIZE = 100;
  let allRepoNames = [];
  for(let i=1; i <= 5; i++) {
    Utilities.sleep(4000);
    let url = `${BASE_URL}orgs/${OWNER}/repos?per_page=${PAGE_SIZE}&page=${i}`;
    let rawResponse = UrlFetchApp.fetch(url, GET_OPTIONS);
    let response = JSON.parse(rawResponse.getContentText());
    let repoNames = response.map(repo => repo.name);
    allRepoNames = allRepoNames.concat(repoNames);
  }
  return allRepoNames;
}

function loadFromRepo(repo) {
  let url = BASE_URL + 'search/issues'
    + '?q=is:pr' 
      + '%20' + 'label:' + BREAKING_CHANGE_LABEL 
      + '%20' + 'repo:' + OWNER + '/' + repo;

  let rawResponse = UrlFetchApp.fetch(url, GET_OPTIONS);
  let response = JSON.parse(rawResponse.getContentText());

  let prs = response.items;
  prs.forEach(pr => {
    // console.log(pr);
    writePr(pr, repo);
  });
}

function writePr(pr, repo) {
  let sheet = SpreadsheetApp.getActiveSheet();
  let date = new Date().toJSON().slice(0, 10);
  sheet.appendRow([
    date,
    pr.number,
    pr.title,
    parseBreakingChange(pr.body),
  ]);
  let link = SpreadsheetApp.newRichTextValue()
    .setText(`${repo}-${pr.number}`)
    .setLinkUrl(pr.html_url)
    .build()
  sheet.getRange(sheet.getLastRow(), 2, 1, 1).setRichTextValue(link);
}

function parseBreakingChange(text) {
  let result = BREAKING_CHANGE_REGEX.exec(text);
  let change = result?.groups?.change ?? '';
  return change.trim();
}
