export const DASHBOARD_NAV = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" }],
  },
  {
    title: "AI Agents",
    items: [
      { href: "/voice-agent", label: "Voice Agent", icon: "Mic" },
      { href: "/calling-agent", label: "Calling Agent", icon: "Phone" },
      { href: "/chat-agent", label: "Chat Agent", icon: "MessageSquare" },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/conversations", label: "Conversations", icon: "MessagesSquare" },
      { href: "/call-logs", label: "Call Logs", icon: "PhoneCall" },
      { href: "/customers", label: "Customers", icon: "Users" },
      { href: "/orders", label: "Orders", icon: "ShoppingCart" },
    ],
  },
  {
    title: "Insights",
    items: [{ href: "/analytics", label: "Analytics", icon: "BarChart3" }],
  },
  {
    title: "Account",
    items: [
      { href: "/profile", label: "Profile", icon: "User" },
      { href: "/settings", label: "Settings", icon: "Settings" },
    ],
  },
] as const;

export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"] as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/voice-agent",
  "/calling-agent",
  "/chat-agent",
  "/analytics",
  "/settings",
  "/profile",
  "/customers",
  "/orders",
  "/call-logs",
  "/conversations",
] as const;

export const REFRESH_TOKEN_COOKIE = "refresh_token";
