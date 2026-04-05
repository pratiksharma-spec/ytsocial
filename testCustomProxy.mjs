async function fetchTranscriptViaAllOrigins(videoId) {
  const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + videoId);
  console.log("Fetching HTML:", proxyUrl);
  const response = await fetch(proxyUrl);
  const html = await response.text();
  
  const captionMatch = html.match(/"captionTracks":\[(.*?)\]/);
  if (captionMatch) {
     console.log("Captions found!");
     const tracks = JSON.parse('[' + captionMatch[1] + ']');
     const baseUrl = tracks[0].baseUrl;
     const xmlRes = await fetch(baseUrl);
     const xml = await xmlRes.text();
     console.log("Transcript extracted! Length:", xml.length);
  } else {
     console.log("No caption tracks found.");
  }
}
fetchTranscriptViaAllOrigins('qRjz7F2sxYE');
