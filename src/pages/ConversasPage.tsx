import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Conversa, Mensagem } from '../types'
import { formatTime, getInitials } from '../utils/helpers'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { telegramApi } from '../lib/telegram'
import { Search, Filter, Send, UserCheck, X } from 'lucide-react'

type StatusFilter = 'todos' | 'bot' | 'humano' | 'encerrado'

const STATUS_CONFIG = {
  bot: { label: 'Bot', className: 'badge-bot' },
  humano: { label: 'Humano', className: 'badge-humano' },
  encerrado: { label: 'Encerrado', className: 'badge-encerrado' },
}

async function sendZApiMessage(phone: string, message: string) {
  const instanceId = import.meta.env.VITE_ZAPI_INSTANCE_ID
  const token = import.meta.env.VITE_ZAPI_TOKEN
  const clientToken = import.meta.env.VITE_ZAPI_CLIENT_TOKEN

  if (!instanceId || !token) {
    throw new Error('Z-API não configurada. Verifique as variáveis VITE_ZAPI_INSTANCE_ID e VITE_ZAPI_TOKEN')
  }

  const response = await fetch(
    `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken || '',
      },
      body: JSON.stringify({ phone, message }),
    }
  )

  if (!response.ok) {
    throw new Error('Falha ao enviar mensagem pela Z-API')
  }
}

export function ConversasPage() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [filteredConversas, setFilteredConversas] = useState<Conversa[]>([])
  const [selectedConversa, setSelectedConversa] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMensagens, setLoadingMensagens] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchConversas = useCallback(async () => {
    const { data } = await supabase
      .from('conversas')
      .select('*')
      .order('updated_at', { ascending: false })
    setConversas((data ?? []) as Conversa[])
  }, [])

  useEffect(() => {
    fetchConversas()

    const channel = supabase
      .channel('conversas-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversas' }, fetchConversas)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchConversas])

  useEffect(() => {
    let filtered = conversas
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        (c.nome_cliente ?? '').toLowerCase().includes(q) ||
        c.telefone.toLowerCase().includes(q)
      )
    }
    setFilteredConversas(filtered)
  }, [conversas, searchQuery, statusFilter])

  const loadMensagens = useCallback(async (sessionId: string) => {
    setLoadingMensagens(true)
    const { data } = await supabase
      .from('mensagens')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })
    setMensagens((data ?? []) as Mensagem[])
    setLoadingMensagens(false)
  }, [])

  useEffect(() => {
    if (!selectedConversa) return

    loadMensagens(selectedConversa.session_id)

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current)
    }

    const channel = supabase
      .channel(`mensagens-${selectedConversa.session_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `session_id=eq.${selectedConversa.session_id}`,
        },
        (payload) => {
          setMensagens(prev => [...prev, payload.new as Mensagem])
        }
      )
      .subscribe()

    realtimeChannelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [selectedConversa, loadMensagens])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversa || sending) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setSending(true)

    try {
      // Tentar enviar via Telegram se o token existir, senão usa Z-API
      const telegramToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      
      if (telegramToken) {
        // No Telegram, o 'telefone' armazenado deve ser o Chat ID
        const { error } = await telegramApi.sendMessage(selectedConversa.session_id, messageText);
        if (error) throw new Error(error);
      } else {
        await sendZApiMessage(selectedConversa.telefone, messageText)
      }

      await supabase.from('mensagens').insert({
        session_id: selectedConversa.session_id,
        remetente: 'atendente',
        mensagem: messageText,
      })

      await supabase
        .from('conversas')
        .update({ updated_at: new Date().toISOString() })
        .eq('session_id', selectedConversa.session_id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar mensagem'
      toast.error(msg)
      setNewMessage(messageText)
    } finally {
      setSending(false)
    }
  }

  const handleTransferToHuman = async () => {
    if (!selectedConversa) return
    const { error } = await supabase
      .from('conversas')
      .update({ status: 'humano', updated_at: new Date().toISOString() })
      .eq('session_id', selectedConversa.session_id)

    if (!error) {
      setSelectedConversa(prev => prev ? { ...prev, status: 'humano' } : prev)
      setConversas(prev => prev.map(c =>
        c.session_id === selectedConversa.session_id ? { ...c, status: 'humano' } : c
      ))
      toast.success('Conversa transferida para atendimento humano')
    }
  }

  const handleEncerrar = async () => {
    if (!selectedConversa) return
    const { error } = await supabase
      .from('conversas')
      .update({ status: 'encerrado', updated_at: new Date().toISOString() })
      .eq('session_id', selectedConversa.session_id)

    if (!error) {
      setSelectedConversa(prev => prev ? { ...prev, status: 'encerrado' } : prev)
      setConversas(prev => prev.map(c =>
        c.session_id === selectedConversa.session_id ? { ...c, status: 'encerrado' } : c
      ))
      toast.success('Conversa encerrada')
    }
  }

  return (
    <div className="flex h-screen">
      {/* Left Panel - Conversation List */}
      <div className="w-full md:w-[360px] flex flex-col bg-white border-r border-[#E2E8F0] shrink-0">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h1 className="text-lg font-bold text-[#1A1A2E] mb-3">Conversas</h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          {/* Status Filter */}
          <div className="flex gap-1 flex-wrap">
            {(['todos', 'bot', 'humano', 'encerrado'] as StatusFilter[]).map(status => {
              const count = status === 'todos' 
                ? conversas.length 
                : conversas.filter(c => c.status === status).length;
              
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    'flex items-center text-xs px-3 py-1.5 rounded-full font-medium transition-colors capitalize',
                    statusFilter === status
                      ? 'bg-[#0A2342] text-white'
                      : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'
                  )}
                >
                  {status === 'todos' ? 'Todos' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
                  <span className={clsx(
                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    statusFilter === status ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversas.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Nenhuma conversa encontrada
            </div>
          ) : (
            filteredConversas.map(c => (
              <button
                key={c.session_id}
                onClick={() => setSelectedConversa(c)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9] hover:bg-gray-50 transition-colors text-left',
                  selectedConversa?.session_id === c.session_id && 'bg-blue-50 border-l-2 border-l-[#0A2342]'
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#0A2342] flex items-center justify-center text-white text-sm font-bold">
                    {getInitials(c.nome_cliente || c.telefone)}
                  </div>
                  {c.status === 'humano' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#FF6B1A] rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                      {c.nome_cliente || c.telefone}
                    </p>
                    <span className="text-[10px] text-[#94A3B8] shrink-0 ml-2">
                      {formatTime(c.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-[#64748B] truncate">{c.telefone}</p>
                    <span className={clsx(STATUS_CONFIG[c.status]?.className || 'badge-encerrado', 'ml-1 shrink-0')}>
                      {STATUS_CONFIG[c.status]?.label || c.status}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      <div className="flex-1 flex flex-col">
        {!selectedConversa ? (
          <div className="flex-1 flex items-center justify-center text-[#94A3B8]">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecione uma conversa para visualizar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-[#E2E8F0] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0A2342] flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(selectedConversa.nome_cliente || selectedConversa.telefone)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A2E]">
                    {selectedConversa.nome_cliente || selectedConversa.telefone}
                  </p>
                  <p className="text-xs text-[#64748B]">{selectedConversa.telefone}</p>
                </div>
                <span className={clsx(STATUS_CONFIG[selectedConversa.status]?.className || 'badge-encerrado')}>
                  {STATUS_CONFIG[selectedConversa.status]?.label || selectedConversa.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedConversa.status === 'bot' && (
                  <button
                    onClick={handleTransferToHuman}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Transferir p/ Humano
                  </button>
                )}
                {selectedConversa.status !== 'encerrado' && (
                  <button
                    onClick={handleEncerrar}
                    className="btn-secondary text-xs py-1.5 px-3 text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Encerrar
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#F4F6F9]">
              {loadingMensagens ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#0A2342] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : mensagens.length === 0 ? (
                <div className="text-center text-[#94A3B8] text-sm py-8">
                  Nenhuma mensagem nesta conversa
                </div>
              ) : (
                mensagens.map(msg => {
                  const isOutgoing = msg.remetente === 'atendente' || msg.remetente === 'bot'
                  return (
                    <div
                      key={msg.id}
                      className={clsx('flex flex-col', isOutgoing ? 'items-end' : 'items-start')}
                    >
                      <span className="text-[10px] text-[#94A3B8] mb-1 px-1">
                        {msg.remetente === 'bot' ? '🤖 Bot' : msg.remetente === 'atendente' ? '👤 Atendente' : '💬 Cliente'}
                      </span>
                      <div
                        className={clsx(
                          'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm',
                          isOutgoing
                            ? 'bg-[#0A2342] text-white rounded-br-sm'
                            : 'bg-white text-[#1A1A2E] rounded-bl-sm'
                        )}
                      >
                        <p className="leading-relaxed">{msg.mensagem}</p>
                        <p className={clsx('text-[10px] mt-1', isOutgoing ? 'text-white/50' : 'text-[#94A3B8]')}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selectedConversa.status !== 'encerrado' && (
              <div className="bg-white border-t border-[#E2E8F0] px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Digite uma mensagem..."
                    className="input-field flex-1"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="btn-primary shrink-0 px-4"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
