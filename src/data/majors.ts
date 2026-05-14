import type { Major, MajorSlug } from "./types";

export const majors: Major[] = [
  {
    slug: "masters",
    name: "The Masters",
    shortName: "Masters",
    accent: "#00573F",
    accentDark: "#003B2A",
    accentText: "#F9E814",
  },
  {
    slug: "pga-championship",
    name: "PGA Championship",
    shortName: "PGA Champ.",
    accent: "#1E2A56",
    accentDark: "#101A3C",
    accentText: "#D4A946",
  },
  {
    slug: "us-open",
    name: "U.S. Open",
    shortName: "U.S. Open",
    accent: "#0A2240",
    accentDark: "#06152A",
    accentText: "#C8102E",
  },
  {
    slug: "open-championship",
    name: "The Open",
    shortName: "The Open",
    accent: "#1A1A1A",
    accentDark: "#000000",
    accentText: "#E5C04B",
  },
];

export function getMajor(slug: MajorSlug): Major {
  const major = majors.find((m) => m.slug === slug);
  if (!major) {
    throw new Error(`Unknown major: ${slug}`);
  }
  return major;
}

export function isMajorSlug(value: string): value is MajorSlug {
  return majors.some((m) => m.slug === value);
}
