import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  CheckCircle,
  Shield,
  Zap,
  Building2,
  Users,
  Package,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Emissão de NF-e",
    description: "Emita notas fiscais eletrônicas modelo 55 em conformidade com a SEFAZ",
  },
  {
    icon: CheckCircle,
    title: "DANFE em PDF",
    description: "Gere o DANFE automaticamente com código de barras e QR Code",
  },
  {
    icon: Shield,
    title: "Certificado A1",
    description: "Suporte a certificados digitais A1 para assinatura das notas",
  },
  {
    icon: Zap,
    title: "Multi-empresa",
    description: "Gerencie várias empresas em uma única conta",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">NF-e Manager</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Emita suas{" "}
              <span className="text-primary">Notas Fiscais</span>{" "}
              com facilidade
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema completo para emissão de NF-e modelo 55, geração de DANFE em PDF
              e gestão fiscal para pequenas e médias empresas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/auth">
                  Começar agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tudo que você precisa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-interactive">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Módulos integrados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Empresas</h3>
              <p className="text-muted-foreground">
                Cadastre múltiplas empresas emitentes
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Clientes</h3>
              <p className="text-muted-foreground">
                Gerencie seus clientes e destinatários
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Produtos</h3>
              <p className="text-muted-foreground">
                Catálogo completo com NCM, CFOP e tributos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Pronto para começar?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Crie sua conta gratuitamente e comece a emitir notas fiscais hoje mesmo.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link to="/auth">Criar conta grátis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 NF-e Manager. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
