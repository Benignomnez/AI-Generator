import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get("reference");
  const maxwidth = searchParams.get("maxwidth") || "800";
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API key is not configured" },
      { status: 500 }
    );
  }

  if (!reference) {
    return NextResponse.json(
      { error: "Photo reference parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Create the Google Places Photo API URL
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${reference}&key=${apiKey}`;

    // Fetch the image
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places Photo API returned ${response.status}`);
    }

    // Get the image as an array buffer
    const imageBuffer = await response.arrayBuffer();

    // Return the image with the appropriate content type
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error: any) {
    console.error("Google Places Photo API error:", error);

    // Return a placeholder image instead of a JSON error
    return NextResponse.redirect(
      `https://via.placeholder.com/${maxwidth}x${Math.round(
        Number(maxwidth) * 0.75
      )}?text=Image+Not+Available`,
      { status: 307 }
    );
  }
}
