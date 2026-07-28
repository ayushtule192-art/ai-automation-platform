export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "AI Automation Platform";
export const APP_TAGLINE =
  "Automate Customer Support, Sales, Voice Calls and Business Workflows using AI.";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export const FOOTER_LINKS = {
  product: [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "/services", label: "Services" },
    { href: "/contact", label: "Contact" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "#", label: "Careers" },
    { href: "#", label: "Blog" },
  ],
  legal: [
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
  ],
} as const;
