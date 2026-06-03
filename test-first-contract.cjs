const cheerio = require('cheerio');
fetch('https://docs.genlayer.com/developers/intelligent-contracts/your-first-intelligent-contract')
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    console.log($('main').text());
  });
