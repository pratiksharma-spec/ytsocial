fetch('https://pipedapi.kavin.rocks/streams/qRjz7F2sxYE')
  .then(res => res.json())
  .then(async data => {
    const subs = data.subtitles;
    if (!subs || subs.length === 0) {
       console.log("No subtitles found.");
       return;
    }
    const enSub = subs.find(s => s.code.startsWith('en')) || subs[0];
    const subRes = await fetch(enSub.url);
    const text = await subRes.text();
    console.log("Subtitle Success! Length:", text.length, text.slice(0, 100));
  })
  .catch(console.error);
