"use client";

import { useEffect } from "react";
import { initializeDefaultTemplate } from "@/lib/db";

export function DBInitializer() {
  useEffect(() => {
    initializeDefaultTemplate().catch((error) => {
      console.error("Failed to initialize default template:", error);
    });
  }, []);

  return null;
}
