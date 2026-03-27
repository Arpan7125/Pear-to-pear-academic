import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Simulate AI generation if no key exists
    if (!apiKey) {
      const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
      await wait(1500); // simulate processing delay
      
      const pseudoAIResponse = `[Simulated AI Preview]\nThis document appears to be titled "${file.name}". It is approximately ${Math.round(file.size / 1024)} KB in size. To get actual AI-generated summaries of your documents' contents, please provide a \`GEMINI_API_KEY\` in the frontend environment variables.`;
      
      return NextResponse.json({ success: true, preview: pseudoAIResponse });
    }

    // Attempt to extract raw text (naive extraction for demo, handles text files well, PDFs less so without a parser)
    const arrayBuffer = await file.arrayBuffer();
    const rawText = new TextDecoder().decode(arrayBuffer);
    // Strip out most binary garbage characters to avoid breaking the prompt
    const snippet = rawText.substring(0, 5000).replace(/[^\x20-\x7E\n]/g, ' '); 
    
    const prompt = `You are a helpful AI document summarizer used in an academic library network. 
Please provide a polite, concise, 2-3 sentence summary preview of the document.
If the contents seem to be unreadable binary data (since we are doing naive extraction), just write a generic academic-focused summary based entirely on the filename.

Filename: ${file.name}

Extracted Text Snippet:
"""
${snippet}
"""`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return NextResponse.json({ success: false, error: 'AI generation failed due to an API error.' }, { status: 500 });
    }

    const data = await geminiRes.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ success: true, preview: generatedText?.trim() || 'No preview available.' });

  } catch (error) {
    console.error('AI Preview endpoint error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
