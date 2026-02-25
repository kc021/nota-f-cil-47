import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { CertificateUpload } from "@/components/CertificateUpload";

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO"
];

export default function EditarEmpresaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshCompanies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    razao_social: "", nome_fantasia: "", cnpj: "",
    inscricao_estadual: "", inscricao_municipal: "",
    regime_tributario: "simples_nacional",
    cep: "", logradouro: "", numero: "", complemento: "",
    bairro: "", cidade: "", uf: "", codigo_municipio: "",
    ambiente: "homologacao",
    certificate_file_path: null as string | null,
  });

  useEffect(() => {
    if (!id) return;
    const fetchCompany = async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Empresa não encontrada");
        navigate("/empresas");
        return;
      }

      setFormData({
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || "",
        cnpj: data.cnpj,
        inscricao_estadual: data.inscricao_estadual || "",
        inscricao_municipal: data.inscricao_municipal || "",
        regime_tributario: data.regime_tributario,
        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento || "",
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,
        codigo_municipio: data.codigo_municipio,
        ambiente: data.ambiente,
        certificate_file_path: data.certificate_file_path,
      });
      setFetching(false);
    };
    fetchCompany();
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
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
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.razao_social || !formData.cnpj) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("companies").update({
      razao_social: formData.razao_social,
      nome_fantasia: formData.nome_fantasia || null,
      cnpj: formData.cnpj.replace(/\D/g, ""),
      inscricao_estadual: formData.inscricao_estadual || null,
      inscricao_municipal: formData.inscricao_municipal || null,
      regime_tributario: formData.regime_tributario as any,
      cep: formData.cep.replace(/\D/g, ""),
      logradouro: formData.logradouro,
      numero: formData.numero,
      complemento: formData.complemento || null,
      bairro: formData.bairro,
      cidade: formData.cidade,
      uf: formData.uf,
      codigo_municipio: formData.codigo_municipio,
      ambiente: formData.ambiente as any,
    }).eq("id", id!);

    setLoading(false);
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success("Empresa atualizada!");
      await refreshCompanies();
      navigate("/empresas");
    }
  };

  const handleCertificateUploaded = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("companies")
      .select("certificate_file_path")
      .eq("id", id)
      .single();
    if (data) {
      setFormData((prev) => ({ ...prev, certificate_file_path: data.certificate_file_path }));
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/empresas")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Empresa</h1>
          <p className="text-muted-foreground">Atualize os dados da empresa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Razão Social *</Label>
              <Input value={formData.razao_social} onChange={(e) => handleChange("razao_social", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input value={formData.nome_fantasia} onChange={(e) => handleChange("nome_fantasia", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ *</Label>
              <Input value={formData.cnpj} onChange={(e) => handleChange("cnpj", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input value={formData.inscricao_estadual} onChange={(e) => handleChange("inscricao_estadual", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Municipal</Label>
              <Input value={formData.inscricao_municipal} onChange={(e) => handleChange("inscricao_municipal", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Regime Tributário *</Label>
              <Select value={formData.regime_tributario} onValueChange={(v) => handleChange("regime_tributario", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ambiente *</Label>
              <Select value={formData.ambiente} onValueChange={(v) => handleChange("ambiente", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CEP *</Label>
              <Input value={formData.cep} onChange={(e) => handleChange("cep", e.target.value)} onBlur={handleCepBlur} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Logradouro *</Label>
              <Input value={formData.logradouro} onChange={(e) => handleChange("logradouro", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Número *</Label>
              <Input value={formData.numero} onChange={(e) => handleChange("numero", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input value={formData.complemento} onChange={(e) => handleChange("complemento", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bairro *</Label>
              <Input value={formData.bairro} onChange={(e) => handleChange("bairro", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Input value={formData.cidade} onChange={(e) => handleChange("cidade", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>UF *</Label>
              <Select value={formData.uf} onValueChange={(v) => handleChange("uf", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Código IBGE</Label>
              <Input value={formData.codigo_municipio} onChange={(e) => handleChange("codigo_municipio", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate("/empresas")}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar alterações"}
          </Button>
        </div>
      </form>

      {/* Certificate Upload */}
      {id && (
        <CertificateUpload
          companyId={id}
          currentCertificatePath={formData.certificate_file_path}
          onUploaded={handleCertificateUploaded}
        />
      )}
    </div>
  );
}
