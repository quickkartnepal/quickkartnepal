import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminStats } from "@/lib/admin.functions";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Package, ShoppingBag, Users, Wallet, TrendingUp } from "lucide-react";

export function StatsOverview() {
  const fetchFn = useServerFn(getAdminStats);
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchFn() });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading stats…</div>;
  const s = data;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi icon={ShoppingBag} label="Total Orders" value={s.totals.orders.toLocaleString()} />
        <Kpi icon={TrendingUp} label="Total Sales" value={`Rs. ${s.totals.sales.toLocaleString()}`} />
        <Kpi icon={Wallet} label="Total Revenue" value={`Rs. ${s.totals.revenue.toLocaleString()}`} />
        <Kpi icon={Package} label="Total Products" value={s.totals.products.toLocaleString()} />
        <Kpi icon={Users} label="Total Customers" value={s.totals.customers.toLocaleString()} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Daily Sales (last 30 days)">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={s.daily}>
              <defs>
                <linearGradient id="dailySales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="url(#dailySales)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Trends (last 30 days)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={s.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Sales (last 12 months)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={s.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent + top */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4 font-semibold">Recent Orders</div>
          <div className="divide-y divide-border text-sm">
            {s.recentOrders.length === 0 && <div className="p-6 text-center text-muted-foreground">No orders yet</div>}
            {s.recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between gap-2 p-3">
                <div>
                  <div className="font-mono text-xs font-semibold text-primary">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground">{o.full_name} · {new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{o.status}</span>
                  {Number(o.delivery_charge) > 0 && <span className="text-xs text-muted-foreground">+ Delivery Rs. {Number(o.delivery_charge).toLocaleString()}</span>}
                  <span className="font-semibold">Rs. {(Number(o.subtotal) + Number(o.delivery_charge)).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4 font-semibold">Top-Selling Products</div>
          <div className="divide-y divide-border text-sm">
            {s.topProducts.length === 0 && <div className="p-6 text-center text-muted-foreground">No sales yet</div>}
            {s.topProducts.map((p: any, i: number) => (
              <div key={p.product_id} className="flex items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center font-bold text-muted-foreground">{i + 1}</div>
                  {p.product_image && <img src={p.product_image} alt="" className="h-10 w-10 rounded object-cover" />}
                  <div className="font-medium">{p.product_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{p.units} units</div>
                  <div className="text-xs text-muted-foreground">Rs. {Number(p.revenue).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="mb-2 font-semibold">{title}</div>
      {children}
    </div>
  );
}
