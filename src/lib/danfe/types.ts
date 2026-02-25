export interface DanfeEmitente {
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  regime_tributario: string;
}

export interface DanfeDestinatario {
  nome: string;
  documento: string;
  tipo_documento: string;
  inscricao_estadual: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  email: string | null;
  telefone: string | null;
}

export interface DanfeItem {
  numero_item: number;
  codigo: string;
  descricao: string;
  ncm: string;
  cst: string | null;
  csosn: string | null;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  icms_base: number;
  icms_aliquota: number;
  icms_valor: number;
  ipi_aliquota: number;
  ipi_valor: number;
}

export interface DanfeData {
  numero: number;
  serie: number;
  chave_acesso: string | null;
  natureza_operacao: string;
  data_emissao: string;
  data_autorizacao: string | null;
  protocolo_autorizacao: string | null;
  ambiente: string;
  status: string;
  informacoes_complementares: string | null;

  // Totais
  valor_produtos: number;
  valor_frete: number;
  valor_seguro: number;
  valor_desconto: number;
  valor_outras_despesas: number;
  valor_icms: number;
  valor_ipi: number;
  valor_pis: number;
  valor_cofins: number;
  valor_total: number;

  emitente: DanfeEmitente;
  destinatario: DanfeDestinatario;
  items: DanfeItem[];
}
