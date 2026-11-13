export const colors = {
  bg: '#0E1012',
  surface: '#171A1D',
  surfaceAlt: '#1F2327',
  border: '#2A2F34',
  text: '#F2F4F5',
  textMuted: '#9AA3AB',
  accent: '#3DDC97',
  income: '#3DDC97',
  expense: '#FF6B6B',
  warning: '#FFB84D',
  onAccent: '#08130E', // সবুজ বাটনের উপরের লেখার রং
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const fontSize = { xs: 12, sm: 14, md: 16, lg: 20, xl: 28, xxl: 36 };

// ক্যাটেগরি বানানোর সময় যে রংগুলো থেকে বাছা যাবে
export const categoryColors = [
  '#FF6B6B', '#FF9F43', '#FECA57', '#3DDC97', '#1DD1A1',
  '#48DBFB', '#54A0FF', '#5F27CD', '#A55EEA', '#FF78C4',
  '#C8D6E5', '#8395A7',
];

// ক্যাটেগরি বানানোর সময় যে আইকনগুলো থেকে বাছা যাবে (Ionicons)
export const categoryIcons = [
  'fast-food', 'restaurant', 'cafe', 'cart', 'bag-handle', 'shirt',
  'bus', 'car', 'airplane', 'home', 'bulb', 'wifi',
  'phone-portrait', 'medkit', 'fitness', 'school', 'book',
  'game-controller', 'film', 'gift', 'paw', 'build',
  'cash', 'wallet', 'briefcase', 'laptop', 'trending-up',
  'heart', 'star', 'ellipsis-horizontal',
] as const;