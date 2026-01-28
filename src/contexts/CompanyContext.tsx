import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Company {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  ambiente: "homologacao" | "producao";
}

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  loading: boolean;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCompanies = async () => {
    if (!user) {
      setCompanies([]);
      setSelectedCompany(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("id, razao_social, nome_fantasia, cnpj, ambiente")
      .eq("is_active", true)
      .order("razao_social");

    if (!error && data) {
      setCompanies(data);
      if (data.length > 0 && !selectedCompany) {
        // Try to load from localStorage
        const savedCompanyId = localStorage.getItem("selectedCompanyId");
        const savedCompany = data.find((c) => c.id === savedCompanyId);
        setSelectedCompany(savedCompany || data[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshCompanies();
  }, [user]);

  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem("selectedCompanyId", selectedCompany.id);
    }
  }, [selectedCompany]);

  return (
    <CompanyContext.Provider
      value={{ companies, selectedCompany, setSelectedCompany, loading, refreshCompanies }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
