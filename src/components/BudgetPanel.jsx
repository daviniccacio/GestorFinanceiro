import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Target, AlertCircle, CheckCircle2, Pencil, Check, X, Plus, Trash2, Loader2 } from 'lucide-react';

/**
 * Componente BudgetPanel Conectado ao Supabase
 * Gerencia e persiste limites de orçamentos diretamente na nuvem por usuário.
 */
export default function BudgetPanel({ transacoes = [] }) {
  const [limites, setLimites] = useState({});
  const [carregandoMetas, setCarregandoMetas] = useState(true);
  const [userId, setUserId] = useState(null);

  // Estados de controlo para Edição e Criação
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState(null);
  const [valorTemporario, setValorTemporario] = useState('');
  const [isCriando, setIsCriando] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoLimite, setNovoLimite] = useState('');

  // 1. Obter o ID do usuário autenticado na sessão
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Buscar as metas salvas no Supabase (Envolvido em useCallback para evitar renderizações infinitas)
  const buscarMetas = useCallback(async () => {
    if (!userId) return;
    try {
      setCarregandoMetas(true);
      const { data, error } = await supabase
        .from('metas')
        .select('categoria, limite')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        const objetoMetas = {};
        data.forEach(item => {
          objetoMetas[item.categoria] = Number(item.limite);
        });
        setLimites(objetoMetas);
      } else {
        // Fallback amigável de sugestões se o banco estiver vazio
        setLimites({
          'Moradia': 2500,
          'Educação': 1000,
          'Transporte': 500,
          'Lazer': 400,
          'Contas': 2000,
          'Despesas': 1500
        });
      }
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      toast.error('Erro ao carregar metas da nuvem.');
    } finally {
      setCarregandoMetas(false);
    }
  }, [userId]);

