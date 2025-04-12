import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");
  const timestamp = searchParams.get("timestamp"); // Used to bust cache
  const apiKey = process.env.GOOGLE_PLACES_API_KEY; // We can use the same key for geocoding

  console.log("Geocode API called for:", address, "at timestamp:", timestamp);

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
    // Add cache-busting timestamp and language parameter for better results
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&language=en&key=${apiKey}&v=${timestamp || Date.now()}`;

    console.log("Calling Google Geocoding API with:", address);

    // Use no-store to prevent caching issues
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

    if (!response.ok) {
      throw new Error(`Google Geocoding API returned ${response.status}`);
    }

    const data = await response.json();
    console.log("Google Geocoding API status:", data.status);

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

    console.log("Geocode result:", {
      formattedAddress,
      lat: location.lat,
      lng: location.lng,
    });

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
