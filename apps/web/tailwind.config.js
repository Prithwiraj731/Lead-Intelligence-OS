/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#08090d",
        card: "#0f1118",
        "card-hover": "#151824",
        "card-elevated": "#1a1e2d",
        border: "#1c2130",
        "border-subtle": "#161924",
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          subtle: "rgba(99, 102, 241, 0.12)",
        },
        accent: {
          blue: "#3b82f6",
          cyan: "#06b6d4",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
          purple: "#a855f7",
          indigo: "#6366f1",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          700: "#334155",
          800: "#1e293b",
          850: "#141722",
          900: "#0e111a",
          950: "#08090d",
        },
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "card": "0 2px 8px -1px rgba(0, 0, 0, 0.4), 0 1px 3px -1px rgba(0, 0, 0, 0.2)",
        "glow-indigo": "0 0 24px -4px rgba(99, 102, 241, 0.3)",
        "glow-emerald": "0 0 24px -4px rgba(16, 185, 129, 0.3)",
        "glow-amber": "0 0 24px -4px rgba(245, 158, 11, 0.3)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
