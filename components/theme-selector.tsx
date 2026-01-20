"use client";

import { useTheme } from "@/lib/themes/theme-provider";
import { themes } from "@/lib/themes/config";
import { Check } from "lucide-react";

export function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">选择主题</h3>
      <div className="grid gap-3">
        {Object.values(themes).map((theme) => {
          const isActive = currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`relative flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50 ${
                isActive ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{theme.name}</h4>
                  {isActive && (
                    <Check className="size-4 text-primary" />
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {theme.description}
                </p>
              </div>
              <div className="flex gap-1.5">
                <div
                  className="size-6 rounded-full border shadow-sm"
                  style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                />
                <div
                  className="size-6 rounded-full border shadow-sm"
                  style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                />
                <div
                  className="size-6 rounded-full border shadow-sm"
                  style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
