"use client";

/**
 * CitySearch — type-ahead city input powered by Google Places Autocomplete.
 *
 * Falls back to a plain text input if the Google Maps API key is missing,
 * so the rest of the app never breaks.
 *
 * Usage:
 *   <CitySearch value={city} onChange={setCity} placeholder="Search city…" />
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2, X } from "lucide-react";

interface Suggestion {
  placeId: string;
  description: string;        // full string e.g. "Mumbai, Maharashtra, India"
  mainText:    string;         // just the city name e.g. "Mumbai"
}

interface CitySearchProps {
  value:        string;
  onChange:     (city: string) => void;
  placeholder?: string;
  className?:   string;
  autoFocus?:   boolean;
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
const MAPS_OK  = MAPS_KEY && MAPS_KEY !== "YOUR_GOOGLE_MAPS_API_KEY";

// ── Load Google Maps script once ──────────────────────────────────────────────
let scriptLoaded  = false;
let scriptLoading = false;
const callbacks: Array<() => void> = [];

function loadGoogleMaps(key: string): Promise<void> {
  return new Promise(resolve => {
    if (scriptLoaded) { resolve(); return; }
    callbacks.push(resolve);
    if (scriptLoading) return;
    scriptLoading = true;

    const script   = document.createElement("script");
    script.src     = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async   = true;
    script.onload  = () => {
      scriptLoaded = true;
      callbacks.forEach(cb => cb());
    };
    document.head.appendChild(script);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CitySearch({
  value, onChange, placeholder = "Type a city…", className = "", autoFocus,
}: CitySearchProps) {
  const inputRef      = useRef<HTMLInputElement>(null);
  const [query,       setQuery]       = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [open,        setOpen]        = useState(false);
  const [mapsReady,   setMapsReady]   = useState(false);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceRef    = useRef<google.maps.places.AutocompleteService | null>(null);

  // Keep query in sync when value changes externally
  useEffect(() => { setQuery(value); }, [value]);

  // Load Google Maps script
  useEffect(() => {
    if (!MAPS_OK) return;
    loadGoogleMaps(MAPS_KEY).then(() => {
      serviceRef.current = new google.maps.places.AutocompleteService();
      setMapsReady(true);
    });
  }, []);

  // Fetch suggestions (debounced 300ms)
  const fetchSuggestions = useCallback((input: string) => {
    if (!serviceRef.current || !mapsReady || input.length < 2) {
      setSuggestions([]); return;
    }
    setLoading(true);
    serviceRef.current.getPlacePredictions(
      {
        input,
        types:                ["(cities)"],
        componentRestrictions: { country: "in" }, // India only
      },
      (predictions, status) => {
        setLoading(false);
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          setSuggestions([]); return;
        }
        setSuggestions(
          predictions.map(p => ({
            placeId:     p.place_id,
            description: p.description,
            mainText:    p.structured_formatting.main_text,
          }))
        );
        setOpen(true);
      }
    );
  }, [mapsReady]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v.trim()) { onChange(""); setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 300);
  }

  function handleSelect(s: Suggestion) {
    setQuery(s.mainText);
    onChange(s.mainText);
    setSuggestions([]);
    setOpen(false);
  }

  function handleClear() {
    setQuery(""); onChange(""); setSuggestions([]); setOpen(false);
    inputRef.current?.focus();
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.closest(".city-search-wrap")?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const inputClasses = `w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 pr-10 text-white
    placeholder-white/20 outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all text-sm ${className}`;

  // ── Plain fallback if no Maps key ──────────────────────────────────────────
  if (!MAPS_OK) {
    return (
      <div className="relative city-search-wrap">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          autoFocus={autoFocus}
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
          placeholder={placeholder}
          className={`${inputClasses} pl-9`}
        />
        {query && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <p className="text-[10px] text-white/20 mt-1 ml-1">
          Add <code>NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> to .env.local to enable autocomplete.
        </p>
      </div>
    );
  }

  // ── Full autocomplete ──────────────────────────────────────────────────────
  return (
    <div className="relative city-search-wrap">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        autoFocus={autoFocus}
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={`${inputClasses} pl-9`}
      />
      {/* Right icon: spinner or clear */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin" />
        ) : query ? (
          <button onClick={handleClear} className="text-white/25 hover:text-white/60">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 w-full bg-[#13131f] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors ${
                  i !== suggestions.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{s.mainText}</p>
                  <p className="text-white/30 text-[10px]">{s.description.replace(s.mainText + ", ", "")}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
