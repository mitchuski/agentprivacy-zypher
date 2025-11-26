import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route for NEAR Cloud AI chat completions
 * This bypasses CORS restrictions by making the request server-side
 * 
 * Note: This route only works in development mode (Next.js dev server).
 * In production (static export), the frontend makes direct API calls to NEAR Cloud AI.
 */

// Exclude from static export (API routes don't work with output: 'export')
export function generateStaticParams() {
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_NEAR_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_NEAR_API_URL || 'https://cloud-api.near.ai/v1';
    const model = process.env.NEXT_PUBLIC_NEAR_MODEL || 'openai/gpt-oss-120b';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'NEAR_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const requestBody = {
      model: model,
      ...body,
      stream: body.stream !== undefined ? body.stream : true, // Enable streaming by default
      // No max_tokens limit by default - allow full responses
      max_tokens: body.max_tokens, // Only set if explicitly provided
      temperature: body.temperature || 0.8, // Slightly creative but focused
    };

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    // If streaming, return the stream directly
    if (requestBody.stream && response.body) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response (fallback)
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Proxy request failed' },
      { status: 500 }
    );
  }
}

