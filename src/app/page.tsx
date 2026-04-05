'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{twitter: string, linkedin: string, blog: string} | null>(null);
  const [error, setError] = useState('');

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to convert video');
      }
      
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            {loading ? <span className="loader"></span> : 'Convert with AI'}
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
      
      {loading && (
        <div style={{ textAlign: 'center', margin: '3rem 0', color: 'var(--text-secondary)' }}>
           <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
             <span className="loader" style={{ borderColor: 'rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6' }}></span>
             Extracting transcript and analyzing via Gemini API... (this takes ~10-15s)
           </p>
        </div>
      )}
    </div>
  );
}
