/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Logo-green palette — override Tailwind's emerald so all emerald-*
        // classes across the app match the Mini Manager logo green.
        emerald: {
          50:  "#eef8ea",
          100: "#d6efcc",
          200: "#b3e09f",
          300: "#8ccf6f",
          400: "#69b945",
          500: "#45a634",
          600: "#3a8c2c",
          700: "#2f7124",
          800: "#27571f",
          900: "#1e441a",
        },
        // CSS-variable driven — switches with light/dark
        primary:              "rgb(var(--c-primary) / <alpha-value>)",
        "primary-dim":        "rgb(var(--c-primary-dim) / <alpha-value>)",
        "primary-container":  "rgb(var(--c-primary-container) / <alpha-value>)",
        "on-primary":         "rgb(var(--c-on-primary) / <alpha-value>)",

        background:           "rgb(var(--c-background) / <alpha-value>)",
        surface:              "rgb(var(--c-surface) / <alpha-value>)",
        "surface-low":        "rgb(var(--c-surface-low) / <alpha-value>)",
        "surface-high":       "rgb(var(--c-surface-high) / <alpha-value>)",
        "surface-highest":    "rgb(var(--c-surface-highest) / <alpha-value>)",
        "surface-container":  "rgb(var(--c-surface-high) / <alpha-value>)",

        "on-surface":         "rgb(var(--c-on-surface) / <alpha-value>)",
        "on-surface-var":     "rgb(var(--c-on-surface-var) / <alpha-value>)",

        outline:              "rgb(var(--c-outline) / <alpha-value>)",
        "outline-var":        "rgb(var(--c-outline-var) / <alpha-value>)",

        secondary:            "rgb(var(--c-on-surface-var) / <alpha-value>)",
        "secondary-container":"rgb(var(--c-surface-highest) / <alpha-value>)",

        tertiary:             "#818cf8",
        "tertiary-container": "#494bd6",

        error:                "rgb(var(--c-error) / <alpha-value>)",
        "error-container":    "#93000a",
        warning:              "rgb(var(--c-warning) / <alpha-value>)",
        success:              "rgb(var(--c-success) / <alpha-value>)",
        blue:                 "#4d9fff",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Hind Siliguri", "sans-serif"],
      },
      fontSize: {
        "display-lg":  ["36px", { lineHeight: "44px", fontWeight: "700", letterSpacing: "-0.02em" }],
        "headline-lg": ["28px", { lineHeight: "36px", fontWeight: "800", letterSpacing: "-0.02em" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600", letterSpacing: "-0.01em" }],
        "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg":     ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md":     ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md":    ["12px", { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.05em" }],
        "label-sm":    ["11px", { lineHeight: "14px", fontWeight: "500" }],
      },
      borderRadius: {
        DEFAULT: "0.25rem", sm: "0.125rem", md: "0.375rem",
        lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", full: "9999px",
      },
      spacing: {
        "sidebar-width": "280px", "sidebar-collapsed": "72px",
        "container-padding": "24px",
        "stack-xs": "4px", "stack-sm": "8px", "stack-md": "16px", "stack-lg": "24px",
        gutter: "16px",
      },
      boxShadow: {
        "primary-glow": "0 0 24px rgba(16,185,129,0.15)",
        "card": "0 1px 3px rgba(0,0,0,0.18)",
        "modal": "0 20px 60px rgba(0,0,0,0.35)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
