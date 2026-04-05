const { YoutubeTranscript } = require('youtube-transcript');

YoutubeTranscript.fetchTranscript('https://www.youtube.com/watch?v=jNQXAC9IVRw')
  .then(res => console.log('✅ Success! Transcript length:', res.length))
  .catch(err => console.error('❌ Failed:', err.message));
