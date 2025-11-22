

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 47.4% 11.2%)",
        card: "hsl(0 0% 100%)",
        cardForeground: "hsl(222.2 47.4% 11.2%)",
        popover: "hsl(0 0% 100%)",
        popoverForeground: "hsl(222.2 47.4% 11.2%)",
        primary: "hsl(221.2 83.2% 53.3%)",
        primaryForeground: "hsl(210 40% 98%)",
        secondary: "hsl(210 40% 96.1%)",
        secondaryForeground: "hsl(222.2 47.4% 11.2%)",
        muted: "hsl(210 40% 96.1%)",
        mutedForeground: "hsl(215.4 16.3% 46.9%)",
        accent: "hsl(210 40% 96.1%)",
        accentForeground: "hsl(222.2 47.4% 11.2%)",
        destructive: "hsl(0 70% 50%)",
        destructiveForeground: "hsl(210 40% 98%)",
        border: "hsl(214.3 31.8% 91.4%)",
        input: "hsl(214.3 31.8% 91.4%)",
        ring: "hsl(221.2 83.2% 53.3%)"
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.3rem",
        sm: "0.2rem"
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease",
        "accordion-up": "accordion-up 0.2s ease"
      }
    }
  },
  plugins: [
    require("tailwindcss-animate")
  ]
};
