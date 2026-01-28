import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Package, Building2 } from "lucide-react";

const UNIDADES = ["UN", "KG", "G", "L", "ML", "M", "M2", "M3", "PC", "CX", "DZ", "PAR"];
const ORIGENS = [
  { value: "0", label: "0 - Nacional" },
  { value: "1", label: "1 - Estrangeira (importação direta)" },
  { value: "2", label: "2 - Estrangeira (adquirida mercado interno)" },
];

export default function NovoProdutoPage() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    ncm: "",
    cfop: "",
    cst: "",
    csosn: "",
    unidade: "UN",
    valor_unitario: "",
    origem: "0",
    icms_aliquota: "",
    ipi_aliquota: "",
    pis_aliquota: "",
    cofins_aliquota: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompany) {
      toast.error("Selecione uma empresa");
      return;
    }

    if (!formData.codigo || !formData.descricao || !formData.ncm || !formData.cfop) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("products").insert({
      company_id: selectedCompany.id,
      codigo: formData.codigo,
      descricao: formData.descricao,
      ncm: formData.ncm.replace(/\D/g, ""),
      cfop: formData.cfop.replace(/\D/g, ""),
      cst: formData.cst || null,
      csosn: formData.csosn || null,
      unidade: formData.unidade,
      valor_unitario: parseFloat(formData.valor_unitario) || 0,
      origem: formData.origem,
      icms_aliquota: formData.icms_aliquota ? parseFloat(formData.icms_aliquota) : null,
      ipi_aliquota: formData.ipi_aliquota ? parseFloat(formData.ipi_aliquota) : null,
      pis_aliquota: formData.pis_aliquota ? parseFloat(formData.pis_aliquota) : null,
      cofins_aliquota: formData.cofins_aliquota ? parseFloat(formData.cofins_aliquota) : null,
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao cadastrar produto: " + error.message);
    } else {
      toast.success("Produto cadastrado com sucesso!");
      navigate("/produtos");
    }
  };

  if (!selectedCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Building2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma empresa</h2>
        <p className="text-muted-foreground">
          Selecione uma empresa no menu lateral para cadastrar produtos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Produto</h1>
          <p className="text-muted-foreground">Cadastre um novo produto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Produto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Dados do Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => handleChange("codigo", e.target.value)}
                placeholder="Código interno"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade *</Label>
              <Select
                value={formData.unidade}
                onValueChange={(value) => handleChange("unidade", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((un) => (
                    <SelectItem key={un} value={un}>
                      {un}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder="Descrição do produto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ncm">NCM *</Label>
              <Input
                id="ncm"
                value={formData.ncm}
                onChange={(e) => handleChange("ncm", e.target.value)}
                placeholder="00000000"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cfop">CFOP *</Label>
              <Input
                id="cfop"
                value={formData.cfop}
                onChange={(e) => handleChange("cfop", e.target.value)}
                placeholder="5102"
                maxLength={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_unitario">Valor Unitário *</Label>
              <Input
                id="valor_unitario"
                type="number"
                step="0.01"
                value={formData.valor_unitario}
                onChange={(e) => handleChange("valor_unitario", e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem">Origem *</Label>
              <Select
                value={formData.origem}
                onValueChange={(value) => handleChange("origem", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tributação */}
        <Card>
          <CardHeader>
            <CardTitle>Tributação</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cst">CST (Regime Normal)</Label>
              <Input
                id="cst"
                value={formData.cst}
                onChange={(e) => handleChange("cst", e.target.value)}
                placeholder="00"
                maxLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="csosn">CSOSN (Simples Nacional)</Label>
              <Input
                id="csosn"
                value={formData.csosn}
                onChange={(e) => handleChange("csosn", e.target.value)}
                placeholder="102"
                maxLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icms_aliquota">Alíquota ICMS (%)</Label>
              <Input
                id="icms_aliquota"
                type="number"
                step="0.01"
                value={formData.icms_aliquota}
                onChange={(e) => handleChange("icms_aliquota", e.target.value)}
                placeholder="18.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipi_aliquota">Alíquota IPI (%)</Label>
              <Input
                id="ipi_aliquota"
                type="number"
                step="0.01"
                value={formData.ipi_aliquota}
                onChange={(e) => handleChange("ipi_aliquota", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pis_aliquota">Alíquota PIS (%)</Label>
              <Input
                id="pis_aliquota"
                type="number"
                step="0.0001"
                value={formData.pis_aliquota}
                onChange={(e) => handleChange("pis_aliquota", e.target.value)}
                placeholder="1.65"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cofins_aliquota">Alíquota COFINS (%)</Label>
              <Input
                id="cofins_aliquota"
                type="number"
                step="0.0001"
                value={formData.cofins_aliquota}
                onChange={(e) => handleChange("cofins_aliquota", e.target.value)}
                placeholder="7.60"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
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
              "Cadastrar produto"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
