
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '2rem',
        xl: '2rem',
      },
			screens: {
        xs: '380px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
				'xl': '1280px',
        '2xl': '1400px',
			}
		},
		extend: {
      fontFamily: {
        sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        grotesk: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
				},
        brand: {
          50: 'hsl(50 40% 98%)',   // #fefdf8
          100: 'hsl(45 75% 95%)',  // #fefaed
          200: 'hsl(45 70% 85%)',  // #fcf2d1
          300: 'hsl(45 80% 75%)',  // #f9e6a7
          400: 'hsl(45 85% 65%)',  // #f5d363
          500: 'hsl(45 94% 55%)',  // #f1c232
          600: 'hsl(42 88% 50%)',  // #e6a91a
          700: 'hsl(40 78% 42%)',  // #c08a15
          800: 'hsl(38 72% 35%)',  // #9d6f16
          900: 'hsl(36 66% 29%)',  // #825c16
          950: 'hsl(35 62% 17%)',  // #4a3309
        },
        neutral: {
          50: 'hsl(0 0% 98%)',     // #fafafa
          100: 'hsl(0 0% 96%)',    // #f5f5f5
          200: 'hsl(0 0% 90%)',    // #e5e5e5
          300: 'hsl(0 0% 83%)',    // #d4d4d4
          400: 'hsl(0 0% 64%)',    // #a3a3a3
          500: 'hsl(0 0% 45%)',    // #737373
          600: 'hsl(0 0% 32%)',    // #525252
          700: 'hsl(0 0% 25%)',    // #404040
          800: 'hsl(0 0% 15%)',    // #262626
          900: 'hsl(0 0% 9%)',     // #171717
          950: 'hsl(0 0% 4%)',     // #0a0a0a
        },
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(241, 194, 50, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(241, 194, 50, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
			},
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 50px -10px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 30px rgba(241, 194, 50, 0.3)',
        'glow-strong': '0 0 50px rgba(241, 194, 50, 0.5)',
      }
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
