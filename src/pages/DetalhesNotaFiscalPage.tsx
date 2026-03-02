import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { downloadDanfe } from "@/lib/danfe/download";
import { downloadNFeXml, generateNFeXml } from "@/lib/nfe/xml";
import { transmitNFe, consultNFe } from "@/lib/nfe/sefaz";
import { CartaCorrecaoDialog } from "@/components/CartaCorrecaoDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Send,
  SearchCheck,
  FileEdit,
  FileCode,
  XCircle,
  FileText,
  Building2,
  User,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Copy,
} from "lucide-react";

interface InvoiceDetail {
  id: string;
  numero: number;
  serie: number;
  status: string;
  valor_total: number;
  valor_produtos: number;
  valor_icms: number;
  valor_ipi: number;
  valor_pis: number;
  valor_cofins: number;
  valor_frete: number;
  valor_seguro: number;
  valor_desconto: number;
  valor_outras_despesas: number;
  data_emissao: string;
  data_autorizacao: string | null;
  data_cancelamento: string | null;
  chave_acesso: string | null;
  protocolo_autorizacao: string | null;
  motivo_cancelamento: string | null;
  natureza_operacao: string;
  ambiente: string;
  informacoes_complementares: string | null;
  xml_path: string | null;
  created_at: string;
  companies: {
    razao_social: string;
    nome_fantasia: string | null;
    cnpj: string;
    uf: string;
    cidade: string;
    ambiente: string;
  };
  clients: {
    nome: string;
    documento: string;
    tipo_documento: string;
    email: string | null;
    telefone: string | null;
    cidade: string | null;
    uf: string | null;
  };
}

interface InvoiceItem {
  id: string;
  numero_item: number;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  icms_aliquota: number;
  icms_valor: number;
  ipi_aliquota: number;
  ipi_valor: number;
  pis_aliquota: number;
  pis_valor: number;
  cofins_aliquota: number;
  cofins_valor: number;
}

