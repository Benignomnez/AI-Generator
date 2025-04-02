"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Phone,
  Globe,
  Loader2,
  MapIcon,
  Filter,
  TrendingUp,
  X,
  Calendar,
  ChevronDown,
  ChevronRight,
  User,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Photo = {
  reference: string;
  width: number;
  height: number;
  url: string;
};

type Review = {
  authorName: string;
  authorPhoto: string;
  rating: number;
  time: number;
  text: string;
  relativeTime: string;
};

type Place = {
  id: string;
  name: string;
  rating: number;
  address: string;
  image: string;
  photos?: Photo[];
  priceLevel: string;
  openNow: boolean;
  openingHours?: string[];
  phone?: string;
  website?: string;
  types: string[];
  description: string;
  userRatingsTotal?: number;
  reviews?: Review[];
};

type LocationSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export default function TravelGuide() {
  const { toast } = useToast();
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [trendingPlaces, setTrendingPlaces] = useState<Place[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [placeDetailsLoading, setPlaceDetailsLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [locationInputValue, setLocationInputValue] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);
  const locationSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState({
    priceLevel: [] as string[],
    minRating: 0,
    openNow: false,
  });

  // Fetch trending places when coordinates change
  useEffect(() => {
    if (coordinates) {
      fetchTrendingPlaces();
    }
  }, [coordinates, category]);

  // Handle location input changes and fetch suggestions
  const handleLocationInputChange = (value: string) => {
    setLocationInputValue(value);
    setLocation(value);

    // Clear previous timeout
    if (locationSearchTimeoutRef.current) {
      clearTimeout(locationSearchTimeoutRef.current);
    }

    // Only search if we have at least 3 characters
    if (value.length < 3) {
      setLocationSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    // Debounce the search to avoid too many API calls
    locationSearchTimeoutRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
    }, 300);
  };

  // Fetch location suggestions using the Google Places Autocomplete API
  const fetchLocationSuggestions = async (query: string) => {
    try {
      const response = await fetch(
        `/api/places/location-suggestions?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch location suggestions"
        );
      }

      const data = await response.json();

      // Set suggestions and open the dropdown only if we have results
      if (data.suggestions && data.suggestions.length > 0) {
        setLocationSuggestions(data.suggestions);
        setSuggestionsOpen(true);
      } else {
        // No suggestions found
        setLocationSuggestions([]);
        // Only show dropdown with empty state if the response was successful
        // This provides better UX feedback that we searched but found nothing
        setSuggestionsOpen(true);
      }
    } catch (error: any) {
      console.error("Error fetching location suggestions:", error);
      // Don't show error toast for suggestions as it can be distracting
      setLocationSuggestions([]);
      setSuggestionsOpen(false);
    }
  };

  // Handle location selection from suggestions
  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    setLocationInputValue(suggestion.description);
    setLocation(suggestion.description);
    setSuggestionsOpen(false);

    // Automatically geocode the selected location
    geocodeLocation(suggestion.description);
  };

  const geocodeLocation = async (locationText?: string) => {
    const textToGeocode = locationText || location;
    if (!textToGeocode.trim()) return null;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(textToGeocode)}`
      );

      const data = await response.json();

      // Handle 404 Not Found (location not found case)
      if (response.status === 404) {
        toast({
          title: "Location Not Found",
          description:
            "We couldn't find coordinates for this location. Please try a different search.",
          variant: "destructive",
        });
        return null;
      }

      // Handle other non-200 responses
      if (!response.ok) {
        throw new Error(data.error || "Failed to geocode location");
      }

      const coords = {
        lat: data.location.lat,
        lng: data.location.lng,
      };

      setCoordinates(coords);
      return `${coords.lat},${coords.lng}`;
    } catch (error: any) {
      toast({
        title: "Geocoding Error",
        description:
          error.message || "Could not find coordinates for this location",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingPlaces = async () => {
    if (!coordinates) return;

    setTrendingLoading(true);
    try {
      const locationString = `${coordinates.lat},${coordinates.lng}`;
      const response = await fetch(
        `/api/places/trending?location=${locationString}&type=${category}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch trending places");
      }

      const data = await response.json();
      setTrendingPlaces(data.results);
    } catch (error: any) {
      console.error("Error fetching trending places:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch trending places",
        variant: "destructive",
      });
    } finally {
      setTrendingLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to search",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // First geocode the location to get coordinates if not already set
      const locationCoords = coordinates
        ? `${coordinates.lat},${coordinates.lng}`
        : await geocodeLocation();

      if (!locationCoords) {
        setLoading(false);
        return;
      }

      // Then search for places with the given query
      const query = searchQuery.trim() ? searchQuery : category;
      const response = await fetch(
        `/api/places?query=${encodeURIComponent(
          query
        )}&location=${locationCoords}&type=${category}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch places");
      }

      const data = await response.json();
      setPlaces(data.results);
    } catch (error: any) {
      console.error("Error searching for places:", error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to search for places",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed place information including reviews
  const fetchPlaceDetails = async (placeId: string) => {
    setPlaceDetailsLoading(true);

    try {
      const response = await fetch(`/api/places/details?place_id=${placeId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch place details");
      }

      const data = await response.json();
      return data.place;
    } catch (error: any) {
      console.error("Error fetching place details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch place details",
        variant: "destructive",
      });
      return null;
    } finally {
      setPlaceDetailsLoading(false);
    }
  };

  // Handle selecting a place to view details
  const handlePlaceSelect = async (place: Place) => {
    // If we already have reviews, just set the place
    if (place.reviews) {
      setSelectedPlace(place);
      return;
    }

    // Otherwise fetch the details including reviews
    const placeDetails = await fetchPlaceDetails(place.id);
    if (placeDetails) {
      setSelectedPlace({
        ...place,
        ...placeDetails,
      });
    } else {
      // Fallback if we couldn't get details
      setSelectedPlace(place);
    }
  };

  const applyFilters = () => {
    if (!places.length) return;

    return places.filter((place) => {
      // Filter by price level if any price filters are selected
      if (
        filters.priceLevel.length > 0 &&
        !filters.priceLevel.includes(place.priceLevel)
      ) {
        return false;
      }

      // Filter by minimum rating
      if (place.rating < filters.minRating) {
        return false;
      }

      // Filter by open now
      if (filters.openNow && !place.openNow) {
        return false;
      }

      return true;
    });
  };

  const handleFilterChange = (type: string, value: any) => {
    setFilters((prev) => {
      if (type === "priceLevel") {
        const priceLevel = prev.priceLevel.includes(value)
          ? prev.priceLevel.filter((p) => p !== value)
          : [...prev.priceLevel, value];
        return { ...prev, priceLevel };
      }

      if (type === "minRating") {
        return { ...prev, minRating: value };
      }

      if (type === "openNow") {
        return { ...prev, openNow: value };
      }

      return prev;
    });
  };

  const filteredPlaces = applyFilters() || places;

  const formatDate = (timestamp: number) => {
    try {
      return format(new Date(timestamp * 1000), "PPP");
    } catch (error) {
      return "Unknown date";
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <Card className="border shadow-lg h-[calc(100vh-120px)]">
      <CardHeader className="border-b bg-muted/40 px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <MapIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Travel Guide</CardTitle>
            <CardDescription>
              Discover places to visit, eat, and stay
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 overflow-hidden h-[calc(100vh-220px)]">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Popover open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
                <PopoverTrigger asChild>
                  <div className="relative w-full">
                    <Input
                      placeholder="Enter a location (city, neighborhood, etc.)"
                      value={locationInputValue}
                      onChange={(e) =>
                        handleLocationInputChange(e.target.value)
                      }
                      className="w-full pr-10 h-12"
                    />
                    {locationInputValue && (
                      <button
                        type="button"
                        onClick={() => {
                          setLocationInputValue("");
                          setLocation("");
                          setLocationSuggestions([]);
                        }}
                        className="absolute right-10 top-3 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                    <MapPin className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0 w-[var(--radix-popover-trigger-width)]"
                  align="start"
                >
                  <Command>
                    <CommandList>
                      <CommandEmpty>No location found</CommandEmpty>
                      <CommandGroup>
                        {locationSuggestions.map((suggestion) => (
                          <CommandItem
                            key={suggestion.placeId}
                            onSelect={() => handleLocationSelect(suggestion)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {suggestion.mainText}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {suggestion.secondaryText}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurants</SelectItem>
                <SelectItem value="bar">Bars & Nightlife</SelectItem>
                <SelectItem value="cafe">Cafes</SelectItem>
                <SelectItem value="tourist_attraction">Attractions</SelectItem>
                <SelectItem value="hotel">Hotels</SelectItem>
                <SelectItem value="shopping_mall">Shopping</SelectItem>
                <SelectItem value="beach">Beaches</SelectItem>
                <SelectItem value="park">Parks</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="submit"
              disabled={loading || !location.trim()}
              className="h-12"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </form>

          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Options</SheetTitle>
                  <SheetDescription>
                    Refine your search results
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Price Level</h3>
                    <div className="flex gap-4">
                      {["$", "$$", "$$$", "$$$$"].map((price) => (
                        <div
                          key={price}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`price-${price}`}
                            checked={filters.priceLevel.includes(price)}
                            onCheckedChange={(checked) =>
                              handleFilterChange("priceLevel", price)
                            }
                          />
                          <Label htmlFor={`price-${price}`}>{price}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Rating</h3>
                    <div className="space-y-2">
                      {[4, 3, 2, 1].map((rating) => (
                        <div
                          key={rating}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`rating-${rating}`}
                            checked={filters.minRating === rating}
                            onCheckedChange={(checked) =>
                              handleFilterChange(
                                "minRating",
                                checked ? rating : 0
                              )
                            }
                          />
                          <Label
                            htmlFor={`rating-${rating}`}
                            className="flex items-center"
                          >
                            {rating}+ {renderStars(rating)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Open Now</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="open-now"
                        checked={filters.openNow}
                        onCheckedChange={(checked) =>
                          handleFilterChange("openNow", checked)
                        }
                      />
                      <Label htmlFor="open-now">Show only open places</Label>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      // We don't need this button now as filters are applied dynamically
                      // Just close the sheet
                      document.body.click(); // Hacky way to close the sheet
                    }}
                  >
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "grid" | "map")}
              className="hidden md:block"
            >
              <TabsList>
                <TabsTrigger value="grid" className="px-3">
                  <div className="grid grid-cols-3 gap-0.5 h-4 w-4 mr-2">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="bg-current rounded-sm" />
                    ))}
                  </div>
                  Grid
                </TabsTrigger>
                <TabsTrigger value="map" className="px-3">
                  <MapIcon className="h-4 w-4 mr-2" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Trending Places Section */}
        {trendingPlaces.length > 0 && !loading && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Trending {category.replace("_", " ")}s
              </h2>
            </div>
            <ScrollArea className="whitespace-nowrap pb-4">
              <div className="flex gap-4">
                {trendingPlaces.map((place) => (
                  <Card
                    key={place.id}
                    className="w-72 shrink-0 overflow-hidden transition-all hover:shadow-lg cursor-pointer"
                    onClick={() => handlePlaceSelect(place)}
                  >
                    <div className="relative h-40">
                      <img
                        src={place.image || "/placeholder.svg"}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-3 text-white">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {place.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          {renderStars(place.rating)}
                          <span className="text-sm ml-1">
                            {place.rating.toFixed(1)}
                          </span>
                          {place.userRatingsTotal && (
                            <span className="text-xs ml-1">
                              ({place.userRatingsTotal})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <Badge
                          variant={place.openNow ? "default" : "secondary"}
                          className="font-medium text-xs"
                        >
                          {place.openNow ? "Open" : "Closed"}
                        </Badge>
                        {place.priceLevel !== "N/A" && (
                          <Badge
                            variant="outline"
                            className="bg-white/80 text-black font-medium text-xs"
                          >
                            {place.priceLevel}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardFooter className="p-3 flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="text-xs line-clamp-2">
                        {place.address}
                      </span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {trendingLoading && !loading && (
          <div className="mb-6 flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">
              Loading trending places...
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
              <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse"></div>
              <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground">
              Discovering amazing places...
            </p>
          </div>
        )}

        {filteredPlaces.length > 0 && !loading && (
          <div className="h-full">
            <TabsContent value="grid" className="m-0 h-full">
              <ScrollArea className="h-[calc(100vh-440px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlaces.map((place) => (
                    <Card
                      key={place.id}
                      className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
                      onClick={() => handlePlaceSelect(place)}
                    >
                      <div className="relative h-48">
                        <img
                          src={place.image || "/placeholder.svg"}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-3 text-white">
                          <h3 className="font-semibold text-lg line-clamp-1">
                            {place.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            {renderStars(place.rating)}
                            <span className="text-sm ml-1">
                              {place.rating.toFixed(1)}
                            </span>
                            {place.userRatingsTotal && (
                              <span className="text-xs ml-1">
                                ({place.userRatingsTotal})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Badge
                            variant={place.openNow ? "default" : "secondary"}
                            className="font-medium"
                          >
                            {place.openNow ? "Open Now" : "Closed"}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {place.priceLevel}
                              </Badge>
                              {place.types.slice(0, 1).map((type, index) => (
                                <Badge key={index} variant="secondary">
                                  {type.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            <span className="text-sm line-clamp-1">
                              {place.address}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2 text-muted-foreground mt-2">
                            {place.description}
                          </p>

                          {/* Review Preview if available */}
                          {place.reviews && place.reviews.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                <span>{place.reviews.length} reviews</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="map" className="m-0 h-full">
              <div className="relative h-[calc(100vh-320px)] bg-muted rounded-lg overflow-hidden">
                {coordinates ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/search?key=${
                      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
                    }&q=${encodeURIComponent(category)}&center=${
                      coordinates.lat
                    },${coordinates.lng}&zoom=14`}
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Enter a location to view the map
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        )}

        {filteredPlaces.length === 0 && places.length > 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-muted rounded-full p-4 mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No places match your filters</p>
            <p className="text-muted-foreground text-center mt-1">
              Try adjusting your filters or search again
            </p>
          </div>
        )}

        {places.length === 0 && !loading && coordinates && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-muted rounded-full p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No places found</p>
            <p className="text-muted-foreground text-center mt-1">
              Try searching for a different category or location
            </p>
          </div>
        )}

        {selectedPlace && (
          <Sheet
            open={!!selectedPlace}
            onOpenChange={() => setSelectedPlace(null)}
          >
            <SheetContent className="w-full sm:max-w-lg overflow-auto p-0">
              {placeDetailsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="aspect-video overflow-hidden">
                      {selectedPlace.photos &&
                      selectedPlace.photos.length > 0 ? (
                        <img
                          src={selectedPlace.photos[0].url}
                          alt={selectedPlace.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={selectedPlace.image || "/placeholder.svg"}
                          alt={selectedPlace.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-black/50 text-white hover:bg-black/70 hover:text-white rounded-full"
                        onClick={() => setSelectedPlace(null)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-6">
                    <SheetHeader className="mb-4 text-left">
                      <SheetTitle className="text-2xl">
                        {selectedPlace.name}
                      </SheetTitle>
                      <div className="flex items-center flex-wrap gap-2 mt-1">
                        <Badge variant="outline">
                          {selectedPlace.priceLevel}
                        </Badge>
                        <div className="flex items-center">
                          {renderStars(selectedPlace.rating)}
                          <span className="ml-1 text-sm">
                            {selectedPlace.rating.toFixed(1)}
                          </span>
                          {selectedPlace.userRatingsTotal && (
                            <span className="text-xs ml-1">
                              ({selectedPlace.userRatingsTotal})
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={
                            selectedPlace.openNow ? "default" : "secondary"
                          }
                        >
                          {selectedPlace.openNow ? "Open Now" : "Closed"}
                        </Badge>
                      </div>
                    </SheetHeader>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <p>{selectedPlace.address}</p>
                        </div>

                        {selectedPlace.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary shrink-0" />
                            <a
                              href={`tel:${selectedPlace.phone}`}
                              className="hover:underline"
                            >
                              {selectedPlace.phone}
                            </a>
                          </div>
                        )}

                        {selectedPlace.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary shrink-0" />
                            <a
                              href={selectedPlace.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Visit Website
                            </a>
                          </div>
                        )}

                        {selectedPlace.openingHours &&
                          selectedPlace.openingHours.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium mb-1">
                                  {selectedPlace.openNow
                                    ? "Open Now"
                                    : "Closed"}
                                </p>
                                <div className="text-sm space-y-1">
                                  {selectedPlace.openingHours.map(
                                    (hours, index) => (
                                      <p
                                        key={index}
                                        className="text-muted-foreground"
                                      >
                                        {hours}
                                      </p>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Categories Section */}
                      <div>
                        <h3 className="font-medium mb-2">Categories</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlace.types.map((type, index) => (
                            <Badge key={index} variant="outline">
                              {type.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Photo Gallery Section */}
                      {selectedPlace.photos &&
                        selectedPlace.photos.length > 1 && (
                          <div>
                            <h3 className="font-medium mb-2">Photos</h3>
                            <ScrollArea className="whitespace-nowrap pb-2">
                              <div className="flex gap-2">
                                {selectedPlace.photos
                                  .slice(1)
                                  .map((photo, index) => (
                                    <div
                                      key={index}
                                      className="w-24 h-24 rounded-md overflow-hidden shrink-0"
                                    >
                                      <img
                                        src={photo.url}
                                        alt={`${selectedPlace.name} ${
                                          index + 1
                                        }`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                      {/* Reviews Section */}
                      {selectedPlace.reviews &&
                        selectedPlace.reviews.length > 0 && (
                          <div>
                            <h3 className="font-medium mb-3">Reviews</h3>
                            <div className="space-y-4">
                              {selectedPlace.reviews.map((review, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8 border">
                                        {review.authorPhoto ? (
                                          <img
                                            src={review.authorPhoto}
                                            alt={review.authorName}
                                          />
                                        ) : (
                                          <User className="h-4 w-4" />
                                        )}
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-sm">
                                          {review.authorName}
                                        </p>
                                        <div className="flex items-center">
                                          {renderStars(review.rating)}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {review.relativeTime}
                                    </p>
                                  </div>
                                  <p className="text-sm">{review.text}</p>
                                  {index < selectedPlace.reviews.length - 1 && (
                                    <Separator className="mt-4" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <div className="pt-4">
                        <Button
                          className="w-full"
                          onClick={() => {
                            // Open in Google Maps
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                selectedPlace.name
                              )}&query_place_id=${selectedPlace.id}`,
                              "_blank"
                            );
                          }}
                        >
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        )}
      </CardContent>
    </Card>
  );
}
