import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("place_id");
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API key is not configured" },
      { status: 500 }
    );
  }

  if (!placeId) {
    return NextResponse.json(
      { error: "place_id parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Use Google Places Details API to get place details
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,formatted_phone_number,website,opening_hours,photos,reviews,price_level,types,geometry&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const place = data.result;

    // Format the place details
    const formattedPlace = {
      id: place.place_id || placeId,
      name: place.name || "",
      rating: place.rating || 0,
      address: place.formatted_address || "",
      phone: place.formatted_phone_number || "",
      website: place.website || "",
      priceLevel: place.price_level ? "$".repeat(place.price_level) : "N/A",
      openNow: place.opening_hours?.open_now || false,
      openingHours: place.opening_hours?.weekday_text || [],
      types: place.types || [],
      location: place.geometry?.location || { lat: 0, lng: 0 },
      photos: place.photos
        ? place.photos.map((photo: any) => ({
            reference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`,
          }))
        : [],
      reviews: place.reviews
        ? place.reviews.map((review: any) => ({
            authorName: review.author_name,
            authorPhoto: review.profile_photo_url,
            rating: review.rating,
            time: review.time,
            text: review.text,
            relativeTime: review.relative_time_description,
          }))
        : [],
    };

    return NextResponse.json({
      place: formattedPlace,
    });
  } catch (error: any) {
    console.error("Google Places API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
