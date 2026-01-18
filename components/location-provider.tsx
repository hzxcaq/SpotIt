"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocations } from "@/lib/db/hooks";

interface LocationContextType {
  currentLocationId: string | undefined;
  setCurrentLocationId: (id: string) => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext must be used within <LocationProvider>");
  return ctx;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocationId, setCurrentLocationId] = useState<string>();
  const locations = useLocations();
  const [initialized, setInitialized] = useState(false);

  const setAndPersistLocationId = useCallback((id: string) => {
    setCurrentLocationId(id);
    localStorage.setItem("spotit_location_id", id);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("spotit_location_id");
    if (saved) {
      setCurrentLocationId(saved);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized || locations.length === 0) return;
    if (currentLocationId && locations.some((l) => l.id === currentLocationId)) return;
    const defaultLoc = locations.find((l) => l.isDefault) || locations[0];
    setAndPersistLocationId(defaultLoc.id);
  }, [initialized, locations, currentLocationId, setAndPersistLocationId]);

  const value = useMemo(
    () => ({ currentLocationId, setCurrentLocationId: setAndPersistLocationId }),
    [currentLocationId, setAndPersistLocationId]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}
