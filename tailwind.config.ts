import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#102a43",
        mist: "#f4f8fb",
        accent: "#0f766e",
        coral: "#ee6c4d"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(16, 42, 67, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
