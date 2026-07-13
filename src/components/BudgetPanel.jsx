import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { Target, AlertCircle, CheckCircle2, Pencil, Check, X, Plus, Trash2, Loader2, Wallet } from 'lucide-react';

export default function BudgetPanel({ transacoes = [] }) {
  const [limites, setLimites] = useState({});
  const [historicoMetas, setHistoricoMetas] = useState({});
  const [carregandoMetas, setCarregandoMetas] = useState(true);
  const [userId, setUserId] = useState(null);
  // Estados de controle para Edição e Criação
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState(null);
  const [valorTemporario, setValorTemporario] = useState('');
  const [isCriando, setIsCriando] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoLimite, setNovoLimite] = useState('');
  const [novoTipo, setNovoTipo] = useState('orcamento'); // 'orcamento' ou 'meta'

  // 1. Obter o ID do usuário autenticado
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Buscar as configurações do banco (Memorizada com useCallback)
  const carregarDadosDasMetas = useCallback(async () => {
    if (!userId) return;
    try {
      setCarregandoMetas(true);

      const { data, error } = await supabase
        .from('metas')
        .select('categoria, limite, tipo')
        .eq('user_id', userId);

      if (error) throw error;

      const objetoMetas = {};
      if (data && data.length > 0) {
        data.forEach(item => {
          objetoMetas[item.categoria] = {
            limite: Number(item.limite),
            tipo: item.tipo || 'orcamento'
          };
        });
      }

      setLimites(objetoMetas);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      toast.error('Erro ao carregar dados da nuvem.');
    } finally {
      setCarregandoMetas(false);
    }
  }, [userId]);

  // 3. Buscar histórico total para acumular as "Saídas" das Metas (Memorizada com useCallback)
  const carregarHistoricoGeral = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('categoria, valor, tipo')
        .eq('user_id', userId);

      if (error) throw error;

      const acumulado = {};
      if (data) {
        data.forEach(t => {
          const cat = t.categoria || 'Outros';
          if (!acumulado[cat]) acumulado[cat] = 0;
          
          // Conforme combinado: Lançamentos de "Saída" acumulam valor na Meta
          if (t.tipo === 'Saída' || t.tipo?.toLowerCase() === 'saída') {
            acumulado[cat] += t.valor;
          }
        });
      }
      setHistoricoMetas(acumulado);
    } catch (error) {
      console.error('Erro ao calcular histórico:', error);
    }
  }, [userId]);

  // Efeito responsável por disparar a carga inicial sem travar a renderização síncrona
  useEffect(() => {
    if (userId) {
      const timer = setTimeout(() => {
        carregarDadosDasMetas();
        carregarHistoricoGeral();
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [userId, carregarDadosDasMetas, carregarHistoricoGeral]);

  // 4. Salvar/Atualizar uma meta ou orçamento existente
  const salvarLimite = async (categoria) => {
    const valorNumerico = parseFloat(valorTemporario);
    if (isNaN(valorNumerico) || valorNumerico < 0) {
      toast.error('Insira um valor numérico válido.');
      return;
    }

    try {
      const tipoExiste = limites[categoria]?.tipo || 'orcamento';

      const { error } = await supabase
        .from('metas')
        .upsert({ 
          user_id: userId, 
          categoria: categoria, 
          limite: valorNumerico,
          tipo: tipoExiste
        }, { onConflict: 'user_id,categoria' });

      if (error) throw error;

      setLimites(prev => ({
        ...prev,
        [categoria]: { ...prev[categoria], limite: valorNumerico }
      }));
      setCategoriaEmEdicao(null);
      toast.success('Valor updated com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar no banco.');
    }
  };

  // 5. Criar um novo item (Meta ou Orçamento)
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
          limite: limiteNumerico,
          tipo: novoTipo
        }, { onConflict: 'user_id,categoria' });

      if (error) throw error;

      setLimites(prev => ({
        ...prev,
        [categoriaFormatada]: { limite: limiteNumerico, tipo: novoTipo }
      }));

      setNovaCategoria('');
      setNovoLimite('');
      setIsCriando(false);
      carregarHistoricoGeral(); // Recarrega totais acumulados
      toast.success('Adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar:', error);
      toast.error('Erro ao registrar.');
    }
  };

  // 6. Remover definitivamente 
  const removerMeta = async (categoria) => {
    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('user_id', userId)
        .eq('categoria', categoria);

      if (error) throw error;

      // Remove do estado local imediatamente para sumir da tela
      setLimites(prev => {
        const copia = { ...prev };
        delete copia[categoria];
        return copia;
      });
      setCategoriaEmEdicao(null);
      toast.success('Removido permanentemente.');
    } catch (error) {
      console.error('Erro ao remover:', error);
      toast.error('Erro ao deletar do banco.');
    }
  };

  // Processamento do mês atual para os Orçamentos normais
  const despesasMesAtual = transacoes.filter(t => t.tipo === 'Saída' || t.tipo?.toLowerCase() === 'saída');
  const gastosMesPorCategoria = despesasMesAtual.reduce((acc, atual) => {
    const cat = atual.categoria || 'Outros';
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += atual.valor;
    return acc;
  }, {});

  if (carregandoMetas) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-200/60 dark:border-zinc-800 flex flex-col items-center justify-center gap-2 text-xs font-medium text-gray-400">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        Sincronizando metas e orçamentos com a nuvem...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-200/60 dark:border-zinc-800 shadow-xs space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
            Metas e Orçamentos
          </h3>
        </div>
        <button
          onClick={() => setIsCriando(!isCriando)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {isCriando ? 'Fechar' : 'Novo Registro'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isCriando && (
          <form onSubmit={lidarComCriacaoMeta} className="p-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 bg-linear-to-b from-gray-50/50 to-transparent dark:from-zinc-800/20 flex flex-col space-y-3 col-span-1 md:col-span-2">
            <div className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Configurar Novo Item</div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Tipo de Destinação</label>
              <select 
                value={novoTipo} 
                onChange={(e) => setNovoTipo(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100"
              >
                <option value="orcamento">Orçamento Mensal (Limite que renova todo mês)</option>
                <option value="meta">Meta Cofrinho (Acumula histórico de Saídas independente do mês)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Categoria / Nome</label>
                <input type="text" placeholder="Ex: Viagem, Aluguel" desert-value="" required value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Valor Alvo / Limite (R$)</label>
                <input type="number" placeholder="0.00" required min="0" step="any" value={novoLimite} onChange={(e) => setNovoLimite(e.target.value)} className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-zinc-100" />
              </div>
            </div>
            <div className="flex justify-end gap-1.5">
              <button type="button" onClick={() => setIsCriando(false)} className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg text-[10px] font-bold hover:bg-gray-200">Cancelar</button>
              <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700">Adicionar</button>
            </div>
          </form>
        )}

        {Object.keys(limites).map((categoria) => {
          const itemConfig = limites[categoria];
          const ehMeta = itemConfig.tipo === 'meta';
          
          // Quantidade de progresso baseada no tipo escolhido
          const valorProgresso = ehMeta ? (historicoMetas[categoria] || 0) : (gastosMesPorCategoria[categoria] || 0);
          const limiteDefinido = itemConfig.limite;
          const isEditing = categoriaEmEdicao === categoria;
          
          const porcentagem = limiteDefinido > 0 ? Math.min(Math.round((valorProgresso / limiteDefinido) * 100), 100) : 0;

          // Customização visual baseada no tipo (Meta = Verde foco em poupar | Orçamento = Azul foco em limite)
          let corBarra = ehMeta ? 'bg-emerald-500' : 'bg-blue-500';
          let corTexto = ehMeta ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400';
          let corFundoCard = 'bg-slate-50/50 dark:bg-zinc-800/30';

          // Regra de estouro: Alerta vermelho apenas se for Orçamento Mensal
          if (!ehMeta && porcentagem >= 100) {
            corBarra = 'bg-red-500'; 
            corTexto = 'text-red-600 dark:text-red-400'; 
            corFundoCard = 'bg-red-50/30 dark:bg-red-950/10 border-red-100 dark:border-red-900/20';
          }

          return (
            <div key={categoria} className={`p-3 rounded-2xl border border-gray-100 dark:border-zinc-800/60 flex flex-col justify-between space-y-2 group transition-all ${corFundoCard}`}>
              <div className="flex justify-between items-start text-xs">
                <div className="flex flex-col space-y-0.5 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-800 dark:text-zinc-200">{categoria}</span>
                    <span className={`text-[8px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider ${ehMeta ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : 'bg-blue-100 dark:bg-blue-950 text-blue-700'}`}>
                      {ehMeta ? 'Meta' : 'Orçamento'}
                    </span>
                  </div>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1 mt-1.5 w-full">
                      <span className="text-[10px] text-gray-400">R$</span>
                      <input type="number" className="w-18 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-gray-900 dark:text-zinc-100 focus:outline-none" value={valorTemporario} onChange={(e) => setValorTemporario(e.target.value)} autoFocus />
                      <button onClick={() => salvarLimite(categoria)} className="p-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"><Check className="w-3 h-3" /></button>
                      <button onClick={() => removerMeta(categoria)} className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600" title="Remover permanentemente"><Trash2 className="w-3 h-3" /></button>
                      <button onClick={() => setCategoriaEmEdicao(null)} className="p-1 bg-gray-300 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-md hover:bg-gray-400"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500">Alvo: R$ {limiteDefinido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <button onClick={() => { setCategoriaEmEdicao(categoria); setValorTemporario(limiteDefinido.toString()); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all p-0.5 rounded-sm"><Pencil className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className={`font-bold block ${corTexto}`}>{porcentagem}%</span>
                  <span className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                    {ehMeta ? 'Acumulado: ' : 'Gasto no Mês: '} R$ {valorProgresso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ease-out ${corBarra}`} style={{ width: `${porcentagem}%` }} />
              </div>

              {/* Indicadores de Feedback de Status */}
              <div className="flex items-center gap-1 text-[10px] font-semibold opacity-90">
                {ehMeta ? (
                  porcentagem >= 100 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Objetivo alcançado! Excelente!</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><Wallet className="w-3 h-3" /> Guardando parcelas na Meta...</span>
                  )
                ) : (
                  porcentagem >= 100 ? (
                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Limite máximo do mês atingido!</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Orçamento mensal controlado.</span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}