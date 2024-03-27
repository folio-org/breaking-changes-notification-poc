const BASE_URL = 'https://api.github.com/';
const OWNER = 'folio-org';
const BREAKING_CHANGE_LABEL = 'breaking';
const GET_OPTIONS = {};

// eslint-disable-next-line no-unused-vars
function loadBreakingChanges() {
  let sheet = SpreadsheetApp.getActiveSheet();

  // Row headings
  if (sheet.getLastRow() < 1) {
    sheet.appendRow([
      'Date',
      'PR',
      'Title'
    ]);
  }

  let repo = 'mod-circulation';

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
    pr.title
  ]);
  let link = SpreadsheetApp.newRichTextValue()
    .setText(`${repo}-${pr.number}`)
    .setLinkUrl(pr.html_url)
    .build()
  sheet.getRange(sheet.getLastRow(), 2, 1, 1).setRichTextValue(link);
}
