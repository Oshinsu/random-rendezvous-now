
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
      scale: {
        '102': '1.02',
      },
      fontFamily: {
        signature: ['Spicy Rice', 'serif'],
        heading: ['Marcellus', 'serif'],
        body: ['Spectral', 'serif'],
        sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'system-ui', 'sans-serif'],
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
          foreground: 'hsl(var(--accent-foreground))',
          emerald: {
            500: 'hsl(160 70% 45%)',
            600: 'hsl(160 75% 38%)',
          },
          peach: {
            500: 'hsl(25 80% 65%)',
            600: 'hsl(25 85% 58%)',
          }
				},
        brand: {
          50: 'hsl(40 35% 97%)',   // #FAF8F5 (ivoire chaud)
          100: 'hsl(40 45% 92%)',  // #F5F0E8 (crème chaleureux)
          200: 'hsl(40 50% 82%)',  // #E8DCCB (sable doré)
          300: 'hsl(40 55% 70%)',  // #D9C49F (or pâle)
          400: 'hsl(40 60% 58%)',  // #C9AB7A (or doux)
          500: 'hsl(40 65% 48%)',  // #C9892B ⭐ COULEUR LOGO
          600: 'hsl(38 70% 40%)',  // #A87020 (cuivre)
          700: 'hsl(36 72% 32%)',  // #8B5A16 (bronze)
          800: 'hsl(34 70% 25%)',  // #6F4810 (marron chaud)
          900: 'hsl(32 68% 18%)',  // #52340B (très sombre)
          950: 'hsl(30 65% 12%)',  // #362108 (presque noir)
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
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'shimmer-slow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(241, 194, 50, 0.4), 0 0 40px rgba(241, 194, 50, 0.2)',
            transform: 'scale(1)'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(241, 194, 50, 0.6), 0 0 80px rgba(241, 194, 50, 0.3)',
            transform: 'scale(1.02)'
          },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'shimmer-slow': 'shimmer-slow 5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-in-up': 'slide-in-up 0.6s ease-out forwards',
        'scale-in': 'scale-in 0.5s ease-out forwards',
			},
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 50px -10px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 30px rgba(201, 137, 43, 0.3)',
        'glow-strong': '0 0 50px rgba(201, 137, 43, 0.5)',
        'metallic': '0 4px 20px -2px rgba(201, 137, 43, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.2)',
      }
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
