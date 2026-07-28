import {
  Bot,
  Calendar,
  Headphones,
  MessageSquare,
  Phone,
  Sparkles,
  Target,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const FEATURES: Feature[] = [
  {
    icon: Phone,
    title: "Voice Agent",
    description:
      "Real-time AI voice conversations with speech-to-text, LLM reasoning, and natural text-to-speech.",
  },
  {
    icon: Bot,
    title: "Calling Agent",
    description:
      "Upload contacts, schedule outbound calls, and let AI handle conversations with full transcripts.",
  },
  {
    icon: MessageSquare,
    title: "Chat Agent",
    description:
      "Streaming chat with markdown support, conversation memory, and function calling capabilities.",
  },
  {
    icon: Target,
    title: "Lead Generation",
    description:
      "Qualify leads automatically through intelligent conversations across voice and chat channels.",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description:
      "Resolve support tickets 24/7 with context-aware AI that understands your business workflows.",
  },
  {
    icon: Calendar,
    title: "Appointment Booking",
    description:
      "Let AI agents schedule meetings, send reminders, and sync with your calendar automatically.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Build LangGraph-powered workflows that connect CRM, email, and third-party tools seamlessly.",
  },
  {
    icon: Sparkles,
    title: "AI Sales Assistant",
    description:
      "Close more deals with AI that handles objections, follows up, and personalizes every interaction.",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "VP of Operations",
    company: "ScaleFlow Inc.",
    content:
      "We reduced support response time by 78% in the first month. The voice agent handles complex queries our old chatbot couldn't touch.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    name: "Marcus Johnson",
    role: "Head of Sales",
    company: "Revenue Labs",
    content:
      "Our calling agent books 3x more demos than our SDR team alone. The AI summaries after each call are incredibly accurate.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
  },
  {
    name: "Emily Rodriguez",
    role: "Founder & CEO",
    company: "NovaCare Health",
    content:
      "Appointment booking automation saved us 20 hours per week. Patients love the natural conversation flow.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small teams getting started with AI automation.",
    features: [
      "1,000 AI minutes/month",
      "Chat agent included",
      "Basic analytics",
      "Email support",
      "2 team members",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For growing businesses scaling customer operations.",
    features: [
      "5,000 AI minutes/month",
      "Voice + calling agents",
      "Advanced analytics",
      "Priority support",
      "10 team members",
      "Custom workflows",
    ],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large organizations.",
    features: [
      "Unlimited AI minutes",
      "All agent types",
      "Dedicated account manager",
      "SLA guarantee",
      "Unlimited team members",
      "On-premise deployment",
      "Custom integrations",
    ],
    cta: "Book Demo",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How quickly can I deploy an AI agent?",
    answer:
      "Most customers launch their first agent within 24 hours. Our platform includes pre-built templates for support, sales, and appointment booking that you can customize with your business data.",
  },
  {
    question: "Which AI models do you support?",
    answer:
      "We integrate with OpenAI GPT-4o and support LangChain/LangGraph workflows. You can also bring your own model endpoints for enterprise deployments.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All data is encrypted in transit and at rest. We use JWT authentication, role-based access control, and are SOC 2 compliant. Enterprise plans include on-premise deployment options.",
  },
  {
    question: "Can I integrate with my existing CRM?",
    answer:
      "Absolutely. Our workflow automation supports webhooks, REST APIs, and native integrations with Salesforce, HubSpot, Zoho, and more through function calling.",
  },
  {
    question: "What happens during the free trial?",
    answer:
      "You get full access to the Professional plan for 14 days with 500 free AI minutes. No credit card required to start.",
  },
];

export const STATS = [
  { value: "10M+", label: "AI Conversations" },
  { value: "78%", label: "Faster Response Time" },
  { value: "500+", label: "Businesses Served" },
  { value: "99.9%", label: "Uptime SLA" },
] as const;
