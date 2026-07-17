/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kunda: { 50:"#f0f9f4",100:"#dcf0e4",200:"#bbe1cc",300:"#8ac9a9",400:"#56aa80",500:"#348e62",600:"#23714d",700:"#1a5c3e",800:"#164a33",900:"#123d2b",950:"#09221a" },
        sand: { 300:"#eabd6a",400:"#e0a03c",500:"#d4831f" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    },
  },
  plugins: [],
};