export default function DetalhesNotaFiscalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cceOpen, setCceOpen] = useState(false);

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    if (!id) return;
    setLoading(true);

    const [invoiceRes, itemsRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("*, companies(*), clients(*)")
        .eq("id", id)
        .single(),
      supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id)
        .order("numero_item"),
    ]);

    if (invoiceRes.error) {
      toast.error("Nota fiscal não encontrada");
      navigate("/notas-fiscais");
      return;
    }

    setInvoice(invoiceRes.data as unknown as InvoiceDetail);
    setItems((itemsRes.data as InvoiceItem[]) || []);

    // Try to load XML
    if (invoiceRes.data?.xml_path) {
      const { data: xmlData } = await supabase.storage
        .from("certificates")
        .download(invoiceRes.data.xml_path);
      if (xmlData) {
        setXmlContent(await xmlData.text());
      }
    }

    setLoading(false);
  };

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString("pt-BR") : "—";

  const fmtDoc = (doc: string, tipo: string) => {
    const d = doc.replace(/\D/g, "");
    if (tipo === "cpf" && d.length === 11)
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    if (d.length === 14)
      return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    return doc;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
      rascunho: { label: "Rascunho", variant: "outline", icon: FileText },
      pendente: { label: "Pendente", variant: "secondary", icon: Clock },
      autorizada: { label: "Autorizada", variant: "default", icon: CheckCircle2 },
      cancelada: { label: "Cancelada", variant: "destructive", icon: XCircle },
      rejeitada: { label: "Rejeitada", variant: "destructive", icon: AlertCircle },
    };
    return map[status] || map.rascunho;
  };

  const buildTimeline = () => {
    if (!invoice) return [];
    const events: { date: string; label: string; icon: typeof Clock; variant: string }[] = [];

    events.push({
      date: invoice.created_at,
      label: "Nota fiscal criada",
      icon: FileText,
      variant: "muted",
    });

    if (invoice.chave_acesso) {
      events.push({
        date: invoice.created_at,
        label: "XML gerado e assinado",
        icon: FileCode,
        variant: "muted",
      });
    }

    if (invoice.data_autorizacao) {
      events.push({
        date: invoice.data_autorizacao,
        label: `Autorizada - Protocolo: ${invoice.protocolo_autorizacao}`,
        icon: CheckCircle2,
        variant: "success",
      });
    }

    if (invoice.data_cancelamento) {
      events.push({
        date: invoice.data_cancelamento,
        label: `Cancelada: ${invoice.motivo_cancelamento || "Sem motivo"}`,
        icon: XCircle,
        variant: "destructive",
      });
    }

    if (invoice.status === "rejeitada") {
      events.push({
        date: invoice.created_at,
        label: "Rejeitada pela SEFAZ",
        icon: AlertCircle,
        variant: "destructive",
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!invoice) return null;

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;
  const timeline = buildTimeline();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/notas-fiscais")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                NF-e {invoice.numero}/{invoice.serie}
              </h1>
              <Badge variant={statusConfig.variant} className="gap-1">
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </Badge>
              {invoice.ambiente === "homologacao" && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  Homologação
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {invoice.natureza_operacao} • Emissão: {fmtDate(invoice.data_emissao)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {invoice.status === "rascunho" && (
            <Button size="sm" variant="outline" onClick={async () => {
              const r = await generateNFeXml(invoice.id);
              if (r.success) fetchInvoice();
            }}>
              <FileCode className="w-4 h-4 mr-1" /> Gerar XML
            </Button>
          )}
          {(invoice.status === "rascunho" || invoice.status === "pendente") && (
            <Button size="sm" onClick={async () => {
              if (invoice.status === "rascunho") {
                const xmlR = await generateNFeXml(invoice.id);
                if (!xmlR.success) return;
              }
              const r = await transmitNFe(invoice.id);
              if (r) fetchInvoice();
            }}>
              <Send className="w-4 h-4 mr-1" /> Transmitir SEFAZ
            </Button>
          )}
          {invoice.status !== "rascunho" && (
            <Button size="sm" variant="outline" onClick={async () => { await consultNFe(invoice.id); }}>
              <SearchCheck className="w-4 h-4 mr-1" /> Consultar SEFAZ
            </Button>
          )}
          {invoice.status === "autorizada" && (
            <>
              <Button size="sm" variant="outline" onClick={() => downloadNFeXml(invoice.id)}>
                <Download className="w-4 h-4 mr-1" /> XML
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadDanfe(invoice.id)}>
                <Download className="w-4 h-4 mr-1" /> DANFE
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCceOpen(true)}>
                <FileEdit className="w-4 h-4 mr-1" /> CC-e
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Access Key */}
      {invoice.chave_acesso && (
        <Card>
          <CardContent className="py-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Chave de Acesso</p>
              <p className="text-sm font-mono truncate">{invoice.chave_acesso}</p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyToClipboard(invoice.chave_acesso!)}>
              <Copy className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="itens">Itens ({items.length})</TabsTrigger>
          <TabsTrigger value="impostos">Impostos</TabsTrigger>
          <TabsTrigger value="xml" disabled={!xmlContent}>XML</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* ── Dados ── */}
        <TabsContent value="dados" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Emitente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Emitente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{invoice.companies.razao_social}</p>
                {invoice.companies.nome_fantasia && (
                  <p className="text-muted-foreground">{invoice.companies.nome_fantasia}</p>
                )}
                <p className="text-muted-foreground">
                  CNPJ: {fmtDoc(invoice.companies.cnpj, "cnpj")}
                </p>
                <p className="text-muted-foreground">
                  {invoice.companies.cidade}/{invoice.companies.uf}
                </p>
              </CardContent>
            </Card>

            {/* Destinatário */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" /> Destinatário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{invoice.clients.nome}</p>
                <p className="text-muted-foreground">
                  {invoice.clients.tipo_documento === "cpf" ? "CPF" : "CNPJ"}:{" "}
                  {fmtDoc(invoice.clients.documento, invoice.clients.tipo_documento)}
                </p>
                {invoice.clients.cidade && (
                  <p className="text-muted-foreground">
                    {invoice.clients.cidade}/{invoice.clients.uf}
                  </p>
                )}
                {invoice.clients.email && (
                  <p className="text-muted-foreground">{invoice.clients.email}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Totais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Produtos</p>
                  <p className="font-medium">{fmtCurrency(invoice.valor_produtos)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Frete</p>
                  <p className="font-medium">{fmtCurrency(invoice.valor_frete)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Desconto</p>
                  <p className="font-medium">{fmtCurrency(invoice.valor_desconto)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-primary font-semibold">Total NF-e</p>
                  <p className="font-bold text-lg">{fmtCurrency(invoice.valor_total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {invoice.informacoes_complementares && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" /> Informações Complementares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.informacoes_complementares}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Itens ── */}
        <TabsContent value="itens">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="hidden md:table-cell">NCM</TableHead>
                    <TableHead className="hidden md:table-cell">CFOP</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Unitário</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{item.numero_item}</TableCell>
                      <TableCell>
                        <p className="font-medium">{item.descricao}</p>
                        <p className="text-xs text-muted-foreground">Cód: {item.codigo}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{item.ncm}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{item.cfop}</TableCell>
                      <TableCell className="text-right">{item.quantidade} {item.unidade}</TableCell>
                      <TableCell className="text-right">{fmtCurrency(item.valor_unitario)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtCurrency(item.valor_total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Impostos ── */}
        <TabsContent value="impostos">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Resumo dos Impostos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: "ICMS", value: invoice.valor_icms },
                  { label: "IPI", value: invoice.valor_ipi },
                  { label: "PIS", value: invoice.valor_pis },
                  { label: "COFINS", value: invoice.valor_cofins },
                ].map((tax) => (
                  <div key={tax.label} className="flex justify-between">
                    <span className="text-muted-foreground">{tax.label}</span>
                    <span className="font-medium">{fmtCurrency(tax.value)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Impostos</span>
                  <span>{fmtCurrency(invoice.valor_icms + invoice.valor_ipi + invoice.valor_pis + invoice.valor_cofins)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Impostos por Item</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead className="text-right">ICMS</TableHead>
                      <TableHead className="text-right">IPI</TableHead>
                      <TableHead className="text-right">PIS</TableHead>
                      <TableHead className="text-right">COFINS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.numero_item}</TableCell>
                        <TableCell className="text-right">{fmtCurrency(item.icms_valor)}</TableCell>
                        <TableCell className="text-right">{fmtCurrency(item.ipi_valor)}</TableCell>
                        <TableCell className="text-right">{fmtCurrency(item.pis_valor)}</TableCell>
                        <TableCell className="text-right">{fmtCurrency(item.cofins_valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── XML ── */}
        <TabsContent value="xml">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">XML da NF-e</CardTitle>
              <Button variant="outline" size="sm" onClick={() => xmlContent && copyToClipboard(xmlContent)}>
                <Copy className="w-3 h-3 mr-1" /> Copiar
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono bg-muted rounded-md p-4 overflow-auto max-h-[500px] whitespace-pre-wrap break-all">
                {xmlContent}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Timeline ── */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Histórico de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                {timeline.map((event, idx) => {
                  const Icon = event.icon;
                  return (
                    <div key={idx} className="relative flex gap-3">
                      <div className={`absolute -left-6 mt-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center bg-background border-2 ${
                        event.variant === "success"
                          ? "border-primary text-primary"
                          : event.variant === "destructive"
                          ? "border-destructive text-destructive"
                          : "border-muted-foreground text-muted-foreground"
                      }`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{event.label}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(event.date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CC-e Dialog */}
      {cceOpen && (
        <CartaCorrecaoDialog
          open={cceOpen}
          onOpenChange={setCceOpen}
          invoiceId={invoice.id}
          invoiceNumero={invoice.numero}
          invoiceSerie={invoice.serie}
        />
      )}
    </div>
  );
}
