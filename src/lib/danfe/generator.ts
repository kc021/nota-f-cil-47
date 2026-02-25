import jsPDF from "jspdf";
import QRCode from "qrcode";
import { generateITFBarcodeDataUrl } from "./barcode";
import type { DanfeData } from "./types";

const PAGE_W = 210; // A4 width mm
const PAGE_H = 297; // A4 height mm
const M = 5; // margin
const CW = PAGE_W - M * 2; // content width
const FONT_SM = 6;
const FONT_MD = 7;
const FONT_LG = 9;
const FONT_XL = 12;
const LINE_H = 3.5;

function formatCnpj(v: string) {
  const d = v.replace(/\D/g, "");
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatCpfCnpj(v: string, tipo: string) {
  const d = v.replace(/\D/g, "");
  if (tipo === "cpf" || d.length === 11) {
    return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return formatCnpj(d);
}

function formatCep(v: string) {
  const d = v.replace(/\D/g, "");
  return d.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR");
}

function formatChaveAcesso(chave: string) {
  const d = chave.replace(/\D/g, "");
  return d.replace(/(.{4})/g, "$1 ").trim();
}

// Draw a labeled box
function drawBox(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string, opts?: { fontSize?: number; bold?: boolean; align?: "left" | "center" | "right" }) {
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, h);

  doc.setFontSize(FONT_SM);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(label, x + 1, y + 3);

  const fs = opts?.fontSize || FONT_MD;
  doc.setFontSize(fs);
  doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
  doc.setTextColor(0);

  const align = opts?.align || "left";
  let tx = x + 1;
  if (align === "center") tx = x + w / 2;
  if (align === "right") tx = x + w - 1;

  doc.text(value || "", tx, y + h - 2, { align });
}

export async function generateDanfePdf(data: DanfeData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = M;
  const { emitente, destinatario, items } = data;

  // ===== HEADER - IDENTIFICATION =====
  const headerH = 32;

  // Emitente box (left)
  const emitW = 90;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(M, y, emitW, headerH);

  doc.setFontSize(FONT_XL);
  doc.setFont("helvetica", "bold");
  doc.text(emitente.nome_fantasia || emitente.razao_social, M + 2, y + 6);

  doc.setFontSize(FONT_SM);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  if (emitente.nome_fantasia) {
    doc.text(emitente.razao_social, M + 2, y + 10);
  }
  const endEmit = `${emitente.logradouro}, ${emitente.numero}${emitente.complemento ? " - " + emitente.complemento : ""}`;
  doc.text(endEmit, M + 2, y + 14);
  doc.text(`${emitente.bairro} - ${emitente.cidade}/${emitente.uf} - CEP: ${formatCep(emitente.cep)}`, M + 2, y + 18);
  doc.text(`CNPJ: ${formatCnpj(emitente.cnpj)}`, M + 2, y + 22);
  if (emitente.inscricao_estadual) {
    doc.text(`IE: ${emitente.inscricao_estadual}`, M + 2, y + 26);
  }
  doc.setTextColor(0);

  // DANFE Title box (center)
  const titleX = M + emitW;
  const titleW = 40;
  doc.rect(titleX, y, titleW, headerH);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DANFE", titleX + titleW / 2, y + 8, { align: "center" });

  doc.setFontSize(FONT_SM);
  doc.setFont("helvetica", "normal");
  doc.text("Documento Auxiliar da", titleX + titleW / 2, y + 13, { align: "center" });
  doc.text("Nota Fiscal Eletrônica", titleX + titleW / 2, y + 17, { align: "center" });

  doc.setFontSize(FONT_MD);
  doc.text("0 - ENTRADA", titleX + 3, y + 23);
  doc.text("1 - SAÍDA", titleX + 3, y + 27);

  // Entry/exit indicator box
  doc.rect(titleX + titleW - 10, y + 20, 8, 8);
  doc.setFontSize(FONT_LG);
  doc.setFont("helvetica", "bold");
  doc.text("1", titleX + titleW - 6, y + 26, { align: "center" });

  // NF-e info box (right)
  const infoX = titleX + titleW;
  const infoW = CW - emitW - titleW;
  doc.rect(infoX, y, infoW, headerH);

  doc.setFontSize(FONT_SM);
  doc.setFont("helvetica", "normal");
  doc.text("CHAVE DE ACESSO", infoX + 2, y + 4);

  if (data.chave_acesso) {
    doc.setFontSize(FONT_SM);
    doc.setFont("helvetica", "bold");
    doc.text(formatChaveAcesso(data.chave_acesso), infoX + 2, y + 8);
  }

  doc.setFontSize(FONT_SM);
  doc.setFont("helvetica", "normal");
  doc.text("Consulta de autenticidade no portal nacional", infoX + 2, y + 14);
  doc.text("da NF-e: www.nfe.fazenda.gov.br/portal", infoX + 2, y + 18);

  if (data.protocolo_autorizacao) {
    doc.setFontSize(FONT_SM);
    doc.text("PROTOCOLO DE AUTORIZAÇÃO", infoX + 2, y + 24);
    doc.setFont("helvetica", "bold");
    doc.text(data.protocolo_autorizacao, infoX + 2, y + 28);
  }

  y += headerH;

  // ===== BARCODE ROW =====
  const barcodeH = 18;
  doc.rect(M, y, CW, barcodeH);

  if (data.chave_acesso) {
    try {
      const barcodeImg = generateITFBarcodeDataUrl(data.chave_acesso, 40);
      doc.addImage(barcodeImg, "PNG", M + 10, y + 1, CW - 20, barcodeH - 2);
    } catch (e) {
      doc.setFontSize(FONT_SM);
      doc.text("Código de barras indisponível", M + CW / 2, y + barcodeH / 2, { align: "center" });
    }
  }

  y += barcodeH;

  // ===== NF-e NUMBER ROW =====
  const numRowH = 10;
  const numW = CW / 5;
  drawBox(doc, M, y, numW, numRowH, "NATUREZA DA OPERAÇÃO", data.natureza_operacao);
  drawBox(doc, M + numW, y, numW * 0.6, numRowH, "NF-e Nº", String(data.numero).padStart(9, "0"), { bold: true, align: "center" });
  drawBox(doc, M + numW * 1.6, y, numW * 0.4, numRowH, "SÉRIE", String(data.serie), { align: "center" });
  drawBox(doc, M + numW * 2, y, numW, numRowH, "DATA DE EMISSÃO", formatDate(data.data_emissao), { align: "center" });
  drawBox(doc, M + numW * 3, y, numW, numRowH, "DATA SAÍDA/ENTRADA", data.data_autorizacao ? formatDate(data.data_autorizacao) : "", { align: "center" });
  drawBox(doc, M + numW * 4, y, numW, numRowH, "HORA SAÍDA", data.data_autorizacao ? new Date(data.data_autorizacao).toLocaleTimeString("pt-BR") : "", { align: "center" });
  y += numRowH;

  // ===== DESTINATÁRIO =====
  const destTitleH = 5;
  doc.setFillColor(230, 230, 230);
  doc.rect(M, y, CW, destTitleH, "FD");
  doc.setFontSize(FONT_SM);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("DESTINATÁRIO / REMETENTE", M + 2, y + 3.5);
  y += destTitleH;

  const destH = 10;
  drawBox(doc, M, y, CW * 0.55, destH, "NOME / RAZÃO SOCIAL", destinatario.nome);
  drawBox(doc, M + CW * 0.55, y, CW * 0.25, destH, "CNPJ/CPF", formatCpfCnpj(destinatario.documento, destinatario.tipo_documento));
  drawBox(doc, M + CW * 0.8, y, CW * 0.2, destH, "DATA DE EMISSÃO", formatDate(data.data_emissao));
  y += destH;

  const endDest = [destinatario.logradouro, destinatario.numero].filter(Boolean).join(", ");
  drawBox(doc, M, y, CW * 0.55, destH, "ENDEREÇO", endDest);
  drawBox(doc, M + CW * 0.55, y, CW * 0.2, destH, "BAIRRO", destinatario.bairro || "");
  drawBox(doc, M + CW * 0.75, y, CW * 0.15, destH, "CEP", destinatario.cep ? formatCep(destinatario.cep) : "");
  drawBox(doc, M + CW * 0.9, y, CW * 0.1, destH, "UF", destinatario.uf || "");
  y += destH;

  drawBox(doc, M, y, CW * 0.4, destH, "MUNICÍPIO", destinatario.cidade || "");
  drawBox(doc, M + CW * 0.4, y, CW * 0.2, destH, "TELEFONE", destinatario.telefone || "");
  drawBox(doc, M + CW * 0.6, y, CW * 0.2, destH, "INSCRIÇÃO ESTADUAL", destinatario.inscricao_estadual || "");
  drawBox(doc, M + CW * 0.8, y, CW * 0.2, destH, "E-MAIL", destinatario.email || "");
  y += destH;

  // ===== IMPOSTOS / TOTAIS =====
  const taxTitleH = 5;
  doc.setFillColor(230, 230, 230);
  doc.rect(M, y, CW, taxTitleH, "FD");
  doc.setFontSize(FONT_SM);
  doc.setFont("helvetica", "bold");
  doc.text("CÁLCULO DO IMPOSTO", M + 2, y + 3.5);
  y += taxTitleH;

  const taxH = 10;
  const taxCols = 5;
  const taxW = CW / taxCols;

  drawBox(doc, M, y, taxW, taxH, "BASE CÁLC. ICMS", formatCurrency(data.valor_produtos), { align: "right" });
  drawBox(doc, M + taxW, y, taxW, taxH, "VALOR ICMS", formatCurrency(data.valor_icms), { align: "right" });
  drawBox(doc, M + taxW * 2, y, taxW, taxH, "VALOR FRETE", formatCurrency(data.valor_frete), { align: "right" });
  drawBox(doc, M + taxW * 3, y, taxW, taxH, "VALOR SEGURO", formatCurrency(data.valor_seguro), { align: "right" });
  drawBox(doc, M + taxW * 4, y, taxW, taxH, "DESCONTO", formatCurrency(data.valor_desconto), { align: "right" });
  y += taxH;

  drawBox(doc, M, y, taxW, taxH, "OUTRAS DESPESAS", formatCurrency(data.valor_outras_despesas), { align: "right" });
  drawBox(doc, M + taxW, y, taxW, taxH, "VALOR IPI", formatCurrency(data.valor_ipi), { align: "right" });
  drawBox(doc, M + taxW * 2, y, taxW, taxH, "VALOR PIS", formatCurrency(data.valor_pis), { align: "right" });
  drawBox(doc, M + taxW * 3, y, taxW, taxH, "VALOR COFINS", formatCurrency(data.valor_cofins), { align: "right" });
  drawBox(doc, M + taxW * 4, y, taxW, taxH, "VALOR TOTAL DA NF-e", formatCurrency(data.valor_total), { align: "right", bold: true, fontSize: FONT_LG });
  y += taxH;

  // ===== ITEMS TABLE =====
  const itemTitleH = 5;
  doc.setFillColor(230, 230, 230);
  doc.rect(M, y, CW, itemTitleH, "FD");
  doc.setFontSize(FONT_SM);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DOS PRODUTOS / SERVIÇOS", M + 2, y + 3.5);
  y += itemTitleH;

  // Item header
  const itemHeaderH = 6;
  const cols = [
    { label: "CÓDIGO", w: 18 },
    { label: "DESCRIÇÃO", w: 52 },
    { label: "NCM", w: 16 },
    { label: "CST", w: 10 },
    { label: "CFOP", w: 12 },
    { label: "UN", w: 10 },
    { label: "QTDE", w: 14 },
    { label: "VL.UNIT", w: 16 },
    { label: "VL.TOTAL", w: 16 },
    { label: "BC ICMS", w: 16 },
    { label: "VL.ICMS", w: 12 },
    { label: "VL.IPI", w: 8 },
  ];

  let cx = M;
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  for (const col of cols) {
    doc.rect(cx, y, col.w, itemHeaderH);
    doc.text(col.label, cx + col.w / 2, y + 4, { align: "center" });
    cx += col.w;
  }
  y += itemHeaderH;

  // Item rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);

  const maxItemY = PAGE_H - 50; // Reserve space for footer

  for (const item of items) {
    if (y + LINE_H * 2 > maxItemY) {
      // New page
      doc.addPage();
      y = M;

      // Repeat item header
      cx = M;
      doc.setFont("helvetica", "bold");
      for (const col of cols) {
        doc.rect(cx, y, col.w, itemHeaderH);
        doc.text(col.label, cx + col.w / 2, y + 4, { align: "center" });
        cx += col.w;
      }
      y += itemHeaderH;
      doc.setFont("helvetica", "normal");
    }

    const rowH = 5;
    const values = [
      item.codigo,
      item.descricao.substring(0, 40),
      item.ncm,
      item.cst || item.csosn || "",
      item.cfop,
      item.unidade,
      formatCurrency(item.quantidade),
      formatCurrency(item.valor_unitario),
      formatCurrency(item.valor_total),
      formatCurrency(item.icms_base),
      formatCurrency(item.icms_valor),
      formatCurrency(item.ipi_valor),
    ];

    cx = M;
    for (let i = 0; i < cols.length; i++) {
      doc.rect(cx, y, cols[i].w, rowH);
      const align = i >= 6 ? "right" : "left";
      const tx = align === "right" ? cx + cols[i].w - 1 : cx + 1;
      doc.text(values[i], tx, y + 3.5, { align });
      cx += cols[i].w;
    }
    y += rowH;
  }

  // ===== INFORMAÇÕES COMPLEMENTARES =====
  y = Math.max(y + 2, PAGE_H - 45);

  const infoTitleH2 = 5;
  doc.setFillColor(230, 230, 230);
  doc.rect(M, y, CW, infoTitleH2, "FD");
  doc.setFontSize(FONT_SM);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMAÇÕES COMPLEMENTARES", M + 2, y + 3.5);
  y += infoTitleH2;

  const infoBoxH = 20;
  const qrSize = 20;
  doc.rect(M, y, CW - qrSize - 2, infoBoxH);

  doc.setFontSize(FONT_SM);
  doc.setFont("helvetica", "normal");
  const infoText = data.informacoes_complementares || "";
  const infoLines = doc.splitTextToSize(infoText, CW - qrSize - 6);
  doc.text(infoLines.slice(0, 5), M + 2, y + 4);

  // Ambiente indicator
  if (data.ambiente === "homologacao") {
    doc.setFontSize(FONT_SM);
    doc.setTextColor(200, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("SEM VALOR FISCAL - AMBIENTE DE HOMOLOGAÇÃO", M + 2, y + infoBoxH - 2);
    doc.setTextColor(0);
  }

  // QR Code
  const qrX = M + CW - qrSize;
  doc.rect(qrX, y, qrSize, infoBoxH);

  if (data.chave_acesso) {
    try {
      const qrUrl = `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&nfe=${data.chave_acesso}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 200, margin: 1 });
      doc.addImage(qrDataUrl, "PNG", qrX + 1, y + 1, qrSize - 2, infoBoxH - 2);
    } catch (e) {
      doc.setFontSize(5);
      doc.text("QR Code", qrX + qrSize / 2, y + infoBoxH / 2, { align: "center" });
    }
  }

  y += infoBoxH;

  // ===== FOOTER =====
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text("Documento gerado automaticamente pelo sistema NF-e SaaS", PAGE_W / 2, y + 4, { align: "center" });

  return doc;
}
