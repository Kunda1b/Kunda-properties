/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: "hsl(var(--secondary))",
        ring: "hsl(var(--ring))",
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
