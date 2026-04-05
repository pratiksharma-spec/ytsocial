'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Convert with AI');
  const [results, setResults] = useState<{twitter: string, linkedin: string, blog: string} | null>(null);
  const [error, setError] = useState('');

  const fetchTranscriptClientSide = async (videoUrl: string) => {
     let html = "";
     try {
       const proxyUrl = 'https://corsproxy.io/?url=' + encodeURIComponent(videoUrl);
       const response = await fetch(proxyUrl);
       if (!response.ok) throw new Error();
       html = await response.text();
     } catch(e) {
       console.log("Primary proxy failed, falling back...");
       const proxyUrl2 = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(videoUrl);
       const response2 = await fetch(proxyUrl2);
       if (!response2.ok) throw new Error("Our proxies failed to load the YouTube webpage. Please try again later.");
       html = await response2.text();
     }
     
     const captionMatch = html.match(/"captionTracks":\s*\[(.*?)\]/);
     if (!captionMatch) {
         throw new Error("No captions found. Ensure the video has subtitles enabled and is not age restricted.");
     }
     
     const tracks = JSON.parse('[' + captionMatch[1] + ']');
     const englishTrack = tracks.find((t: any) => t.languageCode === 'en' || t.languageCode.includes('en')) || tracks[0];
     
     if (!englishTrack || !englishTrack.baseUrl) {
         throw new Error("No readable subtitle track available.");
     }

     const xmlRes = await fetch(englishTrack.baseUrl);
     const xml = await xmlRes.text();
     
     const textMatch = xml.match(/<text(?:[^>]*)>([\s\S]*?)<\/text>/g);
     if (!textMatch) throw new Error("Could not parse transcript text.");
     
     const fullText = textMatch.map(t => {
         return t.replace(/<[^>]+>/g, '')
                 .replace(/&amp;/g, '&')
                 .replace(/&#39;/g, "'")
                 .replace(/&quot;/g, '"');
     }).join(' ');

     return fullText;
  }

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      setLoadingText("Extracting Transcript (Client Proxys)...");
      const transcriptText = await fetchTranscriptClientSide(url);
      
      if (!transcriptText || transcriptText.length < 20) {
          throw new Error("Transcript extracted was unusually short or empty.");
      }

      setLoadingText("Analyzing via Gemini AI API...");
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptText })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to convert video');
      }
      
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Unknown network error occurred');
    } finally {
      setLoading(false);
      setLoadingText("Convert with AI");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container">
      <div className="header-text">
        <h1>YouTube to <span style={{ color: "var(--accent-color)" }}>Social</span></h1>
        <p>Paste a YouTube link below and let AI automatically generate a viral Twitter Thread, LinkedIn Post, and SEO Blog in seconds.</p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <form onSubmit={handleConvert} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="url" 
            placeholder="https://www.youtube.com/watch?v=..." 
            className="modern-input"
            style={{ flex: 1, minWidth: '250px' }}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="glow-btn" disabled={loading}>
            {loading ? <span className="loader"></span> : loadingText}
          </button>
        </form>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {results && (
        <div className="cards-grid">
          <div className="glass-panel social-card">
            <div className="social-header">
              <span style={{ color: 'var(--brand-twitter)' }}>𝕏 Twitter Thread</span>
              <button className="copy-btn" onClick={() => copyToClipboard(results.twitter)}>Copy</button>
            </div>
            <div className="social-content">
              <textarea readOnly value={results.twitter}></textarea>
            </div>
          </div>

          <div className="glass-panel social-card">
            <div className="social-header">
              <span style={{ color: 'var(--brand-linkedin)' }}>💼 LinkedIn Post</span>
              <button className="copy-btn" onClick={() => copyToClipboard(results.linkedin)}>Copy</button>
            </div>
            <div className="social-content">
              <textarea readOnly value={results.linkedin}></textarea>
            </div>
          </div>

          <div className="glass-panel social-card">
            <div className="social-header">
              <span style={{ color: 'var(--brand-blog)' }}>📝 Blog Post</span>
              <button className="copy-btn" onClick={() => copyToClipboard(results.blog)}>Copy</button>
            </div>
            <div className="social-content">
              <textarea readOnly value={results.blog}></textarea>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
