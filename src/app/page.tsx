import DashboardClient from "@/components/DashboardClient";
import { getDashboardData, getCustomerNames } from "@/lib/dashboardData";

export const revalidate = 0;

export default async function DashboardPage() {
  const [data, customers] = await Promise.all([getDashboardData(), getCustomerNames()]);

  return <DashboardClient data={data} customers={customers} />;
}
