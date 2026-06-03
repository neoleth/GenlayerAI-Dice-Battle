fetch('https://docs.genlayer.com/developers/networks').then(r => r.text()).then(html => {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  $('table').each((i, el) => {
    console.log("Table", i);
    console.log($(el).text());
  });
});
