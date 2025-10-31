import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1', // indigo-500
        secondary: '#8b5cf6', // violet-500
        accent: '#06b6d4', // cyan-500
        background: '#0f172a', // slate-900
        surface: '#1e293b', // slate-800
        text: '#f1f5f9', // slate-100
        'text-muted': '#94a3b8', // slate-400
      },
    },
  },
  plugins: [],
};

export default config;

