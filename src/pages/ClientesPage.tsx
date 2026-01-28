import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
} from "lucide-react";

interface Client {
  id: string;
  nome: string;
  tipo_documento: string;
  documento: string;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
}

export default function ClientesPage() {
  const { selectedCompany } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (selectedCompany) {
      fetchClients();
    } else {
      setClients([]);
      setLoading(false);
    }
  }, [selectedCompany]);

  const fetchClients = async () => {
    if (!selectedCompany) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("company_id", selectedCompany.id)
      .eq("is_active", true)
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar clientes");
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
      return;
    }

    const { error } = await supabase
      .from("clients")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir cliente");
    } else {
      toast.success("Cliente excluído com sucesso");
      fetchClients();
    }
  };

  const formatDocument = (tipo: string, doc: string) => {
    if (tipo === "cpf") {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const filteredClients = clients.filter(
    (client) =>
      client.nome.toLowerCase().includes(search.toLowerCase()) ||
      client.documento.includes(search.replace(/\D/g, ""))
  );

  if (!selectedCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Building2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma empresa</h2>
        <p className="text-muted-foreground">
          Selecione uma empresa no menu lateral para visualizar os clientes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes da sua empresa
          </p>
        </div>
        <Button asChild>
          <Link to="/clientes/novo">
            <Plus className="w-4 h-4 mr-2" />
            Novo cliente
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
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
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {search
                  ? "Tente buscar com outros termos"
                  : "Cadastre seu primeiro cliente para começar"}
              </p>
              {!search && (
                <Button asChild>
                  <Link to="/clientes/novo">
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar cliente
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden md:table-cell">Cidade/UF</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.nome}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground uppercase mr-1">
                        {client.tipo_documento}:
                      </span>
                      {formatDocument(client.tipo_documento, client.documento)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {client.email || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {client.cidade && client.uf
                        ? `${client.cidade}/${client.uf}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/clientes/${client.id}`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(client.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
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
    </div>
  );
}
