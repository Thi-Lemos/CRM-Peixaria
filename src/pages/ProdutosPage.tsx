import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Produto } from '../types'
import { formatCurrency } from '../utils/helpers'
import { Plus, Search, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const UNIDADES = ['kg', 'g', 'unidade', 'dúzia', 'bandeja', 'filé', 'outro']
const CATEGORIAS_SUGESTAO = ['Peixes', 'Frutos do Mar', 'Filés', 'Defumados', 'Congelados', 'Condimentos']

interface ProdutoForm {
  produto: string
  preco: string
  quantidade: string
  categoria: string
  disponivel: boolean
}

const emptyForm: ProdutoForm = {
  produto: '',
  preco: '',
  quantidade: 'kg',
  categoria: '',
  disponivel: true,
}

function ProdutoModal({
  produto,
  categorias,
  onClose,
  onSave,
}: {
  produto?: Produto | null
  categorias: string[]
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState<ProdutoForm>(
    produto
      ? {
          produto: produto.produto,
          preco: String(produto.preco),
          quantidade: produto.quantidade || 'kg',
          categoria: produto.categoria || '',
          disponivel: produto.disponivel ?? true,
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.produto || !form.preco) return

    setSaving(true)
    try {
      const data = {
        produto: form.produto.trim(),
        preco: parseFloat(form.preco.replace(',', '.')),
        quantidade: form.quantidade,
        categoria: form.categoria.trim() || null,
        disponivel: form.disponivel,
      }

      if (produto?.id) {
        const { error } = await supabase.from('produtos').update(data).eq('id', produto.id)
        if (error) throw error
        toast.success('Produto atualizado com sucesso!')
      } else {
        const { error } = await supabase.from('produtos').insert(data)
        if (error) throw error
        toast.success('Produto adicionado com sucesso!')
      }
      onSave()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#1A1A2E]">
            {produto ? 'Editar Produto' : 'Adicionar Produto'}
          </h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#1A1A2E]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Nome do Produto *</label>
            <input
              type="text"
              value={form.produto}
              onChange={e => setForm(prev => ({ ...prev, produto: e.target.value }))}
              placeholder="Ex: Salmão fresco"
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.preco}
                onChange={e => setForm(prev => ({ ...prev, preco: e.target.value }))}
                placeholder="0,00"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Quantidade</label>
              <select
                value={form.quantidade}
                onChange={e => setForm(prev => ({ ...prev, quantidade: e.target.value }))}
                className="input-field"
              >
                {UNIDADES.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">Categoria</label>
            <input
              type="text"
              list="categorias-list"
              value={form.categoria}
              onChange={e => setForm(prev => ({ ...prev, categoria: e.target.value }))}
              placeholder="Ex: Peixes"
              className="input-field"
            />
            <datalist id="categorias-list">
              {[...new Set([...CATEGORIAS_SUGESTAO, ...categorias])].map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-[#1A1A2E]">Disponível</p>
              <p className="text-xs text-[#64748B]">Produto disponível para pedidos</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, disponivel: !prev.disponivel }))}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors',
                form.disponivel ? 'bg-[#10B981]' : 'bg-gray-300'
              )}
            >
              <span className={clsx(
                'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
                form.disponivel ? 'left-6' : 'left-1'
              )} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : produto ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ nome, onConfirm, onClose }: {
  nome: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-2">Confirmar Exclusão</h2>
        <p className="text-sm text-[#64748B] mb-6">
          Tem certeza que deseja excluir <strong>"{nome}"</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={onConfirm} className="btn-danger flex-1 justify-center">Excluir</button>
        </div>
      </div>
    </div>
  )
}

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [filtered, setFiltered] = useState<Produto[]>([])
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('todas')
  const [disponibilidadeFilter, setDisponibilidadeFilter] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [deletingProduto, setDeletingProduto] = useState<Produto | null>(null)

  const fetchProdutos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .order('produto', { ascending: true })
    setProdutos((data ?? []) as Produto[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProdutos() }, [fetchProdutos])

  useEffect(() => {
    let result = [...produtos]
    if (categoriaFilter !== 'todas') {
      result = result.filter(p => p.categoria === categoriaFilter)
    }
    if (disponibilidadeFilter === 'disponiveis') {
      result = result.filter(p => p.disponivel !== false)
    } else if (disponibilidadeFilter === 'indisponiveis') {
      result = result.filter(p => p.disponivel === false)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p => p.produto.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [produtos, search, categoriaFilter, disponibilidadeFilter])

  const categorias = [...new Set(produtos.map(p => p.categoria).filter(Boolean))] as string[]

  const handleToggleDisponivel = async (produto: Produto) => {
    const newVal = !produto.disponivel
    const { error } = await supabase
      .from('produtos')
      .update({ disponivel: newVal })
      .eq('id', produto.id)

    if (!error) {
      setProdutos(prev => prev.map(p => p.id === produto.id ? { ...p, disponivel: newVal } : p))
    } else {
      toast.error('Erro ao atualizar disponibilidade')
    }
  }

  const handleDelete = async () => {
    if (!deletingProduto) return
    const { error } = await supabase.from('produtos').delete().eq('id', deletingProduto.id)
    if (!error) {
      setProdutos(prev => prev.filter(p => p.id !== deletingProduto.id))
      toast.success('Produto excluído com sucesso!')
    } else {
      toast.error('Erro ao excluir produto')
    }
    setDeletingProduto(null)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Produtos</h1>
          <p className="text-[#64748B] text-sm mt-1">{filtered.length} produto{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditingProduto(null); setShowModal(true) }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Adicionar Produto
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <select
            value={categoriaFilter}
            onChange={e => setCategoriaFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={disponibilidadeFilter}
            onChange={e => setDisponibilidadeFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="todos">Todos</option>
            <option value="disponiveis">Disponíveis</option>
            <option value="indisponiveis">Indisponíveis</option>
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
          <div className="p-12 text-center text-[#94A3B8] text-sm">Nenhum produto encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Preço</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Quantidade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Categoria</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Disponível</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map(produto => (
                  <tr key={produto.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#1A1A2E]">{produto.produto}</td>
                    <td className="px-4 py-3 font-semibold text-[#FF6B1A]">{formatCurrency(produto.preco)}</td>
                    <td className="px-4 py-3 text-[#64748B]">{produto.quantidade || '—'}</td>
                    <td className="px-4 py-3">
                      {produto.categoria ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {produto.categoria}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleDisponivel(produto)}
                        className={clsx(
                          'relative w-11 h-6 rounded-full transition-colors',
                          produto.disponivel !== false ? 'bg-[#10B981]' : 'bg-gray-300'
                        )}
                      >
                        <span className={clsx(
                          'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
                          produto.disponivel !== false ? 'left-6' : 'left-1'
                        )} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingProduto(produto); setShowModal(true) }}
                          className="p-1.5 text-[#64748B] hover:text-[#0A2342] hover:bg-blue-50 rounded-[6px] transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProduto(produto)}
                          className="p-1.5 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-[6px] transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ProdutoModal
          produto={editingProduto}
          categorias={categorias}
          onClose={() => setShowModal(false)}
          onSave={fetchProdutos}
        />
      )}

      {deletingProduto && (
        <ConfirmDeleteModal
          nome={deletingProduto.produto}
          onConfirm={handleDelete}
          onClose={() => setDeletingProduto(null)}
        />
      )}
    </div>
  )
}
