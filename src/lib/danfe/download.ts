import { supabase } from "@/integrations/supabase/client";
import { generateDanfePdf } from "@/lib/danfe/generator";
import type { DanfeData } from "@/lib/danfe/types";
import { toast } from "sonner";

export async function downloadDanfe(invoiceId: string) {
  const toastId = toast.loading("Gerando DANFE...");

  try {
    // Fetch invoice with related data
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) throw new Error("Nota fiscal não encontrada");

    // Fetch company
    const { data: company, error: compErr } = await supabase
      .from("companies")
      .select("*")
      .eq("id", invoice.company_id)
      .single();

    if (compErr || !company) throw new Error("Empresa não encontrada");

    // Fetch client
    const { data: client, error: cliErr } = await supabase
      .from("clients")
      .select("*")
      .eq("id", invoice.client_id)
      .single();

    if (cliErr || !client) throw new Error("Cliente não encontrado");

    // Fetch items
    const { data: items, error: itemsErr } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("numero_item");

    if (itemsErr) throw new Error("Erro ao carregar itens");

    const danfeData: DanfeData = {
      numero: invoice.numero,
      serie: invoice.serie,
      chave_acesso: invoice.chave_acesso,
      natureza_operacao: invoice.natureza_operacao,
      data_emissao: invoice.data_emissao,
      data_autorizacao: invoice.data_autorizacao,
      protocolo_autorizacao: invoice.protocolo_autorizacao,
      ambiente: invoice.ambiente,
      status: invoice.status,
      informacoes_complementares: invoice.informacoes_complementares,
      valor_produtos: Number(invoice.valor_produtos),
      valor_frete: Number(invoice.valor_frete),
      valor_seguro: Number(invoice.valor_seguro),
      valor_desconto: Number(invoice.valor_desconto),
      valor_outras_despesas: Number(invoice.valor_outras_despesas),
      valor_icms: Number(invoice.valor_icms),
      valor_ipi: Number(invoice.valor_ipi),
      valor_pis: Number(invoice.valor_pis),
      valor_cofins: Number(invoice.valor_cofins),
      valor_total: Number(invoice.valor_total),
      emitente: {
        razao_social: company.razao_social,
        nome_fantasia: company.nome_fantasia,
        cnpj: company.cnpj,
        inscricao_estadual: company.inscricao_estadual,
        inscricao_municipal: company.inscricao_municipal,
        logradouro: company.logradouro,
        numero: company.numero,
        complemento: company.complemento,
        bairro: company.bairro,
        cidade: company.cidade,
        uf: company.uf,
        cep: company.cep,
        regime_tributario: company.regime_tributario,
      },
      destinatario: {
        nome: client.nome,
        documento: client.documento,
        tipo_documento: client.tipo_documento,
        inscricao_estadual: client.inscricao_estadual,
        logradouro: client.logradouro,
        numero: client.numero,
        complemento: client.complemento,
        bairro: client.bairro,
        cidade: client.cidade,
        uf: client.uf,
        cep: client.cep,
        email: client.email,
        telefone: client.telefone,
      },
      items: (items || []).map((item) => ({
        numero_item: item.numero_item,
        codigo: item.codigo,
        descricao: item.descricao,
        ncm: item.ncm,
        cst: item.cst,
        csosn: item.csosn,
        cfop: item.cfop,
        unidade: item.unidade,
        quantidade: Number(item.quantidade),
        valor_unitario: Number(item.valor_unitario),
        valor_total: Number(item.valor_total),
        icms_base: Number(item.icms_base),
        icms_aliquota: Number(item.icms_aliquota),
        icms_valor: Number(item.icms_valor),
        ipi_aliquota: Number(item.ipi_aliquota),
        ipi_valor: Number(item.ipi_valor),
      })),
    };

    const pdf = await generateDanfePdf(danfeData);
    const filename = `DANFE_${invoice.numero}_${invoice.serie}.pdf`;
    pdf.save(filename);

    toast.dismiss(toastId);
    toast.success("DANFE gerado com sucesso!");
  } catch (error: any) {
    toast.dismiss(toastId);
    toast.error("Erro ao gerar DANFE: " + (error.message || "Erro desconhecido"));
    console.error("Erro DANFE:", error);
  }
}
