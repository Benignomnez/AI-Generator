import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const apiKey = process.env.GOOGLE_PLACES_API_KEY; // We can use the same key

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google API key is not configured" },
      { status: 500 }
    );
  }

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Latitude and longitude parameters are required" },
      { status: 400 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Geocoding API returned ${response.status}`);
    }

    const data = await response.json();

    // Handle ZERO_RESULTS as a normal response, not an error
    if (data.status === "ZERO_RESULTS") {
      return NextResponse.json(
        {
          error: "No results found for the given coordinates",
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
        { error: "No results found for the given coordinates" },
        { status: 404 }
      );
    }

    // Get the most appropriate address component
    // Usually the first result is the most specific, but we could also search for locality or administrative_area
    let formattedAddress = data.results[0].formatted_address;

    // Try to find a locality (city) component for a nicer display
    const localityResult = data.results.find(
      (result) =>
        result.types.includes("locality") ||
        result.types.includes("administrative_area_level_1")
    );

    if (localityResult) {
      formattedAddress = localityResult.formatted_address;
    }

    return NextResponse.json({
      address: formattedAddress,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
      results: data.results,
    });
  } catch (error: any) {
    console.error("Reverse geocoding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get address from coordinates" },
      { status: 500 }
    );
  }
}
