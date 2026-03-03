import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  FileText,
  Plus,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Building2,
} from "lucide-react";

interface DashboardStats {
  totalNotas: number;
  autorizadas: number;
  pendentes: number;
  canceladas: number;
  rejeitadas: number;
  valorTotal: number;
}

interface MonthlyData {
  month: string;
  faturamento: number;
  notas: number;
}

interface TaxData {
  name: string;
  value: number;
}

interface RecentInvoice {
  id: string;
  numero: number;
  serie: number;
  status: string;
  valor_total: number;
  data_emissao: string;
  client_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  autorizada: "hsl(152, 60%, 40%)",
  pendente: "hsl(38, 92%, 50%)",
  rascunho: "hsl(210, 15%, 50%)",
  cancelada: "hsl(0, 72%, 51%)",
  rejeitada: "hsl(0, 50%, 40%)",
};

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const chartConfigFaturamento = {
  faturamento: { label: "Faturamento", color: "hsl(200, 80%, 35%)" },
};

const chartConfigNotas = {
  notas: { label: "Notas", color: "hsl(185, 60%, 45%)" },
};

const chartConfigImpostos = {
  icms: { label: "ICMS", color: "hsl(200, 80%, 35%)" },
  ipi: { label: "IPI", color: "hsl(185, 60%, 45%)" },
  pis: { label: "PIS", color: "hsl(152, 60%, 40%)" },
  cofins: { label: "COFINS", color: "hsl(38, 92%, 50%)" },
};

