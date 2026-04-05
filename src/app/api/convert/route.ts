import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    let videoId = "";
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes("youtu.be")) {
            videoId = urlObj.pathname.slice(1);
        } else {
            videoId = urlObj.searchParams.get("v") || "";
        }
    } catch(e) {}
    if (!videoId) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });

    console.log("Fetching transcript from RapidAPI for Video ID:", videoId);
    
    // Ensure the user has put RAPID_API_KEY in Vercel environment variables
    const rapidApiKey = process.env.RAPID_API_KEY;
    if (!rapidApiKey) {
      throw new Error("Missing RAPID_API_KEY environment variable. Please add it to your Vercel project settings.");
    }

    // Using the popular 'YouTube Transcript' API structure on RapidAPI
    const transcriptRes = await fetch(`https://youtube-transcripts.p.rapidapi.com/youtube/transcript?url=https://www.youtube.com/watch?v=${videoId}&chunkSize=500`, {
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'youtube-transcripts.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey
        }
    });

    if (!transcriptRes.ok) {
        throw new Error(`Proxy API Error (${transcriptRes.status}): Make sure you are subscribed to the "YouTube Transcript" API on RapidAPI and your key is correct.`);
    }

    const transcriptData = await transcriptRes.json();
    
    // Parse the returned format
    let fullText = "";
    if (Array.isArray(transcriptData)) {
         // Some endpoints return a direct array
         fullText = transcriptData.map((item: any) => item.text).join(' ');
    } else if (transcriptData.content) {
         // Some endpoints wrap it in a content array
        fullText = transcriptData.content.map((item: any) => item.text).join(' ');
    } else {
        throw new Error("RapidAPI returned a transcript format we do not understand. Please check your RapidAPI Subscription.");
    }

    if (!fullText) {
        return NextResponse.json({ error: 'This video does not have English captions available.' }, { status: 400 });
    }

    const safeText = fullText.slice(0, 30000); // Token limits safeguard

    const prompt = `You are an expert social media manager and copywriter. 
I will provide you with the transcript of a YouTube video. 
Your job is to convert this video transcript into highly engaging content for three specific platforms.

TRANSCRIPT:
${safeText}

REQUIREMENTS:
Return a JSON object with exactly three keys: 'twitter', 'linkedin', and 'blog'.
- twitter: A high-performing Twitter/X thread (3-5 tweets long max) summarizing the key points. Use emojis.
- linkedin: A compelling LinkedIn post that tells a story, uses spacing, and ends with a question for the audience.
- blog: A well-structured short blog post (around 300 words) with a catchy title and headers.

Return ONLY a valid JSON object. No markdown code blocks like \`\`\`json around it. Just the literal JSON string starting with { and ending with }.`;

    console.log("Calling Gemini API...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const outputText = response.text;
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(outputText || "{}");
    } catch(e) {
      console.error("Failed to parse JSON directly. Attempting cleanup...", outputText);
      const cleaned = outputText?.replace(/```json\n?|\`\`\`/g, '').trim();
      parsedResult = JSON.parse(cleaned || "{}");
    }

    return NextResponse.json({
      twitter: parsedResult.twitter || "Failed to generate Twitter thread.",
      linkedin: parsedResult.linkedin || "Failed to generate LinkedIn post.",
      blog: parsedResult.blog || "Failed to generate Blog post.",
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during AI processing.' },
      { status: 500 }
    );
  }
}
