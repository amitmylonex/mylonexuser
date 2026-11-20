/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "Epilogue", "sans-serif"],
        mono: ["monospace"],
        heading: ["var(--font-heading)", "Epilogue", "sans-serif"],
        display: ["var(--font-heading)", "Epilogue", "sans-serif"],
      },
      colors: {
        background: "rgb(var(--color-canvas) / <alpha-value>)",
        foreground: "rgb(var(--color-ink) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "brand-deep": "rgb(var(--color-brand-deep) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        destructive: "rgb(var(--color-destructive) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        glass: "rgb(var(--color-glass) / <alpha-value>)",
        "glass-border": "rgb(var(--color-glass-border) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        "border-strong": "rgb(var(--color-border-strong) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 10px 30px -20px rgba(15, 23, 42, 0.35)",
        large: "0 30px 60px -30px rgba(15, 23, 42, 0.45)",
        glow: "0 20px 40px -25px rgba(47, 95, 227, 0.55)",
        elegant: "0 22px 50px -30px rgba(2, 6, 23, 0.4)",
        floating: "0 35px 70px -35px rgba(2, 6, 23, 0.5)",
        intense: "0 40px 80px -30px rgba(2, 6, 23, 0.6)",
      },
      backgroundImage: {
        "gradient-hero":
          "radial-gradient(circle at 20% 20%, rgba(47, 95, 227, 0.2), transparent 55%), radial-gradient(circle at 80% 10%, rgba(245, 158, 11, 0.14), transparent 45%), linear-gradient(120deg, rgba(246, 248, 252, 1) 0%, rgba(237, 242, 251, 1) 50%, rgba(246, 248, 252, 1) 100%)",
        "gradient-primary":
          "linear-gradient(120deg, rgba(47, 95, 227, 1) 0%, rgba(76, 124, 255, 1) 100%)",
        "gradient-accent":
          "linear-gradient(120deg, rgba(245, 158, 11, 1) 0%, rgba(251, 146, 60, 1) 100%)",
        /* Premium hero background tuned to the portal blue identity */
        "gradient-hero-premium":
          "radial-gradient(ellipse at 30% 0%, rgba(47, 95, 227, 0.24), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(245, 158, 11, 0.11), transparent 50%), linear-gradient(165deg, rgba(246, 248, 252, 1) 0%, rgba(239, 243, 251, 1) 50%, rgba(246, 248, 252, 1) 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "float-slower": "float-slow 9s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.2s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
