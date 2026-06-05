import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blossom: {
          sky: "#7fb9d8",
          deep: "#174663",
          ink: "#172936",
          petal: "#f8d8dc",
          blush: "#ef9fab",
          leaf: "#6d8f5a",
          gold: "#d8a43a",
          paper: "#fff8ef"
        }
      },
      boxShadow: {
        brush: "0 18px 70px rgba(23, 70, 99, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
