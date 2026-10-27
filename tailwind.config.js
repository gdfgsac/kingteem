export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Tajawal', 'sans-serif'],
            },
            colors: {
                primary: "#0f172a",
                accent: "#fbbf24",
                secondary: "#475569",
                background: "#fafafa",
            }
        },
    },
    plugins: [],
}