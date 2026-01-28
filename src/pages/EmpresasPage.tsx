import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Company {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  inscricao_estadual: string | null;
  regime_tributario: string;
  cidade: string;
  uf: string;
  ambiente: string;
  is_active: boolean;
  certificate_file_path: string | null;
}

export default function EmpresasPage() {
  const { user } = useAuth();
  const { refreshCompanies } = useCompany();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("razao_social");

    if (error) {
      toast.error("Erro ao carregar empresas");
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa? Esta ação é irreversível.")) {
      return;
    }

    const { error } = await supabase.from("companies").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir empresa");
    } else {
      toast.success("Empresa excluída com sucesso");
      fetchCompanies();
      refreshCompanies();
    }
  };

  const formatCnpj = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const getRegimeLabel = (regime: string) => {
    const labels: Record<string, string> = {
      simples_nacional: "Simples Nacional",
      lucro_presumido: "Lucro Presumido",
      lucro_real: "Lucro Real",
    };
    return labels[regime] || regime;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie suas empresas emitentes
          </p>
        </div>
        <Button asChild>
          <Link to="/empresas/nova">
            <Plus className="w-4 h-4 mr-2" />
            Nova empresa
          </Link>
        </Button>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : companies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-muted-foreground mb-6">
              Cadastre sua primeira empresa para começar a emitir notas fiscais.
            </p>
            <Button asChild>
              <Link to="/empresas/nova">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar empresa
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="card-interactive">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">
                      {company.nome_fantasia || company.razao_social}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCnpj(company.cnpj)}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/empresas/${company.id}`}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(company.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Regime:</span>
                  <span>{getRegimeLabel(company.regime_tributario)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Localização:</span>
                  <span>
                    {company.cidade}/{company.uf}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ambiente:</span>
                  <Badge
                    variant={company.ambiente === "producao" ? "default" : "secondary"}
                    className={
                      company.ambiente === "producao"
                        ? "bg-success hover:bg-success"
                        : "bg-warning hover:bg-warning text-warning-foreground"
                    }
                  >
                    {company.ambiente === "producao" ? "Produção" : "Homologação"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Certificado:</span>
                  {company.certificate_file_path ? (
                    <span className="flex items-center text-sm text-success">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Instalado
                    </span>
                  ) : (
                    <span className="flex items-center text-sm text-warning">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Pendente
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
