import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { query, location, interests } = body;

    // Get API key from environment variables - prioritize Google API key for travel suggestions
    const googleKey = process.env.GOOGLE_API_KEY || "";
    const openAIKey = process.env.OPENAI_API_KEY || "";

    // Always use Gemini API for travel suggestions to preserve OpenAI credits for chat functionality
    const useGemini = true;

    // Validate that Google API key is available
    if (!googleKey || !googleKey.trim()) {
      console.error("Google API key not available for travel suggestions");
      return NextResponse.json(
        { error: "Google API key is not configured on the server" },
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

    let aiResponse;

    // Use Google Gemini API for travel suggestions
    console.log("Using Google Gemini API for travel suggestions");

    // Get model from headers or use a reliable default
    const modelName = req.headers.get("Model") || "gemini-1.5-flash";
    console.log("Requested model:", modelName);

    // Use Gemini API key - prioritize dedicated Gemini key
    const geminiApiKey = process.env.GEMINI_API_KEY || googleKey;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
    console.log(
      "API URL (without key):",
      apiUrl.replace(geminiApiKey, "[REDACTED]")
    );

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "You are a travel recommendation system. " +
                  prompt +
                  " Ensure your response is properly formatted JSON.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 64,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("Google Gemini API error:", errorData);
      return NextResponse.json(
        {
          error: errorData.error?.message || "Error from Google Gemini API",
          details: errorData,
        },
        { status: geminiResponse.status }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract text from Gemini response
    const responseText = geminiData.candidates[0].content.parts[0].text;

    // Parse JSON from the text - find JSON parts
    let jsonStart = responseText.indexOf("{");
    let jsonEnd = responseText.lastIndexOf("}") + 1;

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const jsonText = responseText.substring(jsonStart, jsonEnd);
      aiResponse = jsonText;
    } else {
      // If we can't find JSON object markers, look for array markers
      jsonStart = responseText.indexOf("[");
      jsonEnd = responseText.lastIndexOf("]") + 1;

      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonText = responseText.substring(jsonStart, jsonEnd);
        // Wrap in an object with suggestions key
        aiResponse = `{"suggestions": ${jsonText}}`;
      } else {
        console.error(
          "Could not extract JSON from Gemini response:",
          responseText
        );
        return NextResponse.json(
          {
            error: "Could not extract valid JSON from AI response",
            raw: responseText,
          },
          { status: 500 }
        );
      }
    }

    // Parse the JSON response
    try {
      const parsedContent = JSON.parse(aiResponse);
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
          raw: aiResponse,
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
