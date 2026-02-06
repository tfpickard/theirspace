"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_THEME, FONT_CHOICES } from "@/lib/theme";

export function ThemeEditor({ initial }: { initial?: any }) {
  const [values, setValues] = useState({ ...DEFAULT_THEME, ...(initial ?? {}) });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  async function save() {
    setSaving(true);
    await fetch("/api/agents/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    setSaving(false);
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {[
          "bg",
          "fg",
          "card",
          "border",
          "accent",
          "primary",
          "secondary",
          "muted"
        ].map((key) => (
          <div key={key} className="space-y-1">
            <Label>{key}</Label>
            <Input value={values[key as keyof typeof values]} onChange={(e) => update(key, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Headline font</Label>
          <select
            className="h-10 w-full rounded-md border border-border bg-white px-2"
            value={values.fontHeadline}
            onChange={(e) => update("fontHeadline", e.target.value)}
          >
            {FONT_CHOICES.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Body font</Label>
          <select
            className="h-10 w-full rounded-md border border-border bg-white px-2"
            value={values.fontBody}
            onChange={(e) => update("fontBody", e.target.value)}
          >
            {FONT_CHOICES.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save theme"}
      </Button>
    </div>
  );
}
