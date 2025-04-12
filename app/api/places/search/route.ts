import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || "";
  const location = searchParams.get("location") || "";
  const type = searchParams.get("type") || "";
  const searchType = searchParams.get("searchType") || "textquery"; // textquery or category
  let exactMatch = searchParams.get("exactMatch") === "true"; // Check if this is an exact match search
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  console.log("Places Search API called with:", {
    query,
    location,
    type,
    searchType,
    exactMatch,
    hasApiKey: !!apiKey,
  });

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API key is not configured" },
      { status: 500 }
    );
  }

  try {
    let url: string | undefined;
    let locationParts: string[] = [];

    // Parse location if provided
    if (location) {
      locationParts = location.split(",").map((part) => part.trim());
      // Validate location format
      if (
        locationParts.length !== 2 ||
        isNaN(parseFloat(locationParts[0])) ||
        isNaN(parseFloat(locationParts[1]))
      ) {
        console.error("Invalid location format:", location);
        return NextResponse.json(
          { error: "Location must be in 'latitude,longitude' format" },
          { status: 400 }
        );
      }
    }

    // Use Text Search API for better results with both query and location
    if (query) {
      try {
        // Special handling for potential business names (short queries without spaces)
        const isLikelyBusinessName = query.length < 15 && !query.includes(" ");

        if (isLikelyBusinessName && locationParts.length === 2) {
          console.log("Detected potential business name search:", query);

          // Use both Find Place and Text Search APIs in parallel for business names
          // This gives us the best chance of finding the specific business

          // 1. Find Place From Text (better for exact business names)
          const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
            query
          )}&inputtype=textquery&fields=formatted_address,name,rating,opening_hours,geometry,photos,place_id,price_level,user_ratings_total,types&key=${apiKey}`;

          // Add location bias
          const findPlaceUrlWithBias = `${findPlaceUrl}&locationbias=circle:15000@${locationParts[0]},${locationParts[1]}`;

          // 2. Text Search (better for partial matches and general search)
          const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
            query
          )}&location=${locationParts[0]},${
            locationParts[1]
          }&radius=15000&key=${apiKey}`;

          console.log("Combined search approach for business name");
          console.log(
            "Find Place URL:",
            findPlaceUrlWithBias.replace(apiKey, "API_KEY_HIDDEN")
          );
          console.log(
            "Text Search URL:",
            textSearchUrl.replace(apiKey, "API_KEY_HIDDEN")
          );

          // Perform both API calls in parallel
          const [findPlaceResponse, textSearchResponse] = await Promise.all([
            fetch(findPlaceUrlWithBias),
            fetch(textSearchUrl),
          ]);

          const [findPlaceData, textSearchData] = await Promise.all([
            findPlaceResponse.json(),
            textSearchResponse.json(),
          ]);

          console.log("Find Place API status:", findPlaceData.status);
          console.log("Text Search API status:", textSearchData.status);

          // Combine results (if available)
          let combinedResults: any[] = [];

          // Process Find Place results
          if (
            findPlaceData.status === "OK" &&
            findPlaceData.candidates?.length > 0
          ) {
            const formattedFindPlaceResults = findPlaceData.candidates.map(
              (place: any) => formatPlace(place)
            );
            combinedResults = [...formattedFindPlaceResults];
          }

          // Process Text Search results and add non-duplicates
          if (
            textSearchData.status === "OK" &&
            textSearchData.results?.length > 0
          ) {
            const formattedTextSearchResults = textSearchData.results.map(
              (place: any) => formatPlace(place)
            );

            // Add text search results that aren't already in the combined results
            formattedTextSearchResults.forEach((place: any) => {
              if (
                !combinedResults.some(
                  (existingPlace) => existingPlace.id === place.id
                )
              ) {
                combinedResults.push(place);
              }
            });
          }

          // Sort results to prioritize results with names matching the query
          if (combinedResults.length > 0) {
            combinedResults.sort((a, b) => {
              const aNameLower = a.name.toLowerCase();
              const bNameLower = b.name.toLowerCase();
              const queryLower = query.toLowerCase();

              // Check for exact or close matches first
              const aExactMatch =
                aNameLower === queryLower || aNameLower.includes(queryLower);
              const bExactMatch =
                bNameLower === queryLower || bNameLower.includes(queryLower);

              if (aExactMatch && !bExactMatch) return -1;
              if (!aExactMatch && bExactMatch) return 1;

              // Then sort by rating
              return b.rating - a.rating;
            });

            console.log(
              `Combined search approach found ${combinedResults.length} results`
            );
            return NextResponse.json({
              results: combinedResults,
              status: "OK",
              next_page_token: textSearchData.next_page_token || null,
            });
          }

          // If no results from combined approach, continue with standard search
          console.log(
            "No results from combined approach, falling back to standard search"
          );
        }

        if (exactMatch) {
          // For exact place name searches, use Find Place From Text
          // This is more accurate for finding specific establishments by name
          url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
            query
          )}&inputtype=textquery&fields=formatted_address,name,rating,opening_hours,geometry,photos,place_id,price_level,user_ratings_total,types&key=${apiKey}`;

          // Add location bias if available
          if (locationParts.length === 2) {
            url += `&locationbias=circle:5000@${locationParts[0]},${locationParts[1]}`;
          }

          console.log("Using Find Place From Text API for exact match");
          const response = await fetch(url);
          const data = await response.json();

          // If successful and has candidates, use this response
          if (
            data.status === "OK" &&
            data.candidates &&
            data.candidates.length > 0
          ) {
            console.log("Find Place From Text API returned results");
            // Format the results
            const results = data.candidates.map((place: any) =>
              formatPlace(place)
            );

            return NextResponse.json({
              results,
              status: data.status,
              next_page_token: null,
            });
          } else {
            console.log(
              "Find Place From Text API failed or returned no results, falling back to text search"
            );
            // Fall back to text search
            exactMatch = false;
          }
        }
      } catch (error) {
        console.error(
          "Find Place From Text API error, falling back to text search:",
          error
        );
        exactMatch = false;
      }

      if (!exactMatch) {
        // Regular Text Search for broader searches
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          query
        )}&key=${apiKey}`;

        // Add location if available for better results
        if (locationParts.length === 2) {
          // For specific business names (like Wendys), use a larger radius and business type
          if (query.length < 10 && !query.includes(" ")) {
            console.log("Detected business name search, using larger radius");
            url += `&location=${locationParts[0]},${locationParts[1]}&radius=10000`;

            // For business name searches, include establishment type if no specific type is provided
            if (!type) {
              url += `&type=establishment`;
            }
          } else {
            url += `&location=${locationParts[0]},${locationParts[1]}&radius=5000`;
          }
        }

        // Add type if specified
        if (type) {
          url += `&type=${type}`;
        }
      }
    } else if (location && type) {
      // Nearby Search API for location + type without query
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${locationParts[0]},${locationParts[1]}&radius=5000&key=${apiKey}&type=${type}`;
    } else {
      console.error("Invalid request parameters");
      return NextResponse.json(
        { error: "Either query or location+type must be provided" },
        { status: 400 }
      );
    }

    console.log(
      "Google Places API call:",
      url?.replace(apiKey, "API_KEY_HIDDEN") || ""
    );
    const response = await fetch(url || "");
    const data = await response.json();

    console.log("Google Places API response status:", data.status);

    // Handle API errors
    if (
      data.status !== "OK" &&
      data.status !== "ZERO_RESULTS" &&
      // findplacefromtext returns empty candidates array instead of ZERO_RESULTS
      !(
        exactMatch &&
        data.status === "OK" &&
        (!data.candidates || data.candidates.length === 0)
      )
    ) {
      console.error(
        "Google Places API error:",
        data.status,
        data.error_message
      );
      return NextResponse.json(
        {
          error: `Google Places API error: ${data.status}${
            data.error_message ? " - " + data.error_message : ""
          }`,
        },
        { status: 500 }
      );
    }

    // Format the results
    let results = [];
    if (exactMatch && data.candidates) {
      // Process findplacefromtext response
      results = data.candidates.map((place: any) => formatPlace(place));
    } else if (data.results) {
      // Process textsearch or nearbysearch response
      results = data.results.map((place: any) => formatPlace(place));
    }

    return NextResponse.json({
      results,
      status: data.status,
      next_page_token: data.next_page_token || null,
    });
  } catch (error: any) {
    console.error("Google Places API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch places" },
      { status: 500 }
    );
  }
}

// Helper function to format place results consistently
function formatPlace(place: any) {
  return {
    id: place.place_id || place.id,
    name: place.name,
    address: place.formatted_address || place.vicinity || "Address unavailable",
    location: place.geometry?.location,
    rating: place.rating || 0,
    userRatingsTotal: place.user_ratings_total || 0,
    photos: place.photos
      ? place.photos.map((photo: any) => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height,
          url: `/api/places/photo?photo_reference=${photo.photo_reference}&maxwidth=400`,
        }))
      : [],
    image:
      place.photos && place.photos.length > 0
        ? `/api/places/photo?photo_reference=${place.photos[0].photo_reference}&maxwidth=400`
        : null,
    priceLevel: place.price_level ? "$".repeat(place.price_level) : "N/A",
    openNow: place.opening_hours?.open_now || false,
    types: place.types || [],
    description: getDescription(place.types),
  };
}

// Helper function to generate a description based on place types
function getDescription(types: string[] = []) {
  const typeMap: Record<string, string> = {
    restaurant: "A place to enjoy delicious meals",
    bar: "A place to relax and enjoy drinks",
    cafe: "A cozy place for coffee and snacks",
    tourist_attraction: "A popular destination for visitors",
    hotel: "Accommodation for travelers",
    shopping_mall: "A center with various stores and shops",
    beach: "A beautiful coastal area",
    park: "A green space for recreation",
    spa: "A place for relaxation and treatments",
    museum: "A cultural institution for history and art",
    bakery: "A place for freshly baked goods",
    supermarket: "A large store selling groceries and household items",
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }

  return "A point of interest worth visiting";
}
