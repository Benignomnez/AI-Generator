import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get("location");
  const type = searchParams.get("type") || "restaurant";
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API key is not configured" },
      { status: 500 }
    );
  }

  if (!location) {
    return NextResponse.json(
      { error: "Location parameter is required" },
      { status: 400 }
    );
  }

  try {
    // For trending places, we'll use the Nearby Search with "prominence" ranking
    // which tends to return popular and well-rated places
    const [lat, lng] = location.split(",");
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&rankby=prominence&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}`);
    }

    const data = await response.json();

    // Format and sort by rating to get the most popular places
    const formattedResults = data.results
      .map((place: any) => ({
        id: place.place_id,
        name: place.name,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        address: place.vicinity || "",
        priceLevel: place.price_level ? "$".repeat(place.price_level) : "N/A",
        openNow: place.opening_hours?.open_now || false,
        image: place.photos?.[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
          : "/placeholder.svg?height=200&width=400",
        types: place.types || [],
        description: place.types
          ? place.types.join(", ").replace(/_/g, " ")
          : "",
      }))
      .sort((a: any, b: any) => {
        // Sort by a combination of rating and number of ratings to get truly popular places
        return (
          b.rating * Math.log10(b.userRatingsTotal || 1) -
          a.rating * Math.log10(a.userRatingsTotal || 1)
        );
      });

    return NextResponse.json({
      results: formattedResults.slice(0, 10), // Return top 10 trending places
    });
  } catch (error: any) {
    console.error("Google Places API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch trending places" },
      { status: 500 }
    );
  }
}
