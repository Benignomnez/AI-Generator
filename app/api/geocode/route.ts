import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");
  const apiKey = process.env.GOOGLE_PLACES_API_KEY; // We can use the same key for geocoding

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google API key is not configured" },
      { status: 500 }
    );
  }

  if (!address) {
    return NextResponse.json(
      { error: "Address parameter is required" },
      { status: 400 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Geocoding API returned ${response.status}`);
    }

    const data = await response.json();

    // Handle ZERO_RESULTS as a normal response, not an error
    if (data.status === "ZERO_RESULTS") {
      return NextResponse.json(
        {
          error: "No results found for the given address",
          status: data.status,
        },
        { status: 404 }
      );
    }

    // For other non-OK statuses, treat as an error
    if (data.status !== "OK") {
      throw new Error(`Geocoding API error: ${data.status}`);
    }

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: "No results found for the given address" },
        { status: 404 }
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;
    const formattedAddress = result.formatted_address;

    return NextResponse.json({
      location: {
        lat: location.lat,
        lng: location.lng,
        formatted_address: formattedAddress,
      },
    });
  } catch (error: any) {
    console.error("Google Geocoding API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to geocode address" },
      { status: 500 }
    );
  }
}
