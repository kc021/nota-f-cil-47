import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Building2,
  Plus,
  Trash2,
  Send,
} from "lucide-react";

interface Client {
  id: string;
  nome: string;
  documento: string;
}

interface Product {
  id: string;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  valor_unitario: number;
  cst: string | null;
  csosn: string | null;
  origem: string;
  icms_aliquota: number | null;
}

interface InvoiceItem {
  product_id: string;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export default function NovaNotaFiscalPage() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    client_id: "",
    natureza_operacao: "Venda de Mercadoria",
    informacoes_complementares: "",
    valor_frete: 0,
    valor_seguro: 0,
    valor_desconto: 0,
    valor_outras_despesas: 0,
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantidade: 1,
  });

  useEffect(() => {
    if (selectedCompany) {
      fetchClients();
      fetchProducts();
    }
  }, [selectedCompany]);

  const fetchClients = async () => {
    if (!selectedCompany) return;
    const { data } = await supabase
      .from("clients")
      .select("id, nome, documento")
      .eq("company_id", selectedCompany.id)
      .eq("is_active", true)
      .order("nome");
    setClients(data || []);
  };

  const fetchProducts = async () => {
    if (!selectedCompany) return;
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("company_id", selectedCompany.id)
      .eq("is_active", true)
      .order("descricao");
    setProducts(data || []);
  };

  const handleAddItem = () => {
    if (!newItem.product_id || newItem.quantidade <= 0) {
      toast.error("Selecione um produto e informe a quantidade");
      return;
    }

    const product = products.find((p) => p.id === newItem.product_id);
    if (!product) return;

    const valorTotal = product.valor_unitario * newItem.quantidade;

    setItems([
      ...items,
      {
        product_id: product.id,
        codigo: product.codigo,
        descricao: product.descricao,
        ncm: product.ncm,
        cfop: product.cfop,
        unidade: product.unidade,
        quantidade: newItem.quantidade,
        valor_unitario: product.valor_unitario,
        valor_total: valorTotal,
      },
    ]);

    setNewItem({ product_id: "", quantidade: 1 });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const valorProdutos = items.reduce((sum, item) => sum + item.valor_total, 0);
    const valorTotal =
      valorProdutos +
      formData.valor_frete +
      formData.valor_seguro +
      formData.valor_outras_despesas -
      formData.valor_desconto;

    return { valorProdutos, valorTotal };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompany) {
      toast.error("Selecione uma empresa");
      return;
    }

    if (!formData.client_id) {
      toast.error("Selecione um cliente");
      return;
    }

    if (items.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    setLoading(true);

    try {
      // Get next invoice number
      const { data: companyData } = await supabase
        .from("companies")
        .select("numero_nfe_atual, serie_nfe")
        .eq("id", selectedCompany.id)
        .single();

      const nextNumber = (companyData?.numero_nfe_atual || 0) + 1;
      const serie = companyData?.serie_nfe || 1;

      const { valorProdutos, valorTotal } = calculateTotals();

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          company_id: selectedCompany.id,
          client_id: formData.client_id,
          numero: nextNumber,
          serie: serie,
          ambiente: selectedCompany.ambiente,
          natureza_operacao: formData.natureza_operacao,
          informacoes_complementares: formData.informacoes_complementares || null,
          valor_produtos: valorProdutos,
          valor_frete: formData.valor_frete,
          valor_seguro: formData.valor_seguro,
          valor_desconto: formData.valor_desconto,
          valor_outras_despesas: formData.valor_outras_despesas,
          valor_total: valorTotal,
          status: "rascunho" as const,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsToInsert = items.map((item, index) => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        numero_item: index + 1,
        codigo: item.codigo,
        descricao: item.descricao,
        ncm: item.ncm,
        cfop: item.cfop,
        unidade: item.unidade,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update company invoice number
      await supabase
        .from("companies")
        .update({ numero_nfe_atual: nextNumber })
        .eq("id", selectedCompany.id);

      toast.success("NF-e criada com sucesso!");
      navigate(`/notas-fiscais/${invoice.id}`);
    } catch (error: any) {
      toast.error("Erro ao criar NF-e: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Building2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma empresa</h2>
        <p className="text-muted-foreground">
          Selecione uma empresa no menu lateral para emitir notas fiscais.
        </p>
      </div>
    );
  }

  const { valorProdutos, valorTotal } = calculateTotals();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova NF-e</h1>
          <p className="text-muted-foreground">
            Emita uma nova nota fiscal eletrônica
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destinatário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Dados da NF-e
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="client_id">Cliente (Destinatário) *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, client_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome} - {client.documento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="natureza_operacao">Natureza da Operação *</Label>
              <Input
                id="natureza_operacao"
                value={formData.natureza_operacao}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    natureza_operacao: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add product form */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="product_id">Produto</Label>
                <Select
                  value={newItem.product_id}
                  onValueChange={(value) =>
                    setNewItem((prev) => ({ ...prev, product_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.codigo} - {product.descricao} ({formatCurrency(product.valor_unitario)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-32">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  step="1"
                  value={newItem.quantidade}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      quantidade: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Items table */}
            {items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.codigo}</TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell className="text-right">{item.quantidade}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.valor_unitario)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.valor_total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum produto adicionado. Selecione um produto acima.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Valores adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Valores Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_frete">Frete</Label>
              <Input
                id="valor_frete"
                type="number"
                step="0.01"
                value={formData.valor_frete}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valor_frete: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_seguro">Seguro</Label>
              <Input
                id="valor_seguro"
                type="number"
                step="0.01"
                value={formData.valor_seguro}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valor_seguro: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_desconto">Desconto</Label>
              <Input
                id="valor_desconto"
                type="number"
                step="0.01"
                value={formData.valor_desconto}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valor_desconto: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_outras_despesas">Outras Despesas</Label>
              <Input
                id="valor_outras_despesas"
                type="number"
                step="0.01"
                value={formData.valor_outras_despesas}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valor_outras_despesas: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações complementares */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Complementares</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Informações adicionais da nota fiscal..."
              value={formData.informacoes_complementares}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  informacoes_complementares: e.target.value,
                }))
              }
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Totais e ações */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Valor dos Produtos: {formatCurrency(valorProdutos)}
                </p>
                <p className="text-2xl font-bold">
                  Total: {formatCurrency(valorTotal)}
                </p>
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Salvar NF-e
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
