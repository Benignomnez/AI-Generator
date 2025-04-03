import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.GOOGLE_API_KEY || "";

    // Validate API key
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return new Response(
        JSON.stringify({ error: "API key is not configured on the server" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call the list models API to see what models are available
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return new Response(
        JSON.stringify({
          error: errorData.error?.message || "Error accessing Gemini API",
          details: errorData,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    // Extract just the model names and display names for clarity
    const models =
      data.models?.map((model: any) => ({
        name: model.name,
        displayName: model.displayName,
        supportedGenerationMethods: model.supportedGenerationMethods || [],
      })) || [];

    // Return the list of available models
    return new Response(
      JSON.stringify({
        message: "These are the available models with your API key",
        models: models,
        rawData: data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error retrieving Gemini models:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred during your request.",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
