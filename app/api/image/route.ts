import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const {
      prompt,
      count = 1,
      size = "1024x1024",
      style = "realistic",
      model = "dall-e-3",
    } = body;

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY || "";

    // Validate API key
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      console.error("OpenAI API key is missing from environment variables");
      return new Response(
        JSON.stringify({ error: "API key is not configured on the server" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      console.error("Prompt is invalid");
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Enhance the prompt with style information if provided
    let enhancedPrompt = prompt;
    if (style && style !== "realistic") {
      enhancedPrompt = `${prompt}, in ${style} style`;
    }

    console.log(
      `Generating image(s) using DALL-E: "${enhancedPrompt}" (${size}, count: ${count})`
    );

    // Determine which OpenAI model to use
    const isUsingDalle3 = model === "dall-e-3";

    // OpenAI's DALL-E API
    const dalleResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          n: isUsingDalle3 ? 1 : Math.min(count, 10), // DALL-E 3 only supports 1 image per request
          size: size,
          model: model,
          quality: "standard",
          response_format: "url",
        }),
      }
    );

    if (!dalleResponse.ok) {
      const errorData = await dalleResponse.json();
      console.error("OpenAI DALL-E API error:", errorData);
      return new Response(
        JSON.stringify({
          error: errorData.error?.message || "Error from OpenAI DALL-E API",
          details: errorData,
        }),
        {
          status: dalleResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await dalleResponse.json();

    // Extract image URLs from the response
    let imageUrls = data.data.map((item: any) => item.url);

    // For DALL-E 3, if more than one image is requested, make multiple requests
    if (isUsingDalle3 && count > 1) {
      const additionalRequests = [];
      for (let i = 1; i < count; i++) {
        additionalRequests.push(
          fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              prompt: enhancedPrompt,
              n: 1,
              size: size,
              model: model,
              quality: "standard",
              response_format: "url",
            }),
          })
            .then((res) => {
              if (!res.ok)
                throw new Error(`Request ${i} failed: ${res.statusText}`);
              return res.json();
            })
            .then((additionalData) => additionalData.data[0].url)
        );
      }

      try {
        const additionalUrls = await Promise.all(additionalRequests);
        imageUrls.push(...additionalUrls);
      } catch (error) {
        console.error("Error generating additional images:", error);
        // Continue with the images we have
      }
    }

    // Return the response
    return new Response(
      JSON.stringify({
        images: imageUrls,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in image generation API:", error);
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
