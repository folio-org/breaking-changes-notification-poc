const BASE_URL = 'https://api.github.com/';
const OWNER = 'folio-org';
const BREAKING_CHANGE_LABEL = 'breaking';
const GET_OPTIONS = {};
const BREAKING_CHANGE_REGEX = /##.?Breaking Change(?<change>[^#]*)/;
const INCLUDE_REPOS = ['tech-council', 'mod-c', 'mod-i'];

// eslint-disable-next-line no-unused-vars
function loadBreakingChanges() {
  let sheet = SpreadsheetApp.getActiveSheet();
  sheet.clear();

  // Row headings
  if (sheet.getLastRow() < 1) {
    sheet.appendRow([
      'Created',
      'State',
      'PR',
      'Title',
      'Breaking Change',
    ]);
  }

  let repos = loadReposList();
  repos.forEach(repo => {
    if (includeRepo(repo)) {
      Utilities.sleep(4000);
      console.log(`Loading from repo ${repo}`)
      loadFromRepo(repo);
    }
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

function includeRepo(repo) {
  for (const pattern of INCLUDE_REPOS) {
    if (repo.startsWith(pattern)) {
      return true;
    }
  }
  return false;
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
  sheet.appendRow([
    pr.created_at,
    pr.state,
    pr.number,
    pr.title,
    parseBreakingChange(pr.body),
  ]);
  let link = SpreadsheetApp.newRichTextValue()
    .setText(`${repo}-${pr.number}`)
    .setLinkUrl(pr.html_url)
    .build()
  sheet.getRange(sheet.getLastRow(), 3, 1, 1).setRichTextValue(link);
}

function parseBreakingChange(text) {
  let result = BREAKING_CHANGE_REGEX.exec(text);
  let change = result?.groups?.change ?? '';
  return change.trim();
}
