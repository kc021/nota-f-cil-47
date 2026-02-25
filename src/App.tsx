import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import RecuperarSenhaPage from "./pages/RecuperarSenhaPage";
import DashboardPage from "./pages/DashboardPage";
import EmpresasPage from "./pages/EmpresasPage";
import NovaEmpresaPage from "./pages/NovaEmpresaPage";
import ClientesPage from "./pages/ClientesPage";
import NovoClientePage from "./pages/NovoClientePage";
import ProdutosPage from "./pages/ProdutosPage";
import NovoProdutoPage from "./pages/NovoProdutoPage";
import NotasFiscaisPage from "./pages/NotasFiscaisPage";
import NovaNotaFiscalPage from "./pages/NovaNotaFiscalPage";
import EditarEmpresaPage from "./pages/EditarEmpresaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompanyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/empresas" element={<ProtectedRoute><AppLayout><EmpresasPage /></AppLayout></ProtectedRoute>} />
              <Route path="/empresas/nova" element={<ProtectedRoute><AppLayout><NovaEmpresaPage /></AppLayout></ProtectedRoute>} />
              <Route path="/empresas/:id" element={<ProtectedRoute><AppLayout><EditarEmpresaPage /></AppLayout></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute><AppLayout><ClientesPage /></AppLayout></ProtectedRoute>} />
              <Route path="/clientes/novo" element={<ProtectedRoute><AppLayout><NovoClientePage /></AppLayout></ProtectedRoute>} />
              <Route path="/clientes/:id" element={<ProtectedRoute><AppLayout><NovoClientePage /></AppLayout></ProtectedRoute>} />
              <Route path="/produtos" element={<ProtectedRoute><AppLayout><ProdutosPage /></AppLayout></ProtectedRoute>} />
              <Route path="/produtos/novo" element={<ProtectedRoute><AppLayout><NovoProdutoPage /></AppLayout></ProtectedRoute>} />
              <Route path="/produtos/:id" element={<ProtectedRoute><AppLayout><NovoProdutoPage /></AppLayout></ProtectedRoute>} />
              <Route path="/notas-fiscais" element={<ProtectedRoute><AppLayout><NotasFiscaisPage /></AppLayout></ProtectedRoute>} />
              <Route path="/notas-fiscais/nova" element={<ProtectedRoute><AppLayout><NovaNotaFiscalPage /></AppLayout></ProtectedRoute>} />
              <Route path="/notas-fiscais/:id" element={<ProtectedRoute><AppLayout><NotasFiscaisPage /></AppLayout></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CompanyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
