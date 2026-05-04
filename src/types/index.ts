export interface Produto {
  id: string
  produto: string
  preco: number
  quantidade?: string
  corte?: string
  categoria?: string
  disponivel?: boolean
}

export interface ProdutoPedido {
  produto: string
  quantidade: string
  preco_unit: number
}

export interface Pedido {
  pedido_id: string
  nome: string
  telefone?: string
  itens: string | any[]
  valor_total: number
  endereco?: string
  pagamento?: string
  observacoes?: string
  status: 'pendente' | 'enviado' | 'pronto_retirada' | 'finalizado' | 'cancelado' | string
  created_at: string
  updated_at: string
}

export interface Conversa {
  id: string
  session_id: string
  nome_cliente?: string
  telefone: string
  status: 'bot' | 'humano' | 'encerrado'
  created_at: string
  updated_at: string
}

export interface Mensagem {
  id: string
  session_id: string
  remetente: 'bot' | 'cliente' | 'atendente'
  mensagem: string
  timestamp: string
}

export interface Atendimento {
  id: string
  session_id?: string
  telefone?: string
  dentro_horario?: boolean
  data_atendimento: string
}

export interface HorarioDia {
  ativo: boolean
  abertura: string
  fechamento: string
}

export interface HorarioFuncionamento {
  [key: string]: HorarioDia
  segunda: HorarioDia
  terca: HorarioDia
  quarta: HorarioDia
  quinta: HorarioDia
  sexta: HorarioDia
  sabado: HorarioDia
  domingo: HorarioDia
}

export interface ChavePix {
  tipo: string
  chave: string
}

export interface TaxaEntrega {
  bairro: string
  taxa: number
}

export interface LojaConfig {
  id?: string
  nome?: string
  endereco?: string
  horario_funcionamento?: HorarioFuncionamento
  servicos?: string[]
  formas_pagamento?: string[]
  chaves_pix?: ChavePix[]
  politicas?: string
  taxas_entrega?: TaxaEntrega[]
  telefone?: string
  updated_at?: string
}
