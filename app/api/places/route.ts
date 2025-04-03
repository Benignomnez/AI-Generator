import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const location = searchParams.get("location");
  const type = searchParams.get("type") || "restaurant";
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API key is not configured" },
      { status: 500 }
    );
  }

  if (!query && !location) {
    return NextResponse.json(
      { error: "Query or location parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Create the appropriate URL based on the parameters provided
    let url: string;

    if (location && query) {
      // Text search with location context
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&location=${encodeURIComponent(location)}&type=${type}&key=${apiKey}`;
    } else if (location) {
      // Nearby search
      const [lat, lng] = location.split(",");
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${apiKey}`;
    } else {
      // Text search only
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&type=${type}&key=${apiKey}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}`);
    }

    const data = await response.json();

    // Format the response to match our application's needs
    const formattedResults = data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      rating: place.rating || 0,
      address: place.formatted_address || place.vicinity || "",
      priceLevel: place.price_level ? "$".repeat(place.price_level) : "N/A",
      openNow: place.opening_hours?.open_now || false,
      image: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
        : `https://via.placeholder.com/400x300?text=${encodeURIComponent(
            place.name || "No Image"
          )}`,
      types: place.types || [],
      description: place.types ? place.types.join(", ").replace(/_/g, " ") : "",
    }));

    return NextResponse.json({
      results: formattedResults,
    });
  } catch (error: any) {
    console.error("Google Places API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch places" },
      { status: 500 }
    );
  }
}