export default function DashboardPage() {
  const { selectedCompany, companies } = useCompany();
  const [stats, setStats] = useState<DashboardStats>({
    totalNotas: 0, autorizadas: 0, pendentes: 0,
    canceladas: 0, rejeitadas: 0, valorTotal: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [taxData, setTaxData] = useState<TaxData[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompany) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [selectedCompany]);

  const fetchDashboardData = async () => {
    if (!selectedCompany) return;
    setLoading(true);

    const { data: invoices } = await supabase
      .from("invoices")
      .select("status, valor_total, data_emissao, valor_icms, valor_ipi, valor_pis, valor_cofins")
      .eq("company_id", selectedCompany.id);

    if (invoices) {
      const autorizadas = invoices.filter((i) => i.status === "autorizada");
      setStats({
        totalNotas: invoices.length,
        autorizadas: autorizadas.length,
        pendentes: invoices.filter((i) => i.status === "pendente" || i.status === "rascunho").length,
        canceladas: invoices.filter((i) => i.status === "cancelada").length,
        rejeitadas: invoices.filter((i) => i.status === "rejeitada").length,
        valorTotal: autorizadas.reduce((sum, i) => sum + Number(i.valor_total), 0),
      });

      // Monthly aggregation (last 12 months)
      const now = new Date();
      const monthlyMap = new Map<string, { faturamento: number; notas: number }>();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyMap.set(key, { faturamento: 0, notas: 0 });
      }
      invoices.forEach((inv) => {
        if (inv.status === "cancelada" || inv.status === "rejeitada") return;
        const d = new Date(inv.data_emissao);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const entry = monthlyMap.get(key);
        if (entry) {
          entry.faturamento += Number(inv.valor_total);
          entry.notas += 1;
        }
      });
      setMonthlyData(
        Array.from(monthlyMap.entries()).map(([key, val]) => ({
          month: MONTH_NAMES[parseInt(key.split("-")[1])],
          ...val,
        }))
      );

      // Tax totals
      const totalIcms = autorizadas.reduce((s, i) => s + Number(i.valor_icms), 0);
      const totalIpi = autorizadas.reduce((s, i) => s + Number(i.valor_ipi), 0);
      const totalPis = autorizadas.reduce((s, i) => s + Number(i.valor_pis), 0);
      const totalCofins = autorizadas.reduce((s, i) => s + Number(i.valor_cofins), 0);
      setTaxData([
        { name: "ICMS", value: totalIcms },
        { name: "IPI", value: totalIpi },
        { name: "PIS", value: totalPis },
        { name: "COFINS", value: totalCofins },
      ]);
    }

    // Recent invoices
    const { data: recent } = await supabase
      .from("invoices")
      .select(`id, numero, serie, status, valor_total, data_emissao, clients (nome)`)
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recent) {
      setRecentInvoices(
        recent.map((inv: any) => ({ ...inv, client_name: inv.clients?.nome || "N/A" }))
      );
    }

    setLoading(false);
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      rascunho: { label: "Rascunho", cls: "status-pendente" },
      pendente: { label: "Pendente", cls: "status-pendente" },
      autorizada: { label: "Autorizada", cls: "status-autorizada" },
      cancelada: { label: "Cancelada", cls: "status-cancelada" },
      rejeitada: { label: "Rejeitada", cls: "status-rejeitada" },
    };
    const c = map[status] || map.pendente;
    return <span className={`status-badge ${c.cls}`}>{c.label}</span>;
  };

  const statusPieData = [
    { name: "Autorizadas", value: stats.autorizadas, color: STATUS_COLORS.autorizada },
    { name: "Pendentes", value: stats.pendentes, color: STATUS_COLORS.pendente },
    { name: "Canceladas", value: stats.canceladas, color: STATUS_COLORS.cancelada },
    { name: "Rejeitadas", value: stats.rejeitadas, color: STATUS_COLORS.rejeitada },
  ].filter((d) => d.value > 0);

  if (!selectedCompany && companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Bem-vindo ao NF-e Manager</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Para começar a emitir notas fiscais, cadastre sua primeira empresa.
        </p>
        <Button asChild size="lg">
          <Link to="/empresas/nova">
            <Plus className="w-5 h-5 mr-2" />
            Cadastrar empresa
          </Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas notas fiscais</p>
        </div>
        <Button asChild>
          <Link to="/notas-fiscais/nova">
            <Plus className="w-4 h-4 mr-2" />
            Nova NF-e
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Notas</p>
                <p className="text-3xl font-bold">{stats.totalNotas}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Autorizadas</p>
                <p className="text-3xl font-bold text-success">{stats.autorizadas}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-warning">{stats.pendentes}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{fmt(stats.valorTotal)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Faturamento + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Revenue Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Faturamento Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigFaturamento} className="h-[300px] w-full">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  width={60}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => fmt(Number(value))}
                    />
                  }
                />
                <Bar dataKey="faturamento" fill="var(--color-faturamento)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusPieData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                Nenhuma nota emitida
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Notas/mês Line + Impostos Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly invoice count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas Emitidas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigNotas} className="h-[250px] w-full">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="notas"
                  stroke="var(--color-notas)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-notas)", r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tax totals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Totais de Impostos (Autorizadas)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigImpostos} className="h-[250px] w-full">
              <BarChart data={taxData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `R$${v.toFixed(0)}`}
                  width={70}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => fmt(Number(value))}
                    />
                  }
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {taxData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        [
                          "hsl(200, 80%, 35%)",
                          "hsl(185, 60%, 45%)",
                          "hsl(152, 60%, 40%)",
                          "hsl(38, 92%, 50%)",
                        ][i]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Notas Recentes</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/notas-fiscais">
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhuma nota fiscal emitida</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/notas-fiscais/nova">
                  <Plus className="w-4 h-4 mr-2" />
                  Emitir primeira nota
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Número</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Valor</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <Link to={`/notas-fiscais/${invoice.id}`} className="font-medium text-primary hover:underline">
                          {invoice.numero}/{invoice.serie}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-sm">{invoice.client_name}</td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">{formatDate(invoice.data_emissao)}</td>
                      <td className="py-3 px-2 text-sm font-medium">{fmt(invoice.valor_total)}</td>
                      <td className="py-3 px-2">{getStatusBadge(invoice.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
