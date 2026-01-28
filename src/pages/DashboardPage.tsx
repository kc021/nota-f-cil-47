import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Building2,
} from "lucide-react";

interface DashboardStats {
  totalNotas: number;
  autorizadas: number;
  pendentes: number;
  canceladas: number;
  valorTotal: number;
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

export default function DashboardPage() {
  const { selectedCompany, companies } = useCompany();
  const [stats, setStats] = useState<DashboardStats>({
    totalNotas: 0,
    autorizadas: 0,
    pendentes: 0,
    canceladas: 0,
    valorTotal: 0,
  });
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

    // Fetch stats
    const { data: invoices } = await supabase
      .from("invoices")
      .select("status, valor_total")
      .eq("company_id", selectedCompany.id);

    if (invoices) {
      setStats({
        totalNotas: invoices.length,
        autorizadas: invoices.filter((i) => i.status === "autorizada").length,
        pendentes: invoices.filter((i) => i.status === "pendente" || i.status === "rascunho").length,
        canceladas: invoices.filter((i) => i.status === "cancelada").length,
        valorTotal: invoices
          .filter((i) => i.status === "autorizada")
          .reduce((sum, i) => sum + Number(i.valor_total), 0),
      });
    }

    // Fetch recent invoices
    const { data: recent } = await supabase
      .from("invoices")
      .select(`
        id,
        numero,
        serie,
        status,
        valor_total,
        data_emissao,
        clients (nome)
      `)
      .eq("company_id", selectedCompany.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recent) {
      setRecentInvoices(
        recent.map((inv: any) => ({
          ...inv,
          client_name: inv.clients?.nome || "N/A",
        }))
      );
    }

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      rascunho: { label: "Rascunho", className: "status-pendente" },
      pendente: { label: "Pendente", className: "status-pendente" },
      autorizada: { label: "Autorizada", className: "status-autorizada" },
      cancelada: { label: "Cancelada", className: "status-cancelada" },
      rejeitada: { label: "Rejeitada", className: "status-rejeitada" },
    };
    const config = statusConfig[status] || statusConfig.pendente;
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas notas fiscais
          </p>
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
                <p className="text-2xl font-bold">{formatCurrency(stats.valorTotal)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </div>
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recentInvoices.length === 0 ? (
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
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Número
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Data
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Valor
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <Link
                          to={`/notas-fiscais/${invoice.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {invoice.numero}/{invoice.serie}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-sm">{invoice.client_name}</td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {formatDate(invoice.data_emissao)}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium">
                        {formatCurrency(invoice.valor_total)}
                      </td>
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
