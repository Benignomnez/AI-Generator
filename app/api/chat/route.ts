import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Get the raw request body as text
    const rawBody = await req.text()
    console.log("Raw request body:", rawBody)

    // Parse the request body
    const body = JSON.parse(rawBody)
    const { messages, apiKey, model } = body

    // Debug log (remove in production)
    console.log("API route received request:", {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      apiKeyStart: apiKey ? apiKey.substring(0, 5) + "..." : "none",
      model,
      messageCount: messages?.length,
    })

    // Validate request
    if (!apiKey) {
      console.error("API key is missing")
      return new Response(JSON.stringify({ error: "OpenAI API key is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("Messages are invalid")
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Use fetch to call the OpenAI API directly
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-3.5-turbo",
        messages: messages.map((message: any) => ({
          role: message.role,
          content: message.content,
        })),
        temperature: 0.7,
        stream: true,
      }),
    })

    // Return the streaming response directly
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error: any) {
    console.error("Error in chat API:", error)
    return new Response(
      JSON.stringify({
        error: "An error occurred during your request.",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

