import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { downloadDanfe } from "@/lib/danfe/download";
import { useCompany } from "@/contexts/CompanyContext";
import { CartaCorrecaoDialog } from "@/components/CartaCorrecaoDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Download,
  XCircle,
  Building2,
  Filter,
  FileEdit,
} from "lucide-react";

interface Invoice {
  id: string;
  numero: number;
  serie: number;
  status: string;
  valor_total: number;
  data_emissao: string;
  chave_acesso: string | null;
  clients: {
    nome: string;
  };
}

export default function NotasFiscaisPage() {
  const { selectedCompany } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [cceInvoice, setCceInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (selectedCompany) {
      fetchInvoices();
    } else {
      setInvoices([]);
      setLoading(false);
    }
  }, [selectedCompany]);

  const fetchInvoices = async () => {
    if (!selectedCompany) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        id,
        numero,
        serie,
        status,
        valor_total,
        data_emissao,
        chave_acesso,
        clients (nome)
      `)
      .eq("company_id", selectedCompany.id)
      .order("data_emissao", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar notas fiscais");
    } else {
      setInvoices(data as Invoice[] || []);
    }
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    const motivo = prompt("Informe o motivo do cancelamento:");
    if (!motivo) return;

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "cancelada" as const,
        motivo_cancelamento: motivo,
        data_cancelamento: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao cancelar nota fiscal");
    } else {
      toast.success("Nota fiscal cancelada com sucesso");
      fetchInvoices();
    }
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
      rascunho: { label: "Rascunho", className: "status-badge status-pendente" },
      pendente: { label: "Pendente", className: "status-badge status-pendente" },
      autorizada: { label: "Autorizada", className: "status-badge status-autorizada" },
      cancelada: { label: "Cancelada", className: "status-badge status-cancelada" },
      rejeitada: { label: "Rejeitada", className: "status-badge status-rejeitada" },
    };
    const config = statusConfig[status] || statusConfig.pendente;
    return <span className={config.className}>{config.label}</span>;
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.numero.toString().includes(search) ||
      invoice.clients?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.chave_acesso?.includes(search);

    const matchesStatus =
      statusFilter === "todos" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!selectedCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Building2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma empresa</h2>
        <p className="text-muted-foreground">
          Selecione uma empresa no menu lateral para visualizar as notas fiscais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notas Fiscais</h1>
          <p className="text-muted-foreground">
            Gerencie suas notas fiscais eletrônicas
          </p>
        </div>
        <Button asChild>
          <Link to="/notas-fiscais/nova">
            <Plus className="w-4 h-4 mr-2" />
            Nova NF-e
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente ou chave..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="autorizada">Autorizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="table-container">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {search || statusFilter !== "todos"
                  ? "Nenhuma nota encontrada"
                  : "Nenhuma nota fiscal emitida"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {search || statusFilter !== "todos"
                  ? "Tente buscar com outros filtros"
                  : "Emita sua primeira nota fiscal para começar"}
              </p>
              {!search && statusFilter === "todos" && (
                <Button asChild>
                  <Link to="/notas-fiscais/nova">
                    <Plus className="w-4 h-4 mr-2" />
                    Emitir NF-e
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        to={`/notas-fiscais/${invoice.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {invoice.numero}/{invoice.serie}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.clients?.nome || "N/A"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(invoice.data_emissao)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.valor_total)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/notas-fiscais/${invoice.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          {invoice.status === "autorizada" && (
                            <>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download XML
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadDanfe(invoice.id)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download DANFE
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setCceInvoice(invoice)}>
                                <FileEdit className="w-4 h-4 mr-2" />
                                Carta de Correção
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleCancel(invoice.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar NF-e
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {cceInvoice && (
        <CartaCorrecaoDialog
          open={!!cceInvoice}
          onOpenChange={(open) => !open && setCceInvoice(null)}
          invoiceId={cceInvoice.id}
          invoiceNumero={cceInvoice.numero}
          invoiceSerie={cceInvoice.serie}
        />
      )}
    </div>
  );
}
