/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    colors: {
      background: "hsl(var(--background) / <alpha-value>)",
      foreground: "hsl(var(--foreground) / <alpha-value>)",
      border: "hsl(var(--border) / <alpha-value>)",
      primary: {
        DEFAULT: "hsl(var(--primary) / <alpha-value>)",
        foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
      },
      secondary: "hsl(var(--secondary) / <alpha-value>)",
      ring: "hsl(var(--ring) / <alpha-value>)",
    },
    extend: {
      colors: {
        kunda: { 50:"#f0f9f4",100:"#dcf0e4",200:"#bbe1cc",300:"#8ac9a9",400:"#56aa80",500:"#348e62",600:"#23714d",700:"#1a5c3e",800:"#164a33",900:"#123d2b",950:"#09221a" },
        sand:  { 50:"#fdf8f0",100:"#faefd8",200:"#f3d9a4",300:"#eabd6a",400:"#e0a03c",500:"#d4831f" },
      },
      fontFamily: { sans: ["var(--font-inter)","system-ui","sans-serif"], display: ["var(--font-playfair)","Georgia","serif"] },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      boxShadow: { property: "0 4px 24px rgba(26,92,62,0.12)", "property-hover": "0 8px 32px rgba(26,92,62,0.2)" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
