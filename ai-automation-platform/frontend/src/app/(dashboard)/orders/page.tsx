import { ShoppingCart } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="View and manage service subscriptions" />
      <EmptyState
        title="No orders yet"
        description="Subscribe to a service plan from the pricing page to get started."
        icon={ShoppingCart}
      />
    </div>
  );
}
