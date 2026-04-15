import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useNotificationStore } from '../store/notificationStore'
import { formatCurrency, formatDate, getInitials } from '../utils/helpers'
import type { Pedido, Atendimento, Conversa } from '../types'
import {
  HeadphonesIcon,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Banknote,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { isToday, parseISO } from 'date-fns'

// Notificação sonora
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
  } catch {
    // Ignorar erros de AudioContext
  }
}

interface MetricCard {
  title: string
  value: string | number
  subInfo?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  badge?: { label: string; color: string }
}

function MetricCardComponent({ card }: { card: MetricCard }) {
  const Icon = card.icon
  return (
    <div className="card cursor-pointer hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(255,107,26,0.4)] hover:border-[#FF6B1A] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${card.iconBg}`}>
          <Icon className={`w-6 h-6 ${card.iconColor}`} />
        </div>
        {card.badge && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.badge.color}`}>
            {card.badge.label}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-[#1A1A2E] mb-1">{card.value}</p>
      <p className="text-sm font-medium text-[#64748B]">{card.title}</p>
      {card.subInfo && (
        <p className="text-xs text-[#94A3B8] mt-1">{card.subInfo}</p>
      )}
    </div>
  )
}

const STATUS_BADGE: Record<string, string> = {
  pendente: 'badge-pendente',
  confirmado: 'badge-confirmado',
  pronto_retirada: 'badge-pronto_retirada',
  entregue: 'badge-entregue',
  cancelado: 'badge-cancelado',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  pronto_retirada: 'Pronto p/ Retirada',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export function DashboardPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [todayPedidos, setTodayPedidos] = useState<Pedido[]>([])
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [loading, setLoading] = useState(true)
  const { setPendingOrders, incrementPendingOrders } = useNotificationStore()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pedidosRes, atendimentosRes, conversasRes] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('atendimentos').select('*').order('data_atendimento', { ascending: false }),
        supabase.from('conversas').select('*').order('updated_at', { ascending: false }).limit(5),
      ])

      const allPedidos = (pedidosRes.data ?? []) as Pedido[]
      const today = allPedidos.filter(p => isToday(parseISO(p.created_at)))
      setPedidos(allPedidos.slice(0, 5))
      setTodayPedidos(today)
      setAtendimentos((atendimentosRes.data ?? []) as Atendimento[])
      setConversas((conversasRes.data ?? []) as Conversa[])

      const pending = today.filter(p => p.status === 'pendente').length
      setPendingOrders(pending)
    } finally {
      setLoading(false)
    }
  }, [setPendingOrders])

  useEffect(() => {
    fetchData()

    // Realtime - novos pedidos
    const channel = supabase
      .channel('pedidos-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
        const newPedido = payload.new as Pedido
        setPedidos(prev => [newPedido, ...prev.slice(0, 4)])
        if (isToday(parseISO(newPedido.created_at))) {
          setTodayPedidos(prev => [newPedido, ...prev])
          incrementPendingOrders()
        }
        playNotificationSound()
        toast.success(`🔔 Novo pedido de ${newPedido.nome_cliente}!`, {
          duration: 5000,
          position: 'top-right',
        })

        // Push notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🔔 Novo Pedido — RJ Peixaria', {
            body: `Pedido de ${newPedido.nome_cliente} — ${formatCurrency(newPedido.valor_total)}`,
            icon: '/favicon.ico',
          })
        }
      })
      .subscribe()

    // Solicitar permissão de notificação
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData, incrementPendingOrders])

  const todayAtendimentos = atendimentos.filter(a => isToday(parseISO(a.data_atendimento)))
  
  const pedidosDentroHorario = todayPedidos.filter(p => {
    const hour = parseISO(p.created_at).getHours();
    return hour >= 8 && hour < 18;
  }).length;
  const pedidosForaHorario = todayPedidos.length - pedidosDentroHorario;
  
  const pedidosPendentes = todayPedidos.filter(p => p.status === 'pendente').length
  const pedidosConfirmados = todayPedidos.filter(p => p.status === 'confirmado').length
  const faturamento = todayPedidos
    .filter(p => p.status === 'confirmado' || p.status === 'entregue')
    .reduce((sum, p) => sum + Number(p.valor_total), 0)

  const metricCards: MetricCard[] = [
    {
      title: 'Atendimentos Hoje',
      value: todayAtendimentos.length,
      subInfo: 'Conversas iniciadas no bot',
      icon: HeadphonesIcon,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Pedidos Dentro do Horário',
      value: pedidosDentroHorario,
      icon: CheckCircle2,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      badge: { label: 'Normal', color: 'bg-green-100 text-green-700' },
    },
    {
      title: 'Pedidos Fora do Horário',
      value: pedidosForaHorario,
      icon: AlertTriangle,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      badge: { label: 'Off-hours', color: 'bg-orange-100 text-orange-700' },
    },
    {
      title: 'Pedidos Hoje',
      value: todayPedidos.length,
      subInfo: `${pedidosPendentes} pendentes • ${pedidosConfirmados} confirmados`,
      icon: ShoppingBag,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Pedidos Pendentes',
      value: pedidosPendentes,
      icon: Clock,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      badge: pedidosPendentes > 0
        ? { label: `${pedidosPendentes} novo${pedidosPendentes > 1 ? 's' : ''}`, color: 'bg-[#FF6B1A] text-white' }
        : undefined,
    },
    {
      title: 'Faturamento do Dia',
      value: formatCurrency(faturamento),
      icon: Banknote,
      iconBg: 'bg-[#FF6B1A]/10',
      iconColor: 'text-[#FF6B1A]',
      badge: { label: 'Hoje', color: 'bg-[#FF6B1A]/10 text-[#FF6B1A]' },
    },
  ]

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
              <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Dashboard</h1>
        <p className="text-[#64748B] text-sm mt-1">Visão geral do atendimento de hoje</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metricCards.map((card, i) => (
          <MetricCardComponent key={i} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Últimos Pedidos */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF6B1A]" />
              <h2 className="text-base font-semibold text-[#1A1A2E]">Últimos Pedidos</h2>
            </div>
            <Link
              to="/pedidos"
              className="flex items-center gap-1 text-[#FF6B1A] text-sm font-medium hover:underline"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pedidos.length === 0 ? (
            <div className="py-10 text-center text-[#94A3B8] text-sm">
              Nenhum pedido ainda hoje
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[#0A2342]/10 flex items-center justify-center text-[#0A2342] text-xs font-bold shrink-0">
                    {getInitials(pedido.nome_cliente)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A2E] truncate">{pedido.nome_cliente}</p>
                    <p className="text-xs text-[#64748B] truncate">
                      {Array.isArray(pedido.produtos_pedidos) 
                        ? pedido.produtos_pedidos.map(p => p.produto).join(', ')
                        : 'Sem itens'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#FF6B1A]">{formatCurrency(pedido.valor_total)}</p>
                    <span className={STATUS_BADGE[pedido.status] || 'badge-pendente'}>
                      {STATUS_LABEL[pedido.status] || pedido.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversas Recentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="w-5 h-5 text-[#FF6B1A]" />
              <h2 className="text-base font-semibold text-[#1A1A2E]">Conversas Recentes</h2>
            </div>
            <Link
              to="/conversas"
              className="flex items-center gap-1 text-[#FF6B1A] text-sm font-medium hover:underline"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {conversas.length === 0 ? (
            <div className="py-10 text-center text-[#94A3B8] text-sm">
              Nenhuma conversa recente
            </div>
          ) : (
            <div className="space-y-3">
              {conversas.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[#0A2342] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(c.nome_cliente || c.telefone)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A2E] truncate">
                      {c.nome_cliente || c.telefone}
                    </p>
                    <p className="text-xs text-[#64748B]">{c.telefone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`badge-${c.status}`}>
                      {c.status === 'bot' ? 'Bot' : c.status === 'humano' ? 'Humano' : 'Encerrado'}
                    </span>
                    <p className="text-[10px] text-[#94A3B8] mt-1">{formatDate(c.updated_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
