fetch('https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers')
  .then(r => r.text())
  .then(html => {
    const $ = require('cheerio').load(html);
    console.log($('.nextra-breadcrumb').nextAll().text());
  });
