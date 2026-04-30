import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate, getInitials } from '../utils/helpers'
import { Search, Eye, ChevronDown, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns'
import clsx from 'clsx'
import { useNotificationStore } from '../store/notificationStore'
import { useSearchParams } from 'react-router-dom'

type StatusFilter = 'todos' | 'pendente' | 'enviado' | 'pronto_retirada' | 'finalizado' | 'cancelado'
type DateFilter = 'todos' | 'hoje' | 'semana' | 'mes'

type Item = {
  produto?: string
  nome?: string
  quantidade: number
  preco?: number
  preco_unit?: number
}

type Pedido = {
  pedido_id: string
  nome: string
  telefone?: string
  itens: Item[]
  valor_total: number
  status: 'pendente' | 'enviado' | 'pronto_retirada' | 'finalizado' | 'cancelado'
  created_at: string
  pagamento?: string
  endereco?: string
  observacoes?: string
}

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', badge: 'badge-pendente' },
  enviado: { label: 'Enviado', badge: 'badge-enviado' },
  pronto_retirada: { label: 'Pronto p/ Retirada', badge: 'badge-pronto_retirada' },
  finalizado: { label: 'Finalizado', badge: 'badge-finalizado' },
  cancelado: { label: 'Cancelado', badge: 'badge-cancelado' },
}

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'pronto_retirada', label: 'Pronto p/ Retirada' },
  { value: 'finalizado', label: 'Finalizado' },
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
    await onStatusChange(pedido.pedido_id, newStatus)
    setCurrentStatus(newStatus as Pedido['status'])
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#1A1A2E]">Detalhes do Pedido</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0A2342] flex items-center justify-center text-white font-bold">
              {getInitials(pedido.nome)}
            </div>
            <div>
              <p className="font-semibold">{pedido.nome}</p>
              {pedido.telefone && <p className="text-sm">{pedido.telefone}</p>}
            </div>
          </div>

          <div className="border rounded p-4">
            <p className="text-xs font-semibold mb-3">Produtos</p>

            {pedido.itens?.length ? (
              pedido.itens.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{p.produto || p.nome} — {p.quantidade}</span>
                  <span>{formatCurrency(p.preco_unit || p.preco || 0)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm">Nenhum produto listado</p>
            )}

            <div className="border-t mt-3 pt-3 flex justify-between">
              <span>Total</span>
              <span className="font-bold">{formatCurrency(pedido.valor_total)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2">Alterar Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={saving || currentStatus === opt.value}
                  className={clsx(
                    'px-3 py-1 rounded text-xs',
                    currentStatus === opt.value ? 'bg-black text-white' : 'bg-gray-200'
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

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [filtered, setFiltered] = useState<Pedido[]>([])
  const [expandedProdutos, setExpandedProdutos] = useState<string | null>(null)

  const fetchPedidos = useCallback(async () => {
    const { data } = await supabase.from('pedidos').select('*')

    const normalized = (data ?? []).map(p => ({
      ...p,
      itens: Array.isArray(p.itens)
        ? p.itens
        : typeof p.itens === 'string'
          ? JSON.parse(p.itens)
          : []
    }))

    setPedidos(normalized)
  }, [])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  useEffect(() => {
    setFiltered(pedidos)
  }, [pedidos])

  return (
    <div className="p-6">
      <table className="w-full">
        <tbody>
          {filtered.map(pedido => (
            <tr key={pedido.pedido_id}>
              <td>{pedido.nome}</td>

              <td>
                <button
                  onClick={() =>
                    setExpandedProdutos(
                      expandedProdutos === pedido.pedido_id ? null : pedido.pedido_id
                    )
                  }
                >
                  {pedido.itens.length} itens
                </button>

                {expandedProdutos === pedido.pedido_id && (
                  <div>
                    {pedido.itens.map((p, i) => (
                      <div key={i}>
                        • {p.produto || p.nome} ({p.quantidade})
                      </div>
                    ))}
                  </div>
                )}
              </td>

              <td>{formatCurrency(pedido.valor_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
