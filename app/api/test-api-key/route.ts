import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json()
    const { apiKey } = body

    // Debug log (remove in production)
    console.log("Test API route received request:", {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      apiKeyType: typeof apiKey,
      apiKeyStart: typeof apiKey === "string" && apiKey ? apiKey.substring(0, 5) + "..." : "none",
    })

    // Validate request - ensure apiKey is a non-empty string
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      console.error("API key is missing or invalid")
      return new Response(JSON.stringify({ error: "OpenAI API key is required and must be a string", valid: false }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Simple validation for OpenAI API key format (should start with "sk-")
    if (!apiKey.startsWith("sk-")) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Invalid API key format. OpenAI API keys should start with 'sk-'",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // For security and to avoid actual API calls during testing, we'll just validate the format
    return new Response(
      JSON.stringify({
        valid: true,
        message: "API key format is valid",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )

    // If you want to actually test the API key with OpenAI, uncomment this code:
    /*
    // Initialize OpenAI with the provided API key and allow browser usage
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    // Test the API key with a simple request
    const models = await openai.models.list();
    
    return new Response(JSON.stringify({ 
      valid: true, 
      message: "API key is valid",
      modelCount: models.data.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    */
  } catch (error: any) {
    console.error("Error testing API key:", error)
    return new Response(
      JSON.stringify({
        valid: false,
        error: "Invalid API key or API error",
        details: error.message,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

