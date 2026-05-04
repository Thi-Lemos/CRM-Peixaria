import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { LojaConfig, HorarioDia } from '../types'
import { Save, Plus, X, Loader2, Clock, MapPin, Phone, CreditCard, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DIAS = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
] as const

const defaultHorario: Record<string, HorarioDia> = {
  segunda: { ativo: true, abertura: '08:00', fechamento: '18:00' },
  terca: { ativo: true, abertura: '08:00', fechamento: '18:00' },
  quarta: { ativo: true, abertura: '08:00', fechamento: '18:00' },
  quinta: { ativo: true, abertura: '08:00', fechamento: '18:00' },
  sexta: { ativo: true, abertura: '08:00', fechamento: '18:00' },
  sabado: { ativo: true, abertura: '08:00', fechamento: '13:00' },
  domingo: { ativo: false, abertura: '08:00', fechamento: '12:00' },
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={clsx(
        'relative w-11 h-6 rounded-full transition-colors shrink-0',
        value ? 'bg-[#10B981]' : 'bg-gray-300'
      )}
    >
      <span className={clsx(
        'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
        value ? 'left-6' : 'left-1'
      )} />
    </button>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#E2E8F0]">
      <div className="p-2 bg-[#FF6B1A]/10 rounded-lg">
        <Icon className="w-4 h-4 text-[#FF6B1A]" />
      </div>
      <h2 className="text-base font-semibold text-[#1A1A2E]">{title}</h2>
    </div>
  )
}

