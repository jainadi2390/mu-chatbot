/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                    950: '#082f49',
                },
                secondary: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065',
                },
                neon: {
                    cyan: '#00ffff',
                    purple: '#8b5cf6',
                    blue: '#1e40af',
                    teal: '#0891b2',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                futuristic: ['Orbitron', 'monospace'],
                display: ['Poppins', 'sans-serif'],
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite',
                'slide-up': 'slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
                'typing': 'typingDots 1.4s infinite',
            },
            backdropBlur: {
                '25': '25px',
            },
            boxShadow: {
                'neon': '0 0 20px rgba(0, 255, 255, 0.5)',
                'neon-strong': '0 0 40px rgba(0, 255, 255, 0.8)',
                'purple-neon': '0 0 20px rgba(139, 92, 246, 0.5)',
                'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
                'glass-strong': '0 20px 60px rgba(0, 0, 0, 0.2)',
            }
        },
    },
    plugins: [],
}