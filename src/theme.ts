export type ThemeMode = "dark" | "light";

const dark = {
  bg: "#0E1012",
  surface: "#171A1D",
  surfaceAlt: "#1F2327",
  border: "#2A2F34",
  text: "#F2F4F5",
  textMuted: "#9AA3AB",
  accent: "#3DDC97",
  income: "#3DDC97",
  expense: "#FF6B6B",
  warning: "#FFB84D",
  onAccent: "#08130E",
};

const light: typeof dark = {
  bg: "#F3F5F7",
  surface: "#FFFFFF",
  surfaceAlt: "#E8ECEF",
  border: "#DADFE4",
  text: "#14181B",
  textMuted: "#66707A",
  accent: "#16A571",
  income: "#12935F",
  expense: "#E5484D",
  warning: "#D9822B",
  onAccent: "#FFFFFF",
};

const palettes = { dark, light };
let currentMode: ThemeMode = "dark";

// একই অবজেক্ট রেখে ভিতরের মান বদলানো হয়, তাই সব ফাইলের `colors` ইমপোর্ট আগের মতোই কাজ করে
export const colors: typeof dark = { ...dark };

export function applyTheme(mode: ThemeMode) {
  currentMode = mode;
  Object.assign(colors, palettes[mode]);
}

// থিম অনুযায়ী স্টাইল প্রথমবার ব্যবহারের সময় বানায় ও মনে রাখে
export function lazyStyles<T extends object>(factory: () => T): T {
  const cache: Partial<Record<ThemeMode, T>> = {};
  const get = (): T => {
    const hit = cache[currentMode];
    if (hit) return hit;
    const made = factory();
    cache[currentMode] = made;
    return made;
  };
  return new Proxy({} as T, { get: (_t, prop) => (get() as any)[prop] });
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 20, xl: 28, xxl: 36 };

export const categoryColors = [
  "#FF6B6B",
  "#FF9F43",
  "#FECA57",
  "#3DDC97",
  "#1DD1A1",
  "#48DBFB",
  "#54A0FF",
  "#5F27CD",
  "#A55EEA",
  "#FF78C4",
  "#C8D6E5",
  "#8395A7",
  "#78e08f",
  "#eb2f06",
  "#079992",
  "#82ccdd",
  "#fff200",
  "#7efff5",
  "#3d3d3d"
];

export const categoryIcons = [
  "fast-food",
  "restaurant",
  "cafe",
  "cart",
  "bag-handle",
  "shirt",
  "bus",
  "car",
  "airplane",
  "home",
  "bulb",
  "wifi",
  "phone-portrait",
  "medkit",
  "fitness",
  "school",
  "book",
  "game-controller",
  "film",
  "gift",
  "paw",
  "build",
  "cash",
  "wallet",
  "briefcase",
  "laptop",
  "trending-up",
  "heart",
  "star",
  "ellipsis-horizontal",
] as const;