export function LojaPage() {
  const [config, setConfig] = useState<LojaConfig>({
    nome: '',
    endereco: '',
    telefone: '',
    horario_funcionamento: defaultHorario as unknown as LojaConfig['horario_funcionamento'],
    servicos: [],
    formas_pagamento: [],
    chaves_pix: [],
    politicas: '',
    taxas_entrega: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [novoServico, setNovoServico] = useState('')
  const [novaFormaPgto, setNovaFormaPgto] = useState('')
  const [novaPixTipo, setNovaPixTipo] = useState('')
  const [novaPixChave, setNovaPixChave] = useState('')
  const [novoBairro, setNovoBairro] = useState('')
  const [novaTaxa, setNovaTaxa] = useState('')

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true)
      const { data } = await supabase.from('loja_config').select('*').single()
      if (data) {
        setConfig({
          ...data,
          horario_funcionamento: data.horario_funcionamento || defaultHorario,
          servicos: data.servicos || [],
          formas_pagamento: data.formas_pagamento || [],
          chaves_pix: data.chaves_pix || [],
          taxas_entrega: data.taxas_entrega || [],
        })
      }
      setLoading(false)
    }
    fetchConfig()
  }, [])

  const handleHorarioChange = (dia: string, field: keyof HorarioDia, value: boolean | string) => {
    const current = (config.horario_funcionamento || defaultHorario) as Record<string, HorarioDia>
    setConfig(prev => ({
      ...prev,
      horario_funcionamento: {
        ...current,
        [dia]: {
          ...(current[dia] || defaultHorario[dia]),
          [field]: value,
        },
      } as unknown as LojaConfig['horario_funcionamento'],
    }))
  }

  const addServico = () => {
    if (!novoServico.trim()) return
    setConfig(prev => ({ ...prev, servicos: [...(prev.servicos || []), novoServico.trim()] }))
    setNovoServico('')
  }

  const removeServico = (i: number) => {
    setConfig(prev => ({ ...prev, servicos: (prev.servicos || []).filter((_, idx) => idx !== i) }))
  }

    const addPix = () => {
    if (!novaPixTipo.trim() || !novaPixChave.trim()) return
    setConfig(prev => ({
      ...prev,
      chaves_pix: [...(prev.chaves_pix || []), { tipo: novaPixTipo.trim(), chave: novaPixChave.trim() }],
    }))
    setNovaPixTipo('')
    setNovaPixChave('')
  }

  const removePix = (i: number) => {
    setConfig(prev => ({ ...prev, chaves_pix: (prev.chaves_pix || []).filter((_, idx) => idx !== i) }))
  }

  const addTaxa = () => {
    if (!novoBairro.trim() || !novaTaxa.trim()) return
    const taxaValue = parseFloat(novaTaxa.replace(',', '.'))
    if (isNaN(taxaValue)) return

    setConfig(prev => ({
      ...prev,
      taxas_entrega: [...(prev.taxas_entrega || []), { bairro: novoBairro.trim(), taxa: taxaValue }],
    }))
    setNovoBairro('')
    setNovaTaxa('')
  }

  const removeTaxa = (i: number) => {
    setConfig(prev => ({ ...prev, taxas_entrega: (prev.taxas_entrega || []).filter((_, idx) => idx !== i) }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...config, updated_at: new Date().toISOString() }
      const { error } = config.id
        ? await supabase.from('loja_config').update(payload).eq('id', config.id)
        : await supabase.from('loja_config').insert(payload).select().single()

      if (error) throw error
      toast.success('Configurações salvas com sucesso!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#0A2342] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const horario = (config.horario_funcionamento || defaultHorario) as unknown as Record<string, HorarioDia>

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Informações da Loja</h1>
          <p className="text-[#64748B] text-sm mt-1">Configure as informações do seu negócio</p>
        </div>
        <button form="loja-form" type="submit" disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </button>
      </div>

      <form id="loja-form" onSubmit={handleSave} className="space-y-6">
        {/* Dados Gerais */}
        <div className="card">
          <SectionHeader icon={MapPin} title="Dados Gerais" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Nome da Loja</label>
              <input
                type="text"
                value={config.nome || ''}
                onChange={e => setConfig(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="RJ Peixaria"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={config.telefone || ''}
                onChange={e => setConfig(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(21) 99999-9999"
                className="input-field"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Endereço Completo</label>
              <textarea
                value={config.endereco || ''}
                onChange={e => setConfig(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Rua das Redes, 123 — Copacabana, Rio de Janeiro, RJ"
                rows={2}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Raio de Entrega (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={config.raio_entrega_km || ''}
                onChange={e => setConfig(prev => ({ ...prev, raio_entrega_km: parseFloat(e.target.value) || undefined }))}
                placeholder="5"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Taxa de Entrega (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={config.taxa_entrega || ''}
                onChange={e => setConfig(prev => ({ ...prev, taxa_entrega: parseFloat(e.target.value) || undefined }))}
                placeholder="0,00"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Horário de Funcionamento */}
        <div className="card">
          <SectionHeader icon={Clock} title="Horário de Funcionamento" />
          <div className="space-y-3">
            {DIAS.map(({ key, label }) => {
              const dia = horario[key] || { ativo: false, abertura: '08:00', fechamento: '18:00' }
              return (
                <div key={key} className="flex items-center gap-4">
                  <Toggle value={dia.ativo} onChange={v => handleHorarioChange(key, 'ativo', v)} />
                  <span className={clsx('text-sm w-32 shrink-0', dia.ativo ? 'text-[#1A1A2E] font-medium' : 'text-[#94A3B8]')}>
                    {label}
                  </span>
                  {dia.ativo ? (
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="time"
                        value={dia.abertura}
                        onChange={e => handleHorarioChange(key, 'abertura', e.target.value)}
                        className="input-field w-28"
                      />
                      <span className="text-[#64748B]">até</span>
                      <input
                        type="time"
                        value={dia.fechamento}
                        onChange={e => handleHorarioChange(key, 'fechamento', e.target.value)}
                        className="input-field w-28"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-[#94A3B8] italic">Fechado</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Serviços */}
        <div className="card">
          <SectionHeader icon={Plus} title="Serviços Fornecidos" />
          <div className="flex flex-wrap gap-2 mb-3">
            {(config.servicos || []).map((s, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 bg-[#0A2342]/10 text-[#0A2342] rounded-full text-sm font-medium">
                {s}
                <button type="button" onClick={() => removeServico(i)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {(config.servicos || []).length === 0 && (
              <p className="text-sm text-[#94A3B8] italic">Nenhum serviço adicionado</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={novoServico}
              onChange={e => setNovoServico(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addServico())}
              placeholder="Ex: Entrega, Retirada na loja..."
              className="input-field flex-1"
            />
            <button type="button" onClick={addServico} className="btn-secondary px-3">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Formas de Pagamento */}
        <div className="card">
          <SectionHeader icon={CreditCard} title="Formas de Pagamento" />
          <div className="grid grid-cols-3 gap-3">
            {[
              'Dinheiro',
              'Cartão',
              'Pix'
            ].map((forma) => (
              <label key={forma} className="flex items-center gap-3 p-3 border border-[#E2E8F0] rounded-input cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={(config.formas_pagamento || []).includes(forma)}
                  onChange={(e) => {
                    const current = config.formas_pagamento || []
                    const update = e.target.checked 
                      ? [...current, forma]
                      : current.filter(item => item !== forma)
                    setConfig(prev => ({ ...prev, formas_pagamento: update }))
                  }}
                  className="w-4 h-4 rounded text-[#FF6B1A] focus:ring-[#FF6B1A]"
                />
                <span className="text-sm font-medium text-[#1A1A2E]">{forma}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Chaves PIX */}
        <div className="card">
          <SectionHeader icon={Key} title="Chaves PIX" />
          <div className="space-y-3 mb-4">
            {(config.chaves_pix || []).map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="bg-[#F8FAFC] p-2 border border-[#E2E8F0] rounded-input text-xs font-bold w-24 text-center uppercase">
                  {p.tipo}
                </div>
                <div className="flex-1 bg-[#F8FAFC] p-2 border border-[#E2E8F0] rounded-input text-sm">
                  {p.chave}
                </div>
                <button
                  type="button"
                  onClick={() => removePix(i)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(config.chaves_pix || []).length === 0 && (
              <p className="text-sm text-[#94A3B8] italic">Nenhuma chave PIX cadastrada.</p>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 pt-3 border-t border-dashed border-[#E2E8F0]">
            <select
              value={novaPixTipo}
              onChange={e => setNovaPixTipo(e.target.value)}
              className="input-field md:w-40"
            >
              <option value="">Tipo...</option>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="Telefone">Telefone</option>
              <option value="E-mail">E-mail</option>
              <option value="Aleatória">Chave Aleatória</option>
            </select>
            <input
              type="text"
              value={novaPixChave}
              onChange={e => setNovaPixChave(e.target.value)}
              placeholder="Valor da chave"
              className="input-field flex-1"
            />
            <button type="button" onClick={addPix} className="btn-secondary whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Adicionar Chave
            </button>
          </div>
        </div>

        {/* Entrega */}
        <div className="card">
          <SectionHeader icon={MapPin} title="Configuração de Entrega (por Bairro)" />
          
          <div className="space-y-3 mb-4">
            {(config.taxas_entrega || []).map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 bg-[#F8FAFC] p-2 border border-[#E2E8F0] rounded-input text-sm font-medium">
                  {t.bairro}
                </div>
                <div className="w-32 bg-[#F8FAFC] p-2 border border-[#E2E8F0] rounded-input text-sm text-center">
                  R$ {t.taxa.toFixed(2)}
                </div>
                <button
                  type="button"
                  onClick={() => removeTaxa(i)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(config.taxas_entrega || []).length === 0 && (
              <p className="text-sm text-[#94A3B8] italic">Nenhuma taxa de entrega configurada.</p>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 pt-3 border-t border-dashed border-[#E2E8F0]">
            <input
              type="text"
              value={novoBairro}
              onChange={e => setNovoBairro(e.target.value)}
              placeholder="Nome do Bairro"
              className="input-field flex-1"
            />
            <input
              type="number"
              step="0.01"
              value={novaTaxa}
              onChange={e => setNovaTaxa(e.target.value)}
              placeholder="Taxa (R$)"
              className="input-field md:w-32"
            />
            <button type="button" onClick={addTaxa} className="btn-secondary whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </div>

        {/* Políticas */}
        <div className="card">
          <SectionHeader icon={MapPin} title="Políticas da Loja" />
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5 font-semibold text-xs uppercase tracking-wider">Trocas, Cancelamentos e Observações</label>
            <textarea
              value={config.politicas || ''}
              onChange={e => setConfig(prev => ({ ...prev, politicas: e.target.value }))}
              placeholder="Digite aqui as políticas de troca, cancelamento, validade, etc..."
              className="input-field min-h-[150px] resize-y"
            />
          </div>
        </div>
      </form>
    </div>
  )
}
