import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Pedido, ProdutoPedido } from '../types'
import { formatCurrency, formatDate, getInitials } from '../utils/helpers'
import { Search, Eye, ChevronDown, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns'
import clsx from 'clsx'
import { useNotificationStore } from '../store/notificationStore'

type StatusFilter = 'todos' | 'pendente' | 'confirmado' | 'pronto_retirada' | 'entregue' | 'cancelado'
type DateFilter = 'todos' | 'hoje' | 'semana' | 'mes'

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', badge: 'badge-pendente' },
  confirmado: { label: 'Confirmado', badge: 'badge-confirmado' },
  pronto_retirada: { label: 'Pronto p/ Retirada', badge: 'badge-pronto_retirada' },
  entregue: { label: 'Entregue', badge: 'badge-entregue' },
  cancelado: { label: 'Cancelado', badge: 'badge-cancelado' },
}

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'pronto_retirada', label: 'Pronto p/ Retirada' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
]

function PedidoModal({ pedido, onClose, onStatusChange }: {
  pedido: Pedido
  onClose: () => void
  onStatusChange: (id: string, status: string) => Promise<void>
}) {
  const [currentStatus, setCurrentStatus] = useState(pedido.status)
  const [saving, setSaving] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true)
    await onStatusChange(pedido.id, newStatus)
    setCurrentStatus(newStatus as Pedido['status'])
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#1A1A2E]">Detalhes do Pedido</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1A1A2E] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Cliente */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0A2342] flex items-center justify-center text-white font-bold">
              {getInitials(pedido.nome_cliente)}
            </div>
            <div>
              <p className="font-semibold text-[#1A1A2E]">{pedido.nome_cliente}</p>
              {pedido.telefone_cliente && (
                <p className="text-sm text-[#64748B]">{pedido.telefone_cliente}</p>
              )}
            </div>
          </div>

          {/* Produtos */}
          <div className="border border-[#E2E8F0] rounded-input p-4">
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Produtos</p>
            <div className="space-y-2">
              {typeof pedido.produtos_pedidos === 'string' ? (
                <p className="text-sm text-[#1A1A2E]">{pedido.produtos_pedidos}</p>
              ) : Array.isArray(pedido.produtos_pedidos) ? (
                pedido.produtos_pedidos.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#1A1A2E]">{p.produto || p.nome} — {p.quantidade}</span>
                    <span className="font-medium text-[#1A1A2E]">{formatCurrency(p.preco_unit || p.preco || 0)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#64748B]">Nenhum produto listado</p>
              )}
            </div>
            <div className="border-t border-[#E2E8F0] mt-3 pt-3 flex justify-between">
              <span className="font-semibold text-[#1A1A2E]">Total</span>
              <span className="text-xl font-bold text-[#FF6B1A]">{formatCurrency(pedido.valor_total)}</span>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {pedido.forma_pagamento && (
              <div>
                <p className="text-xs text-[#64748B] mb-0.5">Pagamento</p>
                <p className="font-medium text-[#1A1A2E]">{pedido.forma_pagamento}</p>
              </div>
            )}
            {pedido.endereco_entrega && (
              <div>
                <p className="text-xs text-[#64748B] mb-0.5">Endereço</p>
                <p className="font-medium text-[#1A1A2E]">{pedido.endereco_entrega}</p>
              </div>
            )}
            {pedido.observacoes && (
              <div className="col-span-2">
                <p className="text-xs text-[#64748B] mb-0.5">Observações</p>
                <p className="font-medium text-[#1A1A2E]">{pedido.observacoes}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[#64748B] mb-0.5">Data do Pedido</p>
              <p className="font-medium text-[#1A1A2E]">{formatDate(pedido.created_at)}</p>
            </div>
          </div>

          {/* Status Change */}
          <div>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Alterar Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={saving || currentStatus === opt.value}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                    currentStatus === opt.value
                      ? 'bg-[#0A2342] text-white'
                      : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  } catch { /* ignore */ }
}

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [filtered, setFiltered] = useState<Pedido[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [dateFilter, setDateFilter] = useState<DateFilter>('todos')
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedProdutos, setExpandedProdutos] = useState<string | null>(null)
  const { incrementPendingOrders } = useNotificationStore()

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false })
    setPedidos((data ?? []) as Pedido[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPedidos()

    const channel = supabase
      .channel('pedidos-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
        const newPedido = payload.new as Pedido
        setPedidos(prev => [newPedido, ...prev])
        incrementPendingOrders()
        playNotificationSound()
        toast.success(`🔔 Novo pedido de ${newPedido.nome_cliente}!`)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, (payload) => {
        setPedidos(prev => prev.map(p => p.id === payload.new.id ? payload.new as Pedido : p))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchPedidos, incrementPendingOrders])

  useEffect(() => {
    let result = [...pedidos]
    if (statusFilter !== 'todos') {
      result = result.filter(p => p.status === statusFilter)
    }
    if (dateFilter !== 'todos') {
      result = result.filter(p => {
        const d = parseISO(p.created_at)
        if (dateFilter === 'hoje') return isToday(d)
        if (dateFilter === 'semana') return isThisWeek(d, { weekStartsOn: 1 })
        if (dateFilter === 'mes') return isThisMonth(d)
        return true
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p => p.nome_cliente.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [pedidos, statusFilter, dateFilter, search])

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: status as Pedido['status'] } : p))
      toast.success('Status atualizado com sucesso!')
      if (selectedPedido?.id === id) {
        setSelectedPedido(prev => prev ? { ...prev, status: status as Pedido['status'] } : prev)
      }
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Pedidos</h1>
        <p className="text-[#64748B] text-sm mt-1">{filtered.length} pedido{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="input-field w-auto"
          >
            <option value="todos">Todos os status</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as DateFilter)}
            className="input-field w-auto"
          >
            <option value="todos">Qualquer data</option>
            <option value="hoje">Hoje</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mês</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#0A2342] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">
            <p className="text-sm">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Produtos</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Pagamento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map(pedido => (
                  <tr key={pedido.id} className="hover:bg-white hover:shadow-[0_0_15px_rgba(255,107,26,0.4)] hover:outline hover:outline-1 hover:outline-[#FF6B1A] transition-all relative z-0 hover:z-10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0A2342]/10 flex items-center justify-center text-[#0A2342] text-xs font-bold shrink-0">
                          {getInitials(pedido.nome_cliente)}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A2E]">{pedido.nome_cliente}</p>
                          {pedido.telefone_cliente && (
                            <p className="text-xs text-[#64748B]">{pedido.telefone_cliente}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {typeof pedido.produtos_pedidos === 'string' ? (
                        <p className="text-xs text-[#64748B] max-w-[200px] truncate" title={pedido.produtos_pedidos as string}>
                          {pedido.produtos_pedidos}
                        </p>
                      ) : (
                        <>
                          <button
                            onClick={() => setExpandedProdutos(expandedProdutos === pedido.id ? null : pedido.id)}
                            className="flex items-center gap-1 text-[#64748B] hover:text-[#1A1A2E] text-xs"
                          >
                            {Array.isArray(pedido.produtos_pedidos) ? pedido.produtos_pedidos.length : 0} item(s)
                            <ChevronDown className={clsx('w-3 h-3 transition-transform', expandedProdutos === pedido.id && 'rotate-180')} />
                          </button>
                          {expandedProdutos === pedido.id && (
                            <div className="mt-1 space-y-0.5">
                              {Array.isArray(pedido.produtos_pedidos) && pedido.produtos_pedidos.map((p: any, i: number) => (
                                <p key={i} className="text-xs text-[#64748B]">
                                  • {p.produto || p.nome} ({p.quantidade}) — {formatCurrency(p.preco_unit || p.preco || 0)}
                                </p>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#FF6B1A]">{formatCurrency(pedido.valor_total)}</span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">
                      {pedido.forma_pagamento || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(STATUS_CONFIG[pedido.status]?.badge || 'badge-pendente')}>
                        {STATUS_CONFIG[pedido.status]?.label || pedido.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">
                      {formatDate(pedido.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedPedido(pedido)}
                        className="p-1.5 text-[#64748B] hover:text-[#0A2342] hover:bg-blue-50 rounded-[6px] transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPedido && (
        <PedidoModal
          pedido={selectedPedido}
          onClose={() => setSelectedPedido(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
