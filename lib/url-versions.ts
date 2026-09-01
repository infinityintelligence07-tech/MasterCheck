import type { Json } from "@/types/database";

export type UrlVersion = {
  id: string;
  label: string;
  url: string;
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createUrlVersion(
  partial?: Partial<Pick<UrlVersion, "label" | "url">>,
): UrlVersion {
  return {
    id: newId(),
    label: partial?.label?.trim() || "Versão",
    url: partial?.url?.trim() || "",
  };
}

/** Normaliza JSON do banco + fallback da url principal. */
export function normalizeUrlVersions(
  raw: Json | UrlVersion[] | null | undefined,
  fallbackUrl?: string | null,
): UrlVersion[] {
  const list: UrlVersion[] = [];

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const record = entry as Record<string, unknown>;
      const url = typeof record.url === "string" ? record.url.trim() : "";
      if (!url) continue;
      list.push({
        id:
          typeof record.id === "string" && record.id
            ? record.id
            : newId(),
        label:
          typeof record.label === "string" && record.label.trim()
            ? record.label.trim()
            : `Versão ${list.length + 1}`,
        url,
      });
    }
  }

  if (list.length === 0 && fallbackUrl?.trim()) {
    list.push(createUrlVersion({ label: "Principal", url: fallbackUrl.trim() }));
  }

  return list;
}

export function primaryUrlFromVersions(versions: UrlVersion[]): string | null {
  const first = versions.find((v) => v.url.trim());
  return first?.url.trim() || null;
}

export function versionsToJson(versions: UrlVersion[]): Json {
  return versions.map((v) => ({
    id: v.id,
    label: v.label,
    url: v.url,
  }));
}
