/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { display: ["system-ui", "Segoe UI", "Tahoma", "Arial", "sans-serif"] },
      borderRadius: { xl2: "1.25rem", xl3: "1.75rem", xl4: "2.25rem" },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.10), 0 18px 70px rgba(0,0,0,0.55)",
        soft: "0 10px 30px rgba(0,0,0,0.28)",
        inset: "inset 0 0 0 1px rgba(255,255,255,0.10)"
      },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "100% 50%" } },
        pulseGlow: { "0%,100%": { opacity: "0.55", transform: "scale(1)" }, "50%": { opacity: "1", transform: "scale(1.08)" } },
        scan: { "0%": { transform: "translateY(-120%)" }, "100%": { transform: "translateY(120%)" } }
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        shimmer: "shimmer 7s ease-in-out infinite",
        pulseGlow: "pulseGlow 1.8s ease-in-out infinite",
        scan: "scan 2.8s ease-in-out infinite",
      }
    },
  },
  plugins: [],
};
