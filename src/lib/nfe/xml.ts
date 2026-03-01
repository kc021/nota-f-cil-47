import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function generateNFeXml(invoiceId: string): Promise<{
  success: boolean;
  chaveAcesso?: string;
  warning?: string;
}> {
  const toastId = toast.loading("Gerando XML da NF-e...");

  try {
    const { data, error } = await supabase.functions.invoke("generate-nfe-xml", {
      body: { invoice_id: invoiceId },
    });

    if (error) throw error;

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.warning) {
      toast.warning(data.warning, { id: toastId });
    } else {
      toast.success("XML gerado e assinado com sucesso!", { id: toastId });
    }

    return {
      success: true,
      chaveAcesso: data.chave_acesso,
      warning: data.warning,
    };
  } catch (err: any) {
    toast.error(`Erro ao gerar XML: ${err.message}`, { id: toastId });
    return { success: false };
  }
}

export async function downloadNFeXml(invoiceId: string) {
  try {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("xml_path, numero, serie")
      .eq("id", invoiceId)
      .single();

    if (!invoice?.xml_path) {
      toast.error("XML não encontrado. Gere o XML primeiro.");
      return;
    }

    const { data, error } = await supabase.storage
      .from("certificates")
      .download(invoice.xml_path);

    if (error) throw error;

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NFe_${invoice.numero}_${invoice.serie}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err: any) {
    toast.error(`Erro ao baixar XML: ${err.message}`);
  }
}
