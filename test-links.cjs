fetch('https://docs.genlayer.com/developers/intelligent-contracts/introduction-to-intelligent-contracts').then(r=>r.text()).then(html=>{
  const matches = html.match(/href="([^"]+)"[^>]*>Your First Intelligent Contract/i);
  console.log(matches ? matches[1] : "Not found");
});
