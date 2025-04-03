import { NextRequest, NextResponse } from "next/server";

// Map our category IDs to Google Places API types
const categoryToTypeMap: Record<string, string> = {
  restaurant: "restaurant",
  beach: "natural_feature",
  hotel: "lodging",
  bar: "bar",
  cafe: "cafe",
  services: "point_of_interest",
  entertainment: "tourist_attraction",
  shopping: "shopping_mall",
};

// Keywords to add to searches for better results
const categoryKeywords: Record<string, string> = {
  beach: "beach",
  services: "services",
  entertainment: "entertainment",
};

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get("location");
  const type = searchParams.get("type") || "restaurant";
  const countOnly = searchParams.get("countOnly") === "true";
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  // Get the Google Places type and keyword if needed
  const googleType = categoryToTypeMap[type] || type;
  const keyword = categoryKeywords[type] || "";

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

    // Build query parameters
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: "5000",
      type: googleType,
      rankby: "prominence",
      key: apiKey,
    });

    // Add keyword for specific categories that need it
    if (keyword) {
      params.append("keyword", keyword);
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}`);
    }

    const data = await response.json();

    // If this is just a count request, return only the count
    if (countOnly) {
      return NextResponse.json({
        category: type,
        totalFound: data.results.length,
      });
    }

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
          : `https://via.placeholder.com/400x300?text=${encodeURIComponent(
              place.name || "No Image"
            )}`,
        types: place.types || [],
        description: place.types
          ? place.types.slice(0, 3).join(", ").replace(/_/g, " ")
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
      results: formattedResults.slice(0, 12), // Return top 12 trending places
      category: type,
      totalFound: formattedResults.length,
    });
  } catch (error: any) {
    console.error("Google Places API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch trending places" },
      { status: 500 }
    );
  }
}
