import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette (using CSS variables for shadcn/ui compatibility)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Card backgrounds
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Popover backgrounds
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        // Primary CTA (dark charcoal buttons)
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        // Secondary CTA (olive/sage green buttons)
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        // Muted text and elements
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        // Accent colors
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        // Destructive actions
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        // Borders and inputs
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Status colors (Diadi-specific)
        status: {
          active: "hsl(var(--status-active))", // Green indicators
          warning: "hsl(var(--status-warning))", // Amber warnings
          error: "hsl(var(--status-error))", // Red errors
          info: "hsl(var(--status-info))", // Blue info
        },

        // Sidebar (desktop nav)
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
        },
      },

      fontFamily: {
        // Serif for headlines (e.g., "The Hub.", "Facilitator.")
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        // Sans-serif for body text and UI elements
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },

      fontSize: {
        // Section headers (all caps, small, spaced tracking)
        "section-header": [
          "0.75rem",
          { letterSpacing: "0.1em", fontWeight: "500" },
        ],
      },

      letterSpacing: {
        // For section headers and button labels
        widest: "0.1em",
      },

      borderRadius: {
        // Cards use 16px rounded corners
        card: "16px",
        // Buttons are pill-shaped (full rounded)
        button: "9999px",
        // Default shadcn/ui compatibility
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      boxShadow: {
        // Card shadow (subtle)
        card: "0 2px 8px rgba(0, 0, 0, 0.08)",
        // Elevated elements (floating buttons, modals)
        elevated: "0 4px 16px rgba(0, 0, 0, 0.12)",
      },

      animation: {
        // AI status indicator pulse
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        // Subtle glow for active intervention
        glow: "glow 1.5s ease-in-out infinite alternate",
        // Accordion animations for shadcn/ui
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },

      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px hsl(var(--secondary) / 0.5)" },
          "100%": { boxShadow: "0 0 20px hsl(var(--secondary) / 0.8)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
