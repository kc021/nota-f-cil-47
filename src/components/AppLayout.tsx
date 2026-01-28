import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  Package,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Plus,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Notas Fiscais", href: "/notas-fiscais", icon: FileText },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Produtos", href: "/produtos", icon: Package },
  { name: "Empresas", href: "/empresas", icon: Building2 },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { companies, selectedCompany, setSelectedCompany } = useCompany();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 gradient-sidebar transform transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">
                NF-e Manager
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground hover:text-sidebar-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Company Selector */}
          <div className="p-4 border-b border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <div className="flex items-center min-w-0">
                    <Building2 className="w-4 h-4 mr-2 shrink-0" />
                    <span className="truncate">
                      {selectedCompany?.nome_fantasia ||
                        selectedCompany?.razao_social ||
                        "Selecionar empresa"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Suas Empresas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {companies.length === 0 ? (
                  <DropdownMenuItem disabled>
                    Nenhuma empresa cadastrada
                  </DropdownMenuItem>
                ) : (
                  companies.map((company) => (
                    <DropdownMenuItem
                      key={company.id}
                      onClick={() => setSelectedCompany(company)}
                      className={cn(
                        selectedCompany?.id === company.id && "bg-accent"
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {company.nome_fantasia || company.razao_social}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {company.cnpj}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/empresas/nova" className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar empresa
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center mr-2">
                    <span className="text-sm font-medium text-sidebar-primary-foreground">
                      {user?.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium truncate">
                      {user?.user_metadata?.full_name || "Usuário"}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60 truncate">
                      {user?.email}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/configuracoes">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-foreground hover:bg-accent rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 ml-auto">
              {selectedCompany && (
                <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-secondary text-sm">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full mr-2",
                      selectedCompany.ambiente === "producao"
                        ? "bg-success"
                        : "bg-warning"
                    )}
                  />
                  {selectedCompany.ambiente === "producao"
                    ? "Produção"
                    : "Homologação"}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
