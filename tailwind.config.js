/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chess: {
          bg: "#F4EFEA",
          surface: "#EDE6DC",
          card: "#E8DFD3",
          cardHover: "#E2D7C8",
          gold: "#8E5830",
          champagne: "#D8C7B5",
          bronze: "#9E6738",
          espresso: "#2D221C",
          text: "#1C1613",
          muted: "#6B5E52",
          navy: "#2D221C",
          teal: "#F4EFEA",
          slate: "#EDE6DC",
          deepBlack: "#1C1613",
          charcoal: "#2D221C",
          softBlack: "#3D3128",
          warmGold: "#8E5830",
          offWhite: "#FAF7F2",
          mutedGrey: "#7A6E63",
          dark: "#1C1613",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "'Briston'", "'Fraunces'", "'Young Serif'", "serif", "-apple-system", "sans-serif"],
        heading: ["'Playfair Display'", "'Briston'", "'Fraunces'", "'Young Serif'", "serif", "-apple-system", "sans-serif"],
        serif: ["'Playfair Display'", "'Briston'", "'Fraunces'", "'Young Serif'", "serif"],
        briston: ["'Briston'", "'Playfair Display'", "'Fraunces'", "'Young Serif'", "serif"],
        laliga: ["'Briston'", "'Playfair Display'", "'Fraunces'", "'Young Serif'", "serif"],
        italigia: ["'Briston'", "'Playfair Display'", "'Fraunces'", "'Young Serif'", "serif"],
        sans: ["'Inter'", "'Briston'", "-apple-system", "sans-serif"],
        body: ["'Inter'", "'Briston'", "-apple-system", "sans-serif"],
        mono: ["'Briston'", "'Fraunces'", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.6, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
