import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("place_id");
  const useAI = searchParams.get("useAI") === "true";
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;

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
        : [
            {
              reference: "no-photo",
              width: 800,
              height: 600,
              url: `https://via.placeholder.com/800x600?text=${encodeURIComponent(
                place.name || "No Photos Available"
              )}`,
            },
          ],
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
      aiDescription: "",
      aiRecommendations: "",
    };

    // If AI enhancement is requested and OpenAI key is available
    if (useAI && openAIKey) {
      try {
        // Extract location from address (e.g., "123 Main St, City, Country" -> "City, Country")
        const addressParts = formattedPlace.address.split(",");
        const location =
          addressParts.length > 1
            ? addressParts
                .slice(Math.max(1, addressParts.length - 2))
                .join(",")
                .trim()
            : formattedPlace.address;

        // Get the primary type (e.g., "restaurant", "cafe")
        const primaryType =
          formattedPlace.types[0]?.replace(/_/g, " ") || "place";

        // Fetch AI-generated content
        const aiResponse = await fetch(
          `${request.nextUrl.origin}/api/places/ai-descriptions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              place: formattedPlace,
              type: primaryType,
              location: location,
            }),
          }
        );

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          formattedPlace.aiDescription = aiData.description || "";
          formattedPlace.aiRecommendations = aiData.recommendations || "";
        } else {
          console.warn(
            "Failed to fetch AI descriptions, using standard description"
          );
        }
      } catch (aiError) {
        console.error("Error fetching AI descriptions:", aiError);
        // Continue without AI descriptions if there's an error
      }
    }

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
