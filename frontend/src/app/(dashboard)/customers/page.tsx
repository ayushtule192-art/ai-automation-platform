import { Users } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage your customer contacts">
        <Button>Add Customer</Button>
      </PageHeader>
      <EmptyState
        title="No customers yet"
        description="Customers are created automatically from calls and conversations, or add them manually."
        icon={Users}
      />
    </div>
  );
}
