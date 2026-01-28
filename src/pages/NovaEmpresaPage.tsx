import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowLeft, Loader2, Building2 } from "lucide-react";

const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function NovaEmpresaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCompanies } = useCompany();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    regime_tributario: "simples_nacional",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    codigo_municipio: "",
    ambiente: "homologacao",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          uf: data.uf || "",
          codigo_municipio: data.ibge || "",
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.razao_social || !formData.cnpj || !formData.cep || !formData.logradouro) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("companies").insert({
      user_id: user?.id as string,
      razao_social: formData.razao_social,
      nome_fantasia: formData.nome_fantasia || null,
      cnpj: formData.cnpj.replace(/\D/g, ""),
      inscricao_estadual: formData.inscricao_estadual || null,
      inscricao_municipal: formData.inscricao_municipal || null,
      regime_tributario: formData.regime_tributario as "simples_nacional" | "lucro_presumido" | "lucro_real",
      cep: formData.cep.replace(/\D/g, ""),
      logradouro: formData.logradouro,
      numero: formData.numero,
      complemento: formData.complemento || null,
      bairro: formData.bairro,
      cidade: formData.cidade,
      uf: formData.uf,
      codigo_municipio: formData.codigo_municipio,
      ambiente: formData.ambiente as "homologacao" | "producao",
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao cadastrar empresa: " + error.message);
    } else {
      toast.success("Empresa cadastrada com sucesso!");
      await refreshCompanies();
      navigate("/empresas");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Empresa</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova empresa emitente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Informações básicas da empresa emitente
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="razao_social">Razão Social *</Label>
              <Input
                id="razao_social"
                value={formData.razao_social}
                onChange={(e) => handleChange("razao_social", e.target.value)}
                placeholder="Razão social da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
              <Input
                id="nome_fantasia"
                value={formData.nome_fantasia}
                onChange={(e) => handleChange("nome_fantasia", e.target.value)}
                placeholder="Nome fantasia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleChange("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
              <Input
                id="inscricao_estadual"
                value={formData.inscricao_estadual}
                onChange={(e) => handleChange("inscricao_estadual", e.target.value)}
                placeholder="Inscrição estadual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
              <Input
                id="inscricao_municipal"
                value={formData.inscricao_municipal}
                onChange={(e) => handleChange("inscricao_municipal", e.target.value)}
                placeholder="Inscrição municipal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regime_tributario">Regime Tributário *</Label>
              <Select
                value={formData.regime_tributario}
                onValueChange={(value) => handleChange("regime_tributario", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambiente">Ambiente *</Label>
              <Select
                value={formData.ambiente}
                onValueChange={(value) => handleChange("ambiente", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>
              Endereço completo da empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleChange("cep", e.target.value)}
                onBlur={handleCepBlur}
                placeholder="00000-000"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="logradouro">Logradouro *</Label>
              <Input
                id="logradouro"
                value={formData.logradouro}
                onChange={(e) => handleChange("logradouro", e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleChange("numero", e.target.value)}
                placeholder="Número"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) => handleChange("complemento", e.target.value)}
                placeholder="Sala, Andar, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => handleChange("bairro", e.target.value)}
                placeholder="Bairro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleChange("cidade", e.target.value)}
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">UF *</Label>
              <Select
                value={formData.uf}
                onValueChange={(value) => handleChange("uf", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UF_LIST.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_municipio">Código IBGE</Label>
              <Input
                id="codigo_municipio"
                value={formData.codigo_municipio}
                onChange={(e) => handleChange("codigo_municipio", e.target.value)}
                placeholder="Código IBGE"
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
              "Cadastrar empresa"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
