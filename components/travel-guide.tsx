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
  ChevronLeft,
  User,
  MessageSquare,
  Utensils,
  Umbrella,
  Hotel,
  Wine,
  Coffee,
  Wrench,
  Theater,
  ShoppingBag,
  ChevronUp,
  Bot,
  Crosshair,
  Trash2,
  Compass,
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
  CommandSeparator,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  aiDescription?: string;
  aiRecommendations?: string;
};

type LocationSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  color: string;
}

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
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [trendingScrollIndex, setTrendingScrollIndex] = useState(0);
  const [placesScrollIndex, setPlacesScrollIndex] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    restaurant: 0,
    beach: 0,
    hotel: 0,
    bar: 0,
    cafe: 0,
    services: 0,
    entertainment: 0,
    shopping: 0,
  });
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [popularLocations] = useState<LocationSuggestion[]>([
    {
      placeId: "dom-1",
      description: "Santo Domingo, Dominican Republic",
      mainText: "Santo Domingo",
      secondaryText: "Dominican Republic",
    },
    {
      placeId: "pun-1",
      description: "Punta Cana, Dominican Republic",
      mainText: "Punta Cana",
      secondaryText: "Dominican Republic",
    },
    {
      placeId: "sam-1",
      description: "Samaná, Dominican Republic",
      mainText: "Samaná",
      secondaryText: "Dominican Republic",
    },
    {
      placeId: "san-1",
      description: "Santiago, Dominican Republic",
      mainText: "Santiago",
      secondaryText: "Dominican Republic",
    },
    {
      placeId: "pue-1",
      description: "Puerto Plata, Dominican Republic",
      mainText: "Puerto Plata",
      secondaryText: "Dominican Republic",
    },
    {
      placeId: "las-1",
      description: "Las Terrenas, Dominican Republic",
      mainText: "Las Terrenas",
      secondaryText: "Dominican Republic",
    },
    {
      placeId: "bav-1",
      description: "Bávaro, Dominican Republic",
      mainText: "Bávaro",
      secondaryText: "Dominican Republic",
    },
    {
      placeId: "boc-1",
      description: "Boca Chica, Dominican Republic",
      mainText: "Boca Chica",
      secondaryText: "Dominican Republic",
    },
  ]);
  const [showPopularLocations, setShowPopularLocations] = useState(false);

  // Construct popular categories with dynamic counts
  const popularCategories: CategoryItem[] = [
    {
      id: "restaurant",
      name: "Restaurantes",
      icon: <Utensils className="h-10 w-10" />,
      count: categoryCounts.restaurant,
      color: "bg-red-50 text-red-500",
    },
    {
      id: "beach",
      name: "Playas",
      icon: <Umbrella className="h-10 w-10" />,
      count: categoryCounts.beach,
      color: "bg-blue-50 text-blue-500",
    },
    {
      id: "hotel",
      name: "Hoteles",
      icon: <Hotel className="h-10 w-10" />,
      count: categoryCounts.hotel,
      color: "bg-slate-50 text-slate-500",
    },
    {
      id: "bar",
      name: "Bares",
      icon: <Wine className="h-10 w-10" />,
      count: categoryCounts.bar,
      color: "bg-purple-50 text-purple-500",
    },
    {
      id: "cafe",
      name: "Cafeterías",
      icon: <Coffee className="h-10 w-10" />,
      count: categoryCounts.cafe,
      color: "bg-amber-50 text-amber-500",
    },
    {
      id: "services",
      name: "Servicios",
      icon: <Wrench className="h-10 w-10" />,
      count: categoryCounts.services,
      color: "bg-emerald-50 text-emerald-500",
    },
    {
      id: "entertainment",
      name: "Entretenimiento",
      icon: <Theater className="h-10 w-10" />,
      count: categoryCounts.entertainment,
      color: "bg-pink-50 text-pink-500",
    },
    {
      id: "shopping",
      name: "Compras",
      icon: <ShoppingBag className="h-10 w-10" />,
      count: categoryCounts.shopping,
      color: "bg-green-50 text-green-500",
    },
  ];

  const handleCategoryClick = async (categoryId: string) => {
    console.log("Category clicked:", categoryId);

    if (!coordinates) {
      console.log("No coordinates available - requesting geolocation");

      // Try to request geolocation
      if (navigator.geolocation) {
        toast({
          title: "Detectando ubicación",
          description:
            "Necesitamos tu ubicación para mostrarte lugares cercanos...",
        });

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCoordinates(coords);
            // After setting coordinates, try the category click again
            setTimeout(() => {
              handleCategoryClick(categoryId);
            }, 500);
          },
          (error) => {
            console.error("Geolocation error:", error);
            toast({
              title: "Ubicación requerida",
              description: "Por favor, ingresa una ubicación primero",
              variant: "destructive",
            });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        toast({
          title: "Ubicación requerida",
          description: "Por favor, ingresa una ubicación primero",
          variant: "destructive",
        });
      }
      return;
    }

    // Visual feedback that something is happening
    toast({
      title: "Cargando categoría",
      description: `Buscando lugares en ${categoryId}...`,
    });

    setCategory(categoryId);
    setLoading(true); // Use the main loading state for more visibility

    try {
      console.log("Fetching with coordinates:", coordinates);
      const locationString = `${coordinates.lat},${coordinates.lng}`;
      console.log("API call with:", locationString, categoryId);

      const response = await fetch(
        `/api/places/trending?location=${locationString}&type=${categoryId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch trending places");
      }

      const data = await response.json();
      console.log("Results received:", data.results.length);

      // Update both places and trending places with the results
      setPlaces(data.results);
      setTrendingPlaces(data.results);

      // Force a small delay to ensure DOM is updated before scrolling
      setTimeout(() => {
        const resultsSection = document.querySelector(
          ".travel-results-section"
        );
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    } catch (error: any) {
      console.error("Error fetching category places:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "No se pudieron cargar los lugares para esta categoría",
        variant: "destructive",
      });
    } finally {
      setTrendingLoading(false);
      setLoading(false);
    }
  };

  // Fetch trending places when coordinates change
  useEffect(() => {
    if (coordinates) {
      console.log("Coordinates effect triggered:", coordinates);
      fetchTrendingPlaces();
    }
  }, [coordinates?.lat, coordinates?.lng]); // Use more specific dependencies

  // Effect to handle category change separately
  useEffect(() => {
    if (coordinates && category) {
      console.log("Category effect triggered:", category);
      fetchTrendingPlaces();
    }
  }, [category]);

  // Display a location prompt if no coordinates are set
  useEffect(() => {
    if (!coordinates && !locationInputValue && !loading) {
      // Show the toast only once when component mounts
      const timer = setTimeout(() => {
        toast({
          title: "Ingresa una ubicación",
          description: "Selecciona una ubicación para ver lugares cercanos",
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Handle location input changes and fetch suggestions
  const handleLocationInputChange = (value: string) => {
    console.log("Location input changed:", value);
    setLocationInputValue(value);

    // Always update location state so form submission works
    setLocation(value);

    // Clear previous timeout
    if (locationSearchTimeoutRef.current) {
      clearTimeout(locationSearchTimeoutRef.current);
    }

    // Show popular locations when input is empty or very short
    if (value.length < 2) {
      setLocationSuggestions([]);
      setShowPopularLocations(true);
      setSuggestionsOpen(true);
      return;
    }

    // For longer queries, search after delay
    setSuggestionsOpen(true);
    locationSearchTimeoutRef.current = setTimeout(() => {
      console.log("Searching for location:", value);
      fetchLocationSuggestions(value);
    }, 300);
  };

  // Fetch location suggestions using the Google Places Autocomplete API
  const fetchLocationSuggestions = async (query: string) => {
    console.log("Fetching location suggestions for:", query);

    try {
      // First try using the API
      const response = await fetch(
        `/api/places/location-suggestions?query=${encodeURIComponent(query)}`
      );

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        console.error("API error:", data.error || "Unknown error");
        // Fall back to filtered static data if API fails
        const filteredLocations = popularLocations.filter(
          (loc) =>
            loc.description.toLowerCase().includes(query.toLowerCase()) ||
            loc.mainText.toLowerCase().includes(query.toLowerCase())
        );

        console.log("Falling back to static data:", filteredLocations);
        setLocationSuggestions(filteredLocations);
        setShowPopularLocations(false);
        setSuggestionsOpen(true);
        return;
      }

      if (data.suggestions && data.suggestions.length > 0) {
        console.log("Found suggestions:", data.suggestions.length);
        setLocationSuggestions(data.suggestions);
        setShowPopularLocations(false);
        setSuggestionsOpen(true);
      } else {
        console.log("No suggestions found");
        // If no results from API, see if we have matching static locations
        const filteredLocations = popularLocations.filter(
          (loc) =>
            loc.description.toLowerCase().includes(query.toLowerCase()) ||
            loc.mainText.toLowerCase().includes(query.toLowerCase())
        );

        if (filteredLocations.length > 0) {
          console.log("Using filtered static locations:", filteredLocations);
          setLocationSuggestions(filteredLocations);
        } else {
          setLocationSuggestions([]);
        }

        setShowPopularLocations(false);
        setSuggestionsOpen(true);
      }
    } catch (error) {
      console.error("Error fetching location suggestions:", error);

      // Fall back to filtered static data if API fails
      const filteredLocations = popularLocations.filter(
        (loc) =>
          loc.description.toLowerCase().includes(query.toLowerCase()) ||
          loc.mainText.toLowerCase().includes(query.toLowerCase())
      );

      console.log("Error occurred, using static data:", filteredLocations);
      setLocationSuggestions(filteredLocations);
      setShowPopularLocations(false);
      setSuggestionsOpen(true);
    }
  };

  // Handle location selection from suggestions
  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    console.log("Location selected:", suggestion);

    // Clear all previous state
    setCoordinates(null);
    setPlaces([]);
    setTrendingPlaces([]);
    setCategory("restaurant");
    setLocationSuggestions([]);

    // Set new location
    setSelectedLocation(suggestion);
    setLocationInputValue(suggestion.description);
    setLocation(suggestion.description);
    setSuggestionsOpen(false);
    setShowPopularLocations(false);

    // Clear any filters
    setFilters({
      priceLevel: [],
      minRating: 0,
      openNow: false,
    });

    console.log(
      "Cleared previous state and setting new location:",
      suggestion.description
    );

    // Stop here and request manual geocoding via button click
    toast({
      title: "Location selected",
      description: "Click 'Search' to load places at this location",
    });
  };

  // Update the geocodeLocation function to improve accuracy
  const geocodeLocation = async (locationText?: string) => {
    const textToGeocode = locationText || location;
    if (!textToGeocode.trim()) return null;

    console.log("Geocoding location:", textToGeocode);
    try {
      setLoading(true);
      // Clear previous coordinates to avoid using incorrect cached data
      setCoordinates(null);

      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(
          textToGeocode
        )}&timestamp=${Date.now()}`
      );

      const data = await response.json();
      console.log("Geocode response:", data);

      // Handle 404 Not Found (location not found case)
      if (response.status === 404) {
        console.log("Location not found");
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

      console.log("Setting coordinates:", coords);
      setCoordinates(coords);
      return `${coords.lat},${coords.lng}`;
    } catch (error: any) {
      console.error("Geocoding error:", error);
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
    if (!coordinates) {
      console.log("No coordinates available for fetchTrendingPlaces");
      return;
    }

    console.log("fetchTrendingPlaces called with category:", category);
    setTrendingLoading(true);

    try {
      const locationString = `${coordinates.lat},${coordinates.lng}`;
      console.log("Trending API call with:", locationString, category);

      const response = await fetch(
        `/api/places/trending?location=${locationString}&type=${category}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch trending places");
      }

      const data = await response.json();
      console.log("Trending results received:", data.results.length);
      setTrendingPlaces(data.results);

      // Update the category count when we get trending results
      if (data.totalFound !== undefined && data.category) {
        setCategoryCounts((prev) => ({
          ...prev,
          [data.category]: data.totalFound,
        }));
      }
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
    setShowSearchSuggestions(false);

    console.log("Search initiated with:", {
      location,
      searchQuery,
      coordinates,
    });

    // Validate we have something to search for
    if (!location.trim() && !searchQuery.trim()) {
      toast({
        title: "Search error",
        description: "Please enter a location or search query",
        variant: "destructive",
      });
      return;
    }

    // If this appears to be a specific business search and we have coordinates,
    // use the more precise search method
    if (
      searchQuery &&
      coordinates &&
      searchQuery.length > 2 &&
      !searchQuery.includes(" ")
    ) {
      console.log(
        "Detected specific business search, using optimized search method"
      );
      return searchSpecificPlace(searchQuery);
    }

    try {
      setLoading(true);
      let locationCoords: string | null = null;

      // Only geocode if we don't already have coordinates
      if (location && !coordinates) {
        console.log("Geocoding location before search:", location);
        locationCoords = await geocodeLocation();

        // If geocoding failed, stop search
        if (!locationCoords && !searchQuery) {
          setLoading(false);
          toast({
            title: "Location error",
            description:
              "Could not find coordinates for this location. Please try a different location.",
            variant: "destructive",
          });
          return;
        }
      } else if (coordinates) {
        // Use existing coordinates
        locationCoords = `${coordinates.lat},${coordinates.lng}`;
        console.log("Using existing coordinates:", locationCoords);
      }

      // Create search URL
      let apiUrl = "/api/places/search?";
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append("query", searchQuery);
        params.append("searchType", "textquery");
      }

      if (locationCoords) {
        params.append("location", locationCoords);
      }

      if (category) {
        params.append("type", category);
      }

      // Add timestamp to prevent caching
      params.append("timestamp", Date.now().toString());

      apiUrl += params.toString();
      console.log("Search API URL:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error("Search API error:", response.status);
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch places");
      }

      const data = await response.json();
      console.log("Search results:", data);

      if (data.results && data.results.length > 0) {
        setPlaces(data.results);

        // Reset filters when searching
        setFilters({
          priceLevel: [],
          minRating: 0,
          openNow: false,
        });
      } else {
        setPlaces([]);
        toast({
          title: "No results found",
          description: "Try different search terms or location",
        });
      }

      // Fetch trending places for this location if we have coordinates
      if (locationCoords) {
        fetchTrendingPlaces();
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search error",
        description: error.message || "Failed to fetch places",
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
      const response = await fetch(
        `/api/places/details?place_id=${placeId}&useAI=true`
      );

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

  // Add scroll event listener to show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down 300px
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Function to scroll back to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add floating back to top and category selection UI
  const FloatingControls = () => {
    if (!showBackToTop) return null;

    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Filter className="h-6 w-6 text-primary" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="end">
            <h3 className="font-medium mb-2">Categorías Rápidas</h3>
            <div className="grid grid-cols-2 gap-2">
              {popularCategories.slice(0, 6).map((cat) => (
                <Button
                  key={cat.id}
                  variant="outline"
                  className={cn(
                    "h-auto py-2 px-3 justify-start gap-2 text-left",
                    cat.id === category && "border-primary"
                  )}
                  onClick={() => {
                    handleCategoryClick(cat.id);
                  }}
                >
                  <div className={`rounded-full p-1 ${cat.color}`}>
                    {React.cloneElement(cat.icon as React.ReactElement, {
                      className: "h-4 w-4",
                    })}
                  </div>
                  <span className="truncate">{cat.name}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <div
          className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={scrollToTop}
        >
          <ChevronUp className="h-6 w-6 text-primary" />
        </div>
      </div>
    );
  };

  // Handle touch swipe gestures for scrolling
  useEffect(() => {
    const handleTouchSwipe = () => {
      const scrollAreas = [
        document.querySelector(
          "#trending-scroll-area [data-radix-scroll-area-viewport]"
        ),
        document.querySelector(
          "#places-scroll-area [data-radix-scroll-area-viewport]"
        ),
      ];

      scrollAreas.forEach((scrollArea) => {
        if (!scrollArea) return;

        let startX: number;
        let startScrollLeft: number;

        const onTouchStart = (e: TouchEvent) => {
          startX = e.touches[0].clientX;
          startScrollLeft = scrollArea.scrollLeft;
        };

        const onTouchMove = (e: TouchEvent) => {
          if (!startX) return;

          const x = e.touches[0].clientX;
          const distance = startX - x;
          scrollArea.scrollLeft = startScrollLeft + distance;
        };

        const onTouchEnd = () => {
          startX = null as any;
        };

        scrollArea.addEventListener("touchstart", onTouchStart);
        scrollArea.addEventListener("touchmove", onTouchMove);
        scrollArea.addEventListener("touchend", onTouchEnd);

        return () => {
          scrollArea.removeEventListener("touchstart", onTouchStart);
          scrollArea.removeEventListener("touchmove", onTouchMove);
          scrollArea.removeEventListener("touchend", onTouchEnd);
        };
      });
    };

    // Set a timeout to ensure the DOM elements are available
    const timeout = setTimeout(handleTouchSwipe, 1000);

    return () => clearTimeout(timeout);
  }, [trendingPlaces.length, filteredPlaces.length]);

  // Function to render a swipe hint indicator
  const SwipeIndicator = () => (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground my-2">
      <div className="flex items-center bg-muted/30 px-3 py-1 rounded-full">
        <div className="relative w-5 h-5">
          <span className="absolute left-0 top-0 h-5 w-5 animate-ping opacity-30">
            <ChevronLeft className="h-5 w-5" />
          </span>
          <ChevronLeft className="h-5 w-5" />
        </div>
        <span className="mx-2">Deslizar</span>
        <div className="relative w-5 h-5">
          <span className="absolute left-0 top-0 h-5 w-5 animate-ping opacity-30">
            <ChevronRight className="h-5 w-5" />
          </span>
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </div>
  );

  // Effect to track scroll position and update indicators
  useEffect(() => {
    const handleScrollPositionUpdate = () => {
      const trendingArea = document.querySelector(
        "#trending-scroll-area [data-radix-scroll-area-viewport]"
      );
      const placesArea = document.querySelector(
        "#places-scroll-area [data-radix-scroll-area-viewport]"
      );

      if (trendingArea) {
        const handleTrendingScroll = () => {
          const cardWidth = 288; // 272px card + 16px gap
          const scrollPosition = trendingArea.scrollLeft;
          const currentIndex = Math.round(scrollPosition / (cardWidth * 3));
          setTrendingScrollIndex(currentIndex);
        };

        trendingArea.addEventListener("scroll", handleTrendingScroll);
        return () =>
          trendingArea.removeEventListener("scroll", handleTrendingScroll);
      }

      if (placesArea) {
        const handlePlacesScroll = () => {
          const cardWidth = 288; // 272px card + 16px gap
          const scrollPosition = placesArea.scrollLeft;
          const currentIndex = Math.round(scrollPosition / (cardWidth * 3));
          setPlacesScrollIndex(currentIndex);
        };

        placesArea.addEventListener("scroll", handlePlacesScroll);
        return () =>
          placesArea.removeEventListener("scroll", handlePlacesScroll);
      }
    };

    // Set a timeout to ensure the DOM elements are available
    const timeout = setTimeout(handleScrollPositionUpdate, 1000);

    return () => clearTimeout(timeout);
  }, [trendingPlaces.length, filteredPlaces.length]);

  // Effect to fetch category counts when coordinates are available
  useEffect(() => {
    if (coordinates) {
      fetchCategoryCounts();
    }
  }, [coordinates?.lat, coordinates?.lng]);

  // Function to fetch and update category counts
  const fetchCategoryCounts = async () => {
    if (!coordinates?.lat || !coordinates?.lng) return;

    try {
      // Create location string from coordinates
      const locationStr = `${coordinates.lat},${coordinates.lng}`;

      // List of all categories we want to fetch counts for
      const categories = [
        "restaurant",
        "beach",
        "hotel",
        "bar",
        "cafe",
        "services",
        "entertainment",
        "shopping",
      ];

      // Use Promise.all to fetch all category counts in parallel
      const countPromises = categories.map((category) =>
        fetch(
          `/api/places/trending?location=${locationStr}&type=${category}&countOnly=true`
        )
          .then((res) => res.json())
          .then((data) => ({ category, count: data.totalFound || 0 }))
          .catch((err) => {
            console.error(`Error fetching count for ${category}:`, err);
            return { category, count: 0 };
          })
      );

      const results = await Promise.all(countPromises);

      // Update state with all the counts
      const newCounts = { ...categoryCounts };
      results.forEach((result) => {
        newCounts[result.category as keyof typeof categoryCounts] =
          result.count;
      });

      setCategoryCounts(newCounts);
    } catch (error) {
      console.error("Error fetching category counts:", error);
    }
  };

  // Add a function to get AI suggestions
  const getAISuggestions = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enter a location to get suggestions",
        variant: "destructive",
      });
      return;
    }

    setAiSuggestionsLoading(true);
    setAiSuggestions([]);

    try {
      const response = await fetch("/api/places/ai-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Model: "gemini-1.5-flash",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
          location: location,
          query: searchQuery,
          interests: [category],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI suggestions");
      }

      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
      setAiSuggestionsOpen(true);
    } catch (error: any) {
      console.error("Error getting AI suggestions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI suggestions",
        variant: "destructive",
      });
    } finally {
      setAiSuggestionsLoading(false);
    }
  };

  // Add a state for search suggestions and search query timeout around line 80
  const [searchQuerySuggestions, setSearchQuerySuggestions] = useState<
    string[]
  >([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchQueryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add default search suggestions for common queries
  const defaultSearchSuggestions = [
    "Restaurants",
    "Hotels",
    "Coffee shops",
    "Attractions",
    "Beaches",
    "Bars",
    "Museums",
    "Shopping",
  ];

  // Add a function to get search suggestions around line 670
  // Function to get search suggestions based on input
  const getSearchSuggestions = (query: string) => {
    if (!query.trim()) {
      setSearchQuerySuggestions(defaultSearchSuggestions);
      return;
    }

    // Filter default suggestions first
    const filteredDefaults = defaultSearchSuggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(query.toLowerCase())
    );

    // Add specific businesses or places based on location and query
    if (coordinates && query.length >= 2) {
      // For demonstration, we can add specific suggestions based on the query
      // In a real app, this would call an autocomplete API
      const locationQuery = `${query} in ${location || "this area"}`;

      // Generate dynamic suggestions
      const dynamicSuggestions = [
        query,
        `Best ${query}`,
        `${query} near me`,
        locationQuery,
      ];

      // Combine and deduplicate
      const allSuggestions = Array.from(
        new Set([...filteredDefaults, ...dynamicSuggestions])
      );

      setSearchQuerySuggestions(allSuggestions.slice(0, 8)); // Limit to 8 suggestions
    } else {
      // Just use filtered defaults if no coordinates
      setSearchQuerySuggestions(filteredDefaults);
    }
  };

  // Add a click handler on the document to close suggestions when clicking outside
  // Add this effect around line 275
  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector(".search-container");
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add this helper function near top of the component, before render function
  const searchSpecificPlace = async (placeName: string) => {
    if (!coordinates || !placeName) return;

    console.log("Searching for specific place:", placeName);
    setLoading(true);

    try {
      // Create more specific search URL with exact text matching
      const locationStr = `${coordinates.lat},${coordinates.lng}`;
      const apiUrl = `/api/places/search?query=${encodeURIComponent(
        placeName
      )}&location=${locationStr}&timestamp=${Date.now()}`;

      console.log("Specific place search URL:", apiUrl);

      let response = await fetch(apiUrl);
      let data;

      if (!response.ok) {
        console.log("Specific place search failed, trying standard search");
        // If the specific search fails, try a standard search as fallback
        const fallbackUrl = `/api/places/search?query=${encodeURIComponent(
          placeName
        )}&location=${locationStr}&type=establishment&timestamp=${Date.now()}`;
        response = await fetch(fallbackUrl);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch specific place");
        }
      }

      data = await response.json();
      console.log("Specific place search results:", data);

      if (data.results && data.results.length > 0) {
        setPlaces(data.results);

        // Find best match (case insensitive, partial matches included)
        const bestMatch = data.results.find(
          (place: Place) =>
            place.name.toLowerCase() === placeName.toLowerCase() ||
            place.name.toLowerCase().includes(placeName.toLowerCase()) ||
            placeName.toLowerCase().includes(place.name.toLowerCase())
        );

        if (bestMatch) {
          console.log("Found best match:", bestMatch.name);
          // Scroll to the match with a small delay
          setTimeout(() => {
            handlePlaceSelect(bestMatch);
          }, 500);
        }
      } else {
        // Fall back to regular search
        console.log("No specific results, falling back to regular search");
        handleSearch({
          preventDefault: () => {},
        } as React.FormEvent);
      }
    } catch (error) {
      console.error("Error searching for specific place:", error);
      // Fall back to regular search
      handleSearch({
        preventDefault: () => {},
      } as React.FormEvent);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border shadow-lg h-[calc(100vh-120px)]">
      {/* Floating back to top button */}
      <FloatingControls />
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

      <CardContent className="p-0 overflow-hidden h-[calc(100vh-220px)] flex flex-col">
        {/* Search section - sticky only until scrolled past */}
        <div
          className="p-6 bg-background"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            borderBottom: showBackToTop ? "1px solid var(--border)" : "none",
            boxShadow: showBackToTop
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              : "none",
          }}
        >
          <form onSubmit={handleSearch} className="flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Selection - remain the same */}
              <div className="relative flex items-center bg-white dark:bg-gray-950 rounded-lg border shadow-sm overflow-hidden">
                <div className="absolute left-3 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                </div>
                <Input
                  placeholder="Select a location"
                  value={locationInputValue}
                  onChange={(e) => handleLocationInputChange(e.target.value)}
                  onFocus={() => {
                    setShowPopularLocations(true);
                    setSuggestionsOpen(true);
                  }}
                  className="w-full pl-10 h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {locationInputValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationInputValue("");
                      setLocation("");
                      setLocationSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Search Query Input - remain the same */}
              <div className="relative flex items-center search-container">
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 relative flex items-center bg-white dark:bg-gray-950 rounded-l-lg border border-r-0 shadow-sm overflow-hidden">
                    <div className="absolute left-3 text-muted-foreground">
                      <Search className="h-5 w-5" />
                    </div>
                    <Input
                      placeholder="Search restaurants, hotels, places..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);

                        // Clear previous timeout
                        if (searchQueryTimeoutRef.current) {
                          clearTimeout(searchQueryTimeoutRef.current);
                        }

                        // If search query is not empty, get suggestions
                        if (e.target.value.trim()) {
                          setShowSearchSuggestions(true);
                          console.log("Search query set to:", e.target.value);

                          // Debounce the search suggestions
                          searchQueryTimeoutRef.current = setTimeout(() => {
                            getSearchSuggestions(e.target.value);
                          }, 300);
                        } else {
                          // If empty, show default suggestions
                          setSearchQuerySuggestions(defaultSearchSuggestions);
                          setShowSearchSuggestions(true);
                        }
                      }}
                      onFocus={() => {
                        // Show suggestions on focus
                        if (searchQuery.trim()) {
                          getSearchSuggestions(searchQuery);
                        } else {
                          setSearchQuerySuggestions(defaultSearchSuggestions);
                        }
                        setShowSearchSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          setShowSearchSuggestions(false);
                          handleSearch(e);
                        }
                      }}
                      className="w-full pl-10 h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={
                      loading || (!location.trim() && !searchQuery.trim())
                    }
                    className="h-12 rounded-l-none"
                    onClick={() => setShowSearchSuggestions(false)}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Controls and Filters Row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {locationInputValue && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 pl-2 pr-3 py-1.5"
                  >
                    <MapPin className="h-3 w-3 text-primary" />
                    <span>{locationInputValue}</span>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 pl-2 pr-3 py-1.5"
                  >
                    <Search className="h-3 w-3 text-primary" />
                    <span>{searchQuery}</span>
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 items-center">
                <Select
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value);
                    if (coordinates) {
                      setTimeout(() => {
                        handleCategoryClick(value);
                      }, 10);
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurants</SelectItem>
                    <SelectItem value="bar">Bars & Nightlife</SelectItem>
                    <SelectItem value="cafe">Cafes</SelectItem>
                    <SelectItem value="tourist_attraction">
                      Attractions
                    </SelectItem>
                    <SelectItem value="hotel">Hotels</SelectItem>
                    <SelectItem value="shopping_mall">Shopping</SelectItem>
                    <SelectItem value="beach">Beaches</SelectItem>
                    <SelectItem value="park">Parks</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  width="fit"
                  className={`h-9 gap-2 relative transition-all duration-300 ${
                    !location
                      ? "opacity-70"
                      : "hover:bg-primary hover:text-primary-foreground"
                  }`}
                  disabled={!location || aiSuggestionsLoading}
                  onClick={getAISuggestions}
                >
                  <div
                    className={`flex items-center ${
                      location && !aiSuggestionsLoading ? "animate-pulse" : ""
                    }`}
                  >
                    {aiSuggestionsLoading ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Bot className="h-4.5 w-4.5" />
                    )}
                  </div>
                  <span className="sm:inline font-medium whitespace-nowrap">
                    AI Suggestions
                  </span>
                  {location && !aiSuggestionsLoading && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary"></span>
                    </span>
                  )}
                </Button>

                <Tabs
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as "grid" | "map")}
                  className="hidden md:flex"
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

                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      width="fit"
                      className="h-9"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline whitespace-nowrap">
                        Filters
                      </span>
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
                          <Label htmlFor="open-now">
                            Show only open places
                          </Label>
                        </div>
                      </div>

                      <Button
                        width="fit"
                        className="w-full"
                        onClick={() => {
                          document.body.click(); // Close the sheet
                        }}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </form>

          {/* Search Suggestions Dropdown */}
          {showSearchSuggestions && searchQuerySuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 top-[60px] md:left-[50%] md:right-0 w-full md:w-[calc(50%-1rem)] max-w-md bg-white dark:bg-gray-950 border rounded-lg shadow-lg overflow-hidden">
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                  {searchQuery.trim()
                    ? "Search Suggestions"
                    : "Popular Searches"}
                </div>
                <div className="space-y-1">
                  {searchQuerySuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-md"
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSearchSuggestions(false);
                        // Submit form on small delay
                        setTimeout(() => {
                          handleSearch({
                            preventDefault: () => {},
                          } as React.FormEvent);
                        }, 100);
                      }}
                    >
                      <Search className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Location Suggestions Dropdown */}
          {(suggestionsOpen ||
            showPopularLocations ||
            locationSuggestions.length > 0) && (
            <div className="absolute z-50 mt-1 md:w-[calc(50%-1rem)] w-full max-w-md bg-white dark:bg-gray-950 border rounded-lg shadow-lg overflow-hidden">
              <div className="p-2">
                {locationInputValue.length === 0 ? (
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                    Popular Locations
                  </div>
                ) : locationSuggestions.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">
                    No locations found. Try another search term.
                  </div>
                ) : (
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                    Search Results
                  </div>
                )}

                {(locationInputValue.length === 0 || showPopularLocations) && (
                  <div className="space-y-1">
                    {popularLocations.map((suggestion) => (
                      <button
                        key={suggestion.placeId}
                        className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-md"
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <div className="overflow-hidden">
                          <div className="font-medium text-sm truncate">
                            {suggestion.mainText}
                          </div>
                          {suggestion.secondaryText && (
                            <div className="text-xs text-muted-foreground truncate">
                              {suggestion.secondaryText}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {locationSuggestions.length > 0 && (
                  <div className="space-y-1">
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId}
                        className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-md"
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <div className="overflow-hidden">
                          <div className="font-medium text-sm truncate">
                            {suggestion.mainText}
                          </div>
                          {suggestion.secondaryText && (
                            <div className="text-xs text-muted-foreground truncate">
                              {suggestion.secondaryText}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t mt-2 pt-2 flex flex-col gap-2">
                  <button
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-md text-blue-500"
                    onClick={() => {
                      if (navigator.geolocation) {
                        toast({
                          title: "Requesting location",
                          description:
                            "Please allow access to your location when prompted",
                        });
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const coords = {
                              lat: position.coords.latitude,
                              lng: position.coords.longitude,
                            };

                            // Clear all state first
                            setPlaces([]);
                            setTrendingPlaces([]);
                            setCategory("restaurant");

                            setCoordinates(coords);
                            console.log(
                              "Setting coordinates from browser geolocation:",
                              coords
                            );

                            fetch(
                              `/api/geocode/reverse?lat=${coords.lat}&lng=${
                                coords.lng
                              }&timestamp=${Date.now()}`
                            )
                              .then((response) => response.json())
                              .then((data) => {
                                if (data.address) {
                                  setLocationInputValue(data.address);
                                  setLocation(data.address);
                                  setSuggestionsOpen(false);
                                  setShowPopularLocations(false);

                                  toast({
                                    title: "Location detected",
                                    description: `Your location: ${data.address}`,
                                  });
                                }
                              })
                              .catch(console.error);
                          },
                          (error) => {
                            console.error("Geolocation error:", error);
                            toast({
                              title: "Location error",
                              description:
                                "Could not get your location. Please try entering it manually.",
                              variant: "destructive",
                            });
                          }
                        );
                      }
                    }}
                  >
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">Use my current location</span>
                  </button>

                  <button
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-md text-blue-500"
                    onClick={() => {
                      // Clear location but leave text for editing
                      setCoordinates(null);
                      setPlaces([]);
                      setTrendingPlaces([]);
                      const userInput = prompt(
                        "Enter coordinates (latitude,longitude):"
                      );
                      if (userInput) {
                        const parts = userInput.split(",").map((p) => p.trim());
                        if (
                          parts.length === 2 &&
                          !isNaN(parseFloat(parts[0])) &&
                          !isNaN(parseFloat(parts[1]))
                        ) {
                          const coords = {
                            lat: parseFloat(parts[0]),
                            lng: parseFloat(parts[1]),
                          };
                          setCoordinates(coords);
                          console.log("Setting manual coordinates:", coords);

                          fetch(
                            `/api/geocode/reverse?lat=${coords.lat}&lng=${
                              coords.lng
                            }&timestamp=${Date.now()}`
                          )
                            .then((response) => response.json())
                            .then((data) => {
                              if (data.address) {
                                setLocationInputValue(data.address);
                                setLocation(data.address);
                                setSuggestionsOpen(false);
                                setShowPopularLocations(false);
                                fetchTrendingPlaces();
                              }
                            })
                            .catch(console.error);
                        } else {
                          toast({
                            title: "Invalid format",
                            description:
                              "Please enter coordinates as latitude,longitude (e.g., 40.7128,-74.006)",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                  >
                    <Crosshair className="h-4 w-4 shrink-0" />
                    <span className="truncate">Enter coordinates manually</span>
                  </button>

                  <button
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-md text-destructive"
                    onClick={() => {
                      setLocationInputValue("");
                      setLocation("");
                      setCoordinates(null);
                      setPlaces([]);
                      setTrendingPlaces([]);
                      setLocationSuggestions([]);
                      setCategory("restaurant");
                      setSuggestionsOpen(false);
                      setShowPopularLocations(false);
                      toast({
                        title: "Location cleared",
                        description: "All location data has been reset",
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">Clear location</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content area - scrollable */}
        <div className="flex-1 overflow-auto p-6 pt-0">
          {/* Popular Categories Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              Categorías Populares
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 overflow-x-auto pb-2">
              {popularCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 active:scale-95 active:opacity-80 ${
                    cat.id === category
                      ? "ring-2 ring-primary shadow-md border-primary/70"
                      : "hover:translate-y-[-3px]"
                  }`}
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  <div
                    className={`p-6 flex flex-col justify-center items-center transition-colors ${cat.color}`}
                  >
                    <div className="mb-2">{cat.icon}</div>
                    <div className="text-center">
                      <h3 className="font-medium">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cat.count} lugares
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Places Section */}
          {trendingPlaces.length > 0 && !loading && (
            <div className="mb-6 travel-results-section">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  {category
                    .replace("_", " ")
                    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())}{" "}
                  Populares
                </h2>
              </div>
              <SwipeIndicator />
              <ScrollArea
                className="whitespace-nowrap pb-4 relative"
                id="trending-scroll-area"
              >
                <div className="flex gap-4 px-1 pb-1">
                  {trendingPlaces.map((place) => (
                    <Card
                      key={place.id}
                      className="w-72 shrink-0 overflow-hidden transition-all hover:shadow-lg hover:border-primary/40 cursor-pointer group"
                      onClick={() => handlePlaceSelect(place)}
                    >
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={place.image || "/placeholder.svg"}
                          alt={place.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            // Replace broken images with placeholder
                            (e.target as HTMLImageElement).src =
                              "/placeholder.svg";
                            console.log("Image failed to load:", place.image);
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-3 text-white">
                          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary-foreground transition-colors">
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

                {/* Scroll indicators */}
                <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1 py-1">
                  {Array.from({
                    length: Math.ceil(trendingPlaces.length / 3),
                  }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-6 rounded-full transition-colors ${
                        i === trendingScrollIndex
                          ? "bg-primary"
                          : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                      }`}
                      onClick={() => {
                        const scrollContainer = document.querySelector(
                          "#trending-scroll-area [data-radix-scroll-area-viewport]"
                        );
                        if (scrollContainer) {
                          const cardWidth = 288; // 272px card + 16px gap
                          const scrollPosition = i * cardWidth * 3;
                          scrollContainer.scrollTo({
                            left: scrollPosition,
                            behavior: "smooth",
                          });
                          setTrendingScrollIndex(i);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </div>

                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 rounded-r-full p-1 shadow-md text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center z-10 w-8 h-8 min-w-8 min-h-8"
                  onClick={() => {
                    const scrollContainer = document.querySelector(
                      "#trending-scroll-area [data-radix-scroll-area-viewport]"
                    );
                    if (scrollContainer) {
                      const cardWidth = 288; // 272px card + 16px gap
                      scrollContainer.scrollBy({
                        left: -cardWidth * 2,
                        behavior: "smooth",
                      });
                    }
                  }}
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 rounded-l-full p-1 shadow-md text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center z-10 w-8 h-8 min-w-8 min-h-8"
                  onClick={() => {
                    const scrollContainer = document.querySelector(
                      "#trending-scroll-area [data-radix-scroll-area-viewport]"
                    );
                    if (scrollContainer) {
                      const cardWidth = 288; // 272px card + 16px gap
                      scrollContainer.scrollBy({
                        left: cardWidth * 2,
                        behavior: "smooth",
                      });
                    }
                  }}
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </ScrollArea>
            </div>
          )}

          {(trendingLoading || loading) && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse"></div>
                <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-primary" />
              </div>
              <p className="text-muted-foreground">
                {category
                  ? `Buscando ${category.replace(
                      "_",
                      " "
                    )} populares cerca de ti...`
                  : "Descubriendo lugares increíbles..."}
              </p>
            </div>
          )}

          {!coordinates && !loading && (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <MapPin className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Find Places to Visit</h3>
              <p className="text-muted-foreground max-w-[260px]">
                Select a location to discover popular places nearby
              </p>
            </div>
          )}

          {filteredPlaces.length > 0 && !loading && (
            <div className="h-full travel-results-section">
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
                            loading="lazy"
                            onError={(e) => {
                              // Replace broken images with placeholder
                              (e.target as HTMLImageElement).src =
                                "/placeholder.svg";
                              console.log("Image failed to load:", place.image);
                            }}
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

              {/* Responsive alternative for smaller screens */}
              <div className="block md:hidden mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Desliza para ver más lugares
                </h3>
                <SwipeIndicator />
                <ScrollArea
                  className="whitespace-nowrap pb-4 relative"
                  id="places-scroll-area"
                >
                  <div className="flex gap-4 px-1 pb-1">
                    {filteredPlaces.map((place) => (
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
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder.svg";
                            }}
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
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            <Badge
                              variant={place.openNow ? "default" : "secondary"}
                              className="font-medium text-xs"
                            >
                              {place.openNow ? "Open" : "Closed"}
                            </Badge>
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

                  {/* Scroll indicators */}
                  <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1 py-1">
                    {Array.from({
                      length: Math.ceil(filteredPlaces.length / 3),
                    }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-6 rounded-full transition-colors ${
                          i === placesScrollIndex
                            ? "bg-primary"
                            : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                        }`}
                        onClick={() => {
                          const scrollContainer = document.querySelector(
                            "#places-scroll-area [data-radix-scroll-area-viewport]"
                          );
                          if (scrollContainer) {
                            const cardWidth = 288; // 272px card + 16px gap
                            const scrollPosition = i * cardWidth * 3;
                            scrollContainer.scrollTo({
                              left: scrollPosition,
                              behavior: "smooth",
                            });
                            setPlacesScrollIndex(i);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                  </div>

                  <button
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 rounded-r-full p-1 shadow-md text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center z-10 w-8 h-8 min-w-8 min-h-8"
                    onClick={() => {
                      const scrollContainer = document.querySelector(
                        "#places-scroll-area [data-radix-scroll-area-viewport]"
                      );
                      if (scrollContainer) {
                        const cardWidth = 288; // 272px card + 16px gap
                        scrollContainer.scrollBy({
                          left: -cardWidth * 2,
                          behavior: "smooth",
                        });
                      }
                    }}
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 rounded-l-full p-1 shadow-md text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center z-10 w-8 h-8 min-w-8 min-h-8"
                    onClick={() => {
                      const scrollContainer = document.querySelector(
                        "#places-scroll-area [data-radix-scroll-area-viewport]"
                      );
                      if (scrollContainer) {
                        const cardWidth = 288; // 272px card + 16px gap
                        scrollContainer.scrollBy({
                          left: cardWidth * 2,
                          behavior: "smooth",
                        });
                      }
                    }}
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </ScrollArea>
              </div>

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
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
              <p className="text-lg font-medium">
                No places match your filters
              </p>
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
                            onError={(e) => {
                              // Replace broken images with placeholder
                              (e.target as HTMLImageElement).src =
                                "/placeholder.svg";
                              console.log(
                                "Photo failed to load:",
                                selectedPlace.photos?.[0]?.url
                              );
                            }}
                          />
                        ) : (
                          <img
                            src={selectedPlace.image || "/placeholder.svg"}
                            alt={selectedPlace.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Replace broken images with placeholder
                              (e.target as HTMLImageElement).src =
                                "/placeholder.svg";
                            }}
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

                        {/* AI-generated description */}
                        {selectedPlace.aiDescription && (
                          <div>
                            <h3 className="font-medium mb-2">
                              About this place
                            </h3>
                            <p className="text-sm">
                              {selectedPlace.aiDescription}
                            </p>
                          </div>
                        )}

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

                        {/* AI-generated recommendations */}
                        {selectedPlace.aiRecommendations && (
                          <div>
                            <h3 className="font-medium mb-2">
                              Tips & Recommendations
                            </h3>
                            <div
                              className="text-sm space-y-1"
                              dangerouslySetInnerHTML={{
                                __html: selectedPlace.aiRecommendations,
                              }}
                            />
                          </div>
                        )}

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
                                          loading="lazy"
                                          onError={(e) => {
                                            // Replace broken images with placeholder
                                            (e.target as HTMLImageElement).src =
                                              "/placeholder.svg";
                                            console.log(
                                              "Gallery photo failed to load:",
                                              photo.url
                                            );
                                          }}
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
                                              onError={(e) => {
                                                // If profile photo fails, replace with User icon
                                                e.currentTarget.style.display =
                                                  "none";
                                                const parent =
                                                  e.currentTarget.parentElement;
                                                if (parent) {
                                                  const userIcon =
                                                    document.createElement(
                                                      "div"
                                                    );
                                                  userIcon.className =
                                                    "h-full w-full flex items-center justify-center";
                                                  userIcon.innerHTML =
                                                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user h-4 w-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                                                  parent.appendChild(userIcon);
                                                }
                                              }}
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
                                    {index <
                                      selectedPlace.reviews.length - 1 && (
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

                        {/* After the Categories Section in the selected place details dialog */}
                        {selectedPlace?.aiDescription && (
                          <div className="mt-4">
                            <h3 className="font-medium mb-2">AI Description</h3>
                            <p className="text-sm">
                              {selectedPlace.aiDescription}
                            </p>
                          </div>
                        )}

                        {selectedPlace?.aiRecommendations && (
                          <div className="mt-4">
                            <h3 className="font-medium mb-2">
                              Tips & Recommendations
                            </h3>
                            <div
                              className="text-sm space-y-1"
                              dangerouslySetInnerHTML={{
                                __html: selectedPlace.aiRecommendations,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>
          )}

          {/* AI Suggestions Dialog */}
          <Dialog open={aiSuggestionsOpen} onOpenChange={setAiSuggestionsOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI Travel Suggestions
                </DialogTitle>
                <DialogDescription>
                  Personalized recommendations for {location}
                </DialogDescription>
              </DialogHeader>
              {aiSuggestions.length > 0 ? (
                <div className="space-y-4 mt-4 overflow-y-auto pr-2 flex-1 max-h-[calc(80vh-150px)]">
                  {aiSuggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/50"
                      onClick={() => {
                        // Set search query to the place name
                        setSearchQuery(suggestion.name);

                        // Close the dialog
                        setAiSuggestionsOpen(false);

                        // Use the specific place search function
                        searchSpecificPlace(suggestion.name);
                      }}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base text-primary-foreground">
                              {suggestion.name}
                            </CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {suggestion.type}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            width="fit"
                            className="h-8 w-8 rounded-full bg-muted/80 text-primary hover:bg-primary/20"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent event bubbling
                              setSearchQuery(suggestion.name);
                              setAiSuggestionsOpen(false);
                              searchSpecificPlace(suggestion.name);
                            }}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                          {suggestion.reason}
                        </p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          width="fit"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling
                            setSearchQuery(suggestion.name);
                            setAiSuggestionsOpen(false);
                            searchSpecificPlace(suggestion.name);
                          }}
                        >
                          Search this place
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px]">
                  <Bot className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No suggestions available
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