// 2. Buscar as metas salvas no Supabase
useEffect(() => {
  // Criamos uma função assíncrona interna para isolar os efeitos colaterais
  const carregarDadosDasMetas = async () => {
    if (!userId) return;
    try {
      setCarregandoMetas(true);
      const { data, error } = await supabase
        .from('metas')
        .select('categoria, limite')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        const objetoMetas = {};
        data.forEach(item => {
          objetoMetas[item.categoria] = Number(item.limite);
        });
        setLimites(objetoMetas);
      } else {
        setLimites({
          'Moradia': 2500,
          'Educação': 1000,
          'Transporte': 500,
          'Lazer': 400,
          'Contas': 2000,
          'Despesas': 1500
        });
      }
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      toast.error('Erro ao carregar metas da nuvem.');
    } finally {
      setCarregandoMetas(false);
    }
  };

  carregarDadosDasMetas();
}, [userId]);

  // 3. Salvar/Atualizar uma meta no Supabase (Upsert)
  const salvarLimite = async (categoria) => {
    const valorNumerico = parseFloat(valorTemporario);
    if (isNaN(valorNumerico) || valorNumerico < 0) {
      toast.error('Insira um valor numérico válido.');
      return;
    }

    try {
      const { error } = await supabase
        .from('metas')
        .upsert({ 
          user_id: userId, 
          categoria: categoria, 
          limite: valorNumerico 
        }, { onConflict: 'user_id,categoria' });

      if (error) throw error;

      setLimites(prev => ({ ...prev, [categoria]: valorNumerico }));
      setCategoriaEmEdicao(null);
      toast.success(`Meta de ${categoria} atualizada!`);
    } catch (error) {
      console.error('Erro ao salvar limite:', error);
      toast.error('Erro ao salvar meta no banco.');
    }
  };

  // 4. Criar uma nova meta vinda do formulário
  const lidarComCriacaoMeta = async (e) => {
    e.preventDefault();
    const categoriaFormatada = novaCategoria.trim();
    const limiteNumerico = parseFloat(novoLimite);

    if (!categoriaFormatada || isNaN(limiteNumerico) || limiteNumerico < 0) return;

    try {
      const { error } = await supabase
        .from('metas')
        .upsert({
          user_id: userId,
          categoria: categoriaFormatada,
          limite: limiteNumerico
        }, { onConflict: 'user_id,categoria' });

      if (error) throw error;

      setLimites(prev => ({ ...prev, [categoriaFormatada]: limiteNumerico }));
      setNovaCategoria('');
      setNovoLimite('');
      setIsCriando(false);
      toast.success('Nova meta integrada à nuvem!');
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      toast.error('Erro ao registrar nova meta.');
    }
  };

  // 5. Remover uma meta do Supabase
  const removerMeta = async (categoria) => {
    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('user_id', userId)
        .eq('categoria', categoria);

      if (error) throw error;

      setLimites(prev => {
        const copia = { ...prev };
        delete copia[categoria];
        return copia;
      });
      setCategoriaEmEdicao(null);
      toast.success('Meta removida com sucesso.');
    } catch (error) {
      console.error('Erro ao remover meta:', error);
      toast.error('Erro ao deletar meta do banco.');
    }
  };

  // Processamento local de gastos
  const despesas = transacoes.filter(t => t.tipo === 'Saída' || t.tipo?.toLowerCase() === 'saída');
  const gastosPorCategoria = despesas.reduce((acc, atual) => {
    const cat = atual.categoria || 'Outros';
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += atual.valor;
    return acc;
  }, {});

  if (carregandoMetas) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-200/60 dark:border-zinc-800 flex flex-col items-center justify-center gap-2 text-xs font-medium text-gray-400">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        Sincronizando metas com a nuvem...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-200/60 dark:border-zinc-800 shadow-xs space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
            Metas e Orçamentos Mensais (Nuvem)
          </h3>
        </div>
        <button
          onClick={() => setIsCriando(!isCriando)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          {isCriando ? 'Fechar' : 'Nova Meta'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isCriando && (
          <form onSubmit={lidarComCriacaoMeta} className="p-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 bg-linear-to-b from-gray-50/50 to-transparent dark:from-zinc-800/20 flex flex-col justify-between space-y-3">
            <div className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Configurar Novo Orçamento</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Categoria</label>
                <input type="text" placeholder="Ex: Mercado" required value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Limite (R$)</label>
                <input type="number" placeholder="0.00" required min="0" step="any" value={novoLimite} onChange={(e) => setNovoLimite(e.target.value)} className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-1.5">
              <button type="button" onClick={() => setIsCriando(false)} className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg text-[10px] font-bold hover:bg-gray-200 cursor-pointer">Cancelar</button>
              <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 cursor-pointer">Adicionar</button>
            </div>
          </form>
        )}

        {Object.keys(limites).map((categoria) => {
          const gastoReal = gastosPorCategoria[categoria] || 0;
          const limiteDefinido = limites[categoria];
          const isEditing = categoriaEmEdicao === categoria;
          
          const porcentagem = limiteDefinido > 0 ? Math.min(Math.round((gastoReal / limiteDefinido) * 100), 150) : 0;

          let corBarra = 'bg-blue-500'; let corTexto = 'text-blue-600 dark:text-blue-400'; let corFundoCard = 'bg-slate-50/50 dark:bg-zinc-800/30';
          if (porcentagem >= 100) {
            corBarra = 'bg-red-500'; corTexto = 'text-red-600 dark:text-red-400'; corFundoCard = 'bg-red-50/30 dark:bg-red-950/10 border-red-100 dark:border-red-900/20';
          } else if (porcentagem >= 80) {
            corBarra = 'bg-amber-500'; corTexto = 'text-amber-600 dark:text-amber-400'; corFundoCard = 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20';
          }

          return (
            <div key={categoria} className={`p-3 rounded-2xl border border-gray-100 dark:border-zinc-800/60 flex flex-col justify-between space-y-2 group transition-all ${corFundoCard}`}>
              <div className="flex justify-between items-start text-xs">
                <div className="flex flex-col space-y-0.5 flex-1">
                  <span className="font-bold text-gray-800 dark:text-zinc-200">{categoria}</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 mt-1.5 w-full">
                      <span className="text-[10px] text-gray-400">R$</span>
                      <input type="number" className="w-18 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-gray-900 dark:text-zinc-100 focus:outline-none" value={valorTemporario} onChange={(e) => setValorTemporario(e.target.value)} autoFocus />
                      <button onClick={() => salvarLimite(categoria)} className="p-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 cursor-pointer"><Check className="w-3 h-3" /></button>
                      <button onClick={() => removerMeta(categoria)} className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer" title="Remover"><Trash2 className="w-3 h-3" /></button>
                      <button onClick={() => setCategoriaEmEdicao(null)} className="p-1 bg-gray-300 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-md hover:bg-gray-400 cursor-pointer"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500">Limite: R$ {limiteDefinido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <button onClick={() => { setCategoriaEmEdicao(categoria); setValorTemporario(limiteDefinido.toString()); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all p-0.5 rounded-sm cursor-pointer"><Pencil className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className={`font-bold block ${corTexto}`}>{porcentagem}%</span>
                  <span className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">Gasto: R$ {gastoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ease-out ${corBarra}`} style={{ width: `${Math.min(porcentagem, 100)}%` }} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold opacity-90">
                {porcentagem >= 100 ? (
                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Limite Excedido!</span>
                ) : porcentagem >= 80 ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Próximo do limite máximo.</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Gastos controlados.</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}