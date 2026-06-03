fetch('https://docs.genlayer.com/developers/networks').then(r => r.text()).then(html => {
  const matches = html.match(/>([^<]*rpc[^<]*)</gi);
  console.log(matches ? matches.map(m => m.replace(/<|>/g, '')).filter(m => m.trim().length > 3) : "No matches");
});
