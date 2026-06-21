import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        brand: {
          50: "hsl(160 84% 95%)",
          100: "hsl(158 76% 85%)",
          200: "hsl(159 70% 75%)",
          300: "hsl(160 68% 65%)",
          400: "hsl(160 72% 52%)",
          500: "hsl(160 84% 39%)",
          600: "hsl(161 87% 30%)",
          700: "hsl(162 88% 22%)",
          800: "hsl(163 89% 16%)",
          900: "hsl(164 90% 11%)",
        },
        teal: {
          50: "hsl(170 60% 95%)",
          100: "hsl(170 55% 85%)",
          200: "hsl(170 55% 75%)",
          300: "hsl(170 58% 60%)",
          400: "hsl(170 65% 47%)",
          500: "hsl(170 80% 40%)",
          600: "hsl(172 85% 32%)",
          700: "hsl(174 88% 25%)",
          800: "hsl(176 90% 18%)",
          900: "hsl(178 92% 12%)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
