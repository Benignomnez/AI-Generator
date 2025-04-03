import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { place, type, location } = body;

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY || "";

    // Validate API key
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      console.error("OpenAI API key is missing from environment variables");
      return NextResponse.json(
        { error: "OpenAI API key is not configured on the server" },
        { status: 500 }
      );
    }

    if (!place || !place.name) {
      return NextResponse.json(
        { error: "Place information is required" },
        { status: 400 }
      );
    }

    // Construct prompt for the AI to generate a better description
    let prompt = `Generate a concise, enticing description for "${place.name}", which is a ${type} located in ${location}. `;

    // Add details if available
    if (place.rating) {
      prompt += `It has a rating of ${place.rating} out of 5. `;
    }

    if (place.types && place.types.length > 0) {
      prompt += `It's categorized as: ${place.types.join(", ")}. `;
    }

    prompt +=
      "Highlight what makes this place special, its atmosphere, and what visitors might experience. Keep the description under 100 words.";

    // Call OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful travel guide that creates enticing, accurate descriptions of places.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        {
          error: errorData.error?.message || "Error from OpenAI API",
          details: errorData,
        },
        { status: openaiResponse.status }
      );
    }

    const data = await openaiResponse.json();
    const aiDescription = data.choices[0].message.content.trim();

    // Generate recommendations based on the place
    const recommendationPrompt = `Based on this ${type} called "${place.name}" in ${location}, suggest 3 quick tips for visitors. Keep each tip under 15 words and format as a simple bullet list.`;

    const recommendationResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a travel expert who provides concise, helpful tips.",
            },
            {
              role: "user",
              content: recommendationPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
        }),
      }
    );

    const recommendationData = await recommendationResponse.json();
    const recommendations =
      recommendationData.choices[0].message.content.trim();

    // Return both the AI-generated description and recommendations
    return NextResponse.json({
      description: aiDescription,
      recommendations: recommendations,
    });
  } catch (error: any) {
    console.error("Error in AI descriptions API:", error);
    return NextResponse.json(
      {
        error: "An error occurred during your request.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
