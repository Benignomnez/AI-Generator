import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { query, location, interests } = body;

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

    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    // Construct prompt for the AI
    let prompt = `As a travel recommendation system, help me find interesting places to visit in ${location}. `;

    if (query) {
      prompt += `I'm specifically interested in ${query}. `;
    }

    if (interests && interests.length > 0) {
      prompt += `I generally enjoy ${interests.join(", ")}. `;
    }

    prompt +=
      "Please suggest 5 specific places I should visit, giving a brief reason for each. Return the response in a JSON format with a top-level 'suggestions' array containing objects with 'name', 'type', and 'reason' fields.";

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
                "You are a travel recommendation system that provides suggestions in valid JSON format. Always return a well-formed JSON array with the suggestions.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: "json_object" },
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
    const aiSuggestions = data.choices[0].message.content.trim();

    // Parse the JSON response
    try {
      const parsedContent = JSON.parse(aiSuggestions);
      // Check if the response has the expected structure
      if (Array.isArray(parsedContent.suggestions)) {
        return NextResponse.json({
          suggestions: parsedContent.suggestions,
        });
      } else if (Array.isArray(parsedContent)) {
        // Handle case where AI returned a direct array without the "suggestions" wrapper
        return NextResponse.json({
          suggestions: parsedContent,
        });
      } else {
        // Try to detect if there's a suggestions array anywhere in the response
        const possibleSuggestions = Object.values(parsedContent).find(
          (value) =>
            Array.isArray(value) &&
            value.length > 0 &&
            value[0].name &&
            value[0].type
        );

        if (possibleSuggestions) {
          return NextResponse.json({
            suggestions: possibleSuggestions,
          });
        } else {
          console.error("Unexpected AI response format:", parsedContent);
          return NextResponse.json(
            {
              error: "AI response format was not as expected",
              raw: parsedContent,
            },
            { status: 500 }
          );
        }
      }
    } catch (parseError) {
      console.error("Error parsing AI suggestions:", parseError);
      return NextResponse.json(
        {
          error: "Could not parse AI suggestions",
          raw: aiSuggestions,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in AI suggestions API:", error);
    return NextResponse.json(
      {
        error: "An error occurred during your request.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
