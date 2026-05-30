import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  safelist: [
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#DC2626", // Rouge dynamique
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#B91C1C", // Rouge foncé
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444", // Rouge alerte
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#10B981", // Vert succès
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B", // Jaune attention
          foreground: "#1F2937",
        },
        muted: {
          DEFAULT: "#F3F4F6", // Gris clair
          foreground: "#6B7280", // Gris moyen
        },
        accent: {
          DEFAULT: "#F3F4F6",
          foreground: "#1F2937",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1F2937",
        },
      },
      borderRadius: {
        lg: "16px",
        md: "8px",
        sm: "4px",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      fontSize: {
        h1: ['3.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        h3: ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        h4: ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fadeIn": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "zoom-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fadeIn": "fadeIn 0.3s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "zoom-in": "zoom-in 0.3s ease-out",
        "shimmer": "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
