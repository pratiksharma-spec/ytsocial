import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    console.log("Fetching transcript locally for:", url);
    let transcriptItems;
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(url);
    } catch (e) {
       console.error("Transcript Error:", e);
       return NextResponse.json({ error: 'Failed to extract transcript. Please ensure the video has closed captions/subtitles enabled and is not age restricted.' }, { status: 400 });
    }
    
    const fullText = transcriptItems.map((item: any) => item.text).join(' ');
    const safeText = fullText.slice(0, 30000); 

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
