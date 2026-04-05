import { YoutubeTranscript } from 'youtube-transcript';

YoutubeTranscript.fetchTranscript('https://www.youtube.com/watch?v=qRjz7F2sxYE', {
  fetch: (url, options) => {
    // Prefix the target youtube URL with a public cors proxy URL
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    console.log("Fetching via proxy:", proxyUrl);
    return fetch(proxyUrl, options);
  }
})
  .then(res => console.log('✅ Success! Transcripts retrieved! Length:', res.length))
  .catch(err => console.error('❌ Failed:', err.message));
