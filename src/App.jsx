import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast, { Toaster } from 'react-hot-toast'; 
import { 
  LogOut, Wallet, ArrowUpCircle, ArrowDownCircle, 
  PlusCircle, Pencil, Trash2, XCircle, Tag,
  ChevronLeft, ChevronRight, FileText, AlertTriangle, CreditCard
} from 'lucide-react';

export default function App() {
  // --- ESTADOS DE AUTENTICAÇÃO ---
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- ESTADOS DOS DADOS ---
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState(null); 

  // --- ESTADOS DOS MODAIS ---
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [idExclusaoConfirmar, setIdExclusaoConfirmar] = useState(null); // Estado para controlar o modal de exclusão

  // --- ESTADOS DOS FILTROS ---
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState(''); 
  const [filtroStatus, setFiltroStatus] = useState('');       

  // --- ESTADO DA PAGINAÇÃO ---
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // --- ESTADOS DO FORMULÁRIO ---
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState('Saída');
  const [status, setStatus] = useState('Pago');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [dataVencimento, setDataVencimento] = useState('');
  const [dadosPagamento, setDadosPagamento] = useState('');

  // Monitoramento da sessão activa
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      buscarTransacoes();
    }
  }, [session]);

  // Busca de transações no banco de dados
  async function buscarTransacoes() {
    try {
      setCarregando(true);
      const { data: dados, error } = await supabase
        .from('transacoes')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;
      setTransacoes(dados || []);
    } catch (error) {
      toast.error('Erro ao buscar dados do banco.');
      console.error(error.message);
    } finally {
      setCarregando(false);
    }
  }

  // Ações de Login e Logout
  async function lidarComLogin(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error('E-mail ou senha incorretos.');
    } else {
      toast.success('Bem-vindo de volta!');
    }
  }

  async function lidarComLogout() {
    await supabase.auth.signOut();
    setTransacoes([]);
    toast.success('Sessão encerrada.');
  }

  // Criação ou Atualização de registros
  async function salvarLancamento(e) {
    e.preventDefault();
    if (!descricao || !valor || !categoria) {
      toast.error('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const dadosLancamento = { 
      data, 
      descricao, 
      categoria: categoria.trim(), 
      valor: parseFloat(valor), 
      tipo, 
      status,
      data_vencimento: dataVencimento || null,
      dados_pagamento: dadosPagamento || null
    };

    if (editandoId) {
      const { error } = await supabase
        .from('transacoes')
        .update(dadosLancamento)
        .eq('id', editandoId);

      if (error) {
        toast.error(`Erro ao atualizar: ${error.message}`);
      } else {
        toast.success('Lançamento atualizado com sucesso!');
        limparFormulario();
        buscarTransacoes();
      }
    } else {
      const { error } = await supabase
        .from('transacoes')
        .insert([dadosLancamento]);

      if (error) {
        toast.error(`Erro ao salvar: ${error.message}`);
      } else {
        toast.success('Lançamento cadastrado com sucesso!');
        limparFormulario();
        buscarTransacoes();
      }
    }
  }

  // Execução real da exclusão no Banco de Dados
  async function executarExclusao() {
    if (!idExclusaoConfirmar) return;

    try {
      const { error } = await supabase.from('transacoes').delete().eq('id', idExclusaoConfirmar);
      if (error) throw error;

      toast.success('Lançamento removido.');
      if (editandoId === idExclusaoConfirmar) limparFormulario();
      buscarTransacoes();
    } catch (error) {
      toast.error('Não foi possível excluir o registro.');
    } finally {
      setIdExclusaoConfirmar(null); // Fecha o modal limpando o ID
    }
  }

  function prepararEdicao(t) {
    setEditandoId(t.id);
    setData(t.data);
    setDescricao(t.descricao);
    setValor(t.valor.toString());
    setCategoria(t.categoria);
    setTipo(t.tipo);
    setStatus(t.status);
    setDataVencimento(t.data_vencimento || '');
    setDadosPagamento(t.dados_pagamento || '');

    setIsModalAberto(true);
  }

  function limparFormulario() {
    setEditandoId(null);
    setDescricao('');
    setValor('');
    setCategoria('');
    setData(new Date().toISOString().split('T')[0]);
    setTipo('Saída');
    setStatus('Pago');
    setDataVencimento('');
    setDadosPagamento('');
    setIsModalAberto(false);
  }

  // Verificação de vencimento para alertas visuais
  function verificarStatusVencimento(dataVenc, statusAtual) {
    if (!dataVenc || statusAtual === 'Pago') return null;
    
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const vencimento = new Date(dataVenc + 'T00:00:00');
    vencimento.setHours(0,0,0,0);

    const diferencaTempo = vencimento.getTime() - hoje.getTime();
    const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

    if (diferencaDias < 0) return { rotulo: 'Atrasado', cor: 'text-red-600 bg-red-50 border-red-100' };
    if (diferencaDias === 0) return { rotulo: 'Vence Hoje', cor: 'text-amber-600 bg-amber-50 border-amber-100 animate-pulse' };
    if (diferencaDias <= 3) return { rotulo: `Próximo (${diferencaDias} d)`, cor: 'text-orange-500 bg-orange-50 border-orange-100' };
    
    return null;
  }

  // Geração dinâmica de categorias para o filtro
  const categoriasUnicas = [...new Set(transacoes.map(t => t.categoria))].filter(Boolean);

  // Lógica de filtragem acumulada
  const transacoesFiltradas = transacoes.filter(t => {
    const bateTexto = 
      t.descricao.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      t.categoria.toLowerCase().includes(buscaTexto.toLowerCase());
    
    const bateMes = !filtroMes || t.data.split('-')[1] === filtroMes;
    const bateCategoria = !filtroCategoria || t.categoria.toLowerCase() === filtroCategoria.toLowerCase();
    const bateStatus = !filtroStatus || t.status === filtroStatus;

    return bateTexto && bateMes && bateCategoria && bateStatus;
  });

  // Lógica da paginação
  const totalPaginas = Math.ceil(transacoesFiltradas.length / itensPorPagina) || 1;
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const transacoesPaginadas = transacoesFiltradas.slice(indicePrimeiroItem, indiceUltimoItem);

  // Totais dinâmicos
  const totalEntradas = transacoesFiltradas.filter(t => t.tipo === 'Entrada').reduce((acc, curr) => acc + curr.valor, 0);
  const totalSaidas = transacoesFiltradas.filter(t => t.tipo === 'Saída').reduce((acc, curr) => acc + curr.valor, 0);
  const saldoAtual = totalEntradas - totalSaidas;

  // Exportação para PDF
  function exportarPDF() {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold").setFontSize(20);
    doc.text("Relatório Financeiro", 14, 22);
    
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28);

    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(0);
    doc.text("Filtros Ativos na Exportação:", 14, 38);
    doc.setFont("helvetica", "normal").setTextColor(100);
    doc.text(`Busca: ${buscaTexto || "Nenhum"}  |  Mês: ${filtroMes || "Todos"}  |  Categoria: ${filtroCategoria || "Todas"}  |  Status: ${filtroStatus || "Todos"}`, 14, 44);

    doc.setFillColor(248, 249, 250);
    doc.rect(14, 50, 182, 22, "F");

    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(22, 163, 74);
    doc.text("TOTAL ENTRADAS", 18, 58);
    doc.setFontSize(11).text(`R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 18, 66);

    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(220, 38, 38);
    doc.text("TOTAL SAÍDAS", 82, 58);
    doc.setFontSize(11).text(`R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 82, 66);

    doc.setFont("helvetica", "bold").setFontSize(8);
    if (saldoAtual >= 0) doc.setTextColor(37, 99, 235); else doc.setTextColor(249, 115, 22);
    doc.text("SALDO ATUAL", 146, 58);
    doc.setFontSize(11).text(`R$ ${saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 146, 66);

    const colunas = ["Data Lanc.", "Vencimento", "Descrição", "Categoria", "Valor", "Status"];
    const linhas = transacoesFiltradas.map(t => [
      new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      t.data_vencimento ? new Date(t.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
      t.descricao,
      t.categoria,
      `${t.tipo === 'Entrada' ? '+ ' : '- '}R$ ${t.valor.toFixed(2)}`,
      t.status
    ]);

    autoTable(doc, {
      head: [colunas],
      body: linhas,
      startY: 80,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      styles: { fontSize: 8, valign: 'middle' },
      columnStyles: { 4: { fontStyle: 'bold' } },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw && data.cell.raw.startsWith('+')) {
            data.cell.styles.textColor = [22, 163, 74];
          } else {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      }
    });

    doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Relatório PDF exportado!');
  }

  // --- RENDER DA TELA DE LOGIN ---
  if (!session) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4 text-neutral-900">
        <Toaster position="bottom-right" />
        <div className="bg-white p-6 rounded-2xl shadow-sm w-full max-w-sm border border-gray-200/60 space-y-5">
          <div className="flex flex-col items-center gap-2 border-b border-gray-100 pb-4">
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
              <Wallet className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-base font-bold text-neutral-800">Gestor Financeiro</h1>
            <p className="text-[11px] text-neutral-400 font-medium">Insira as suas credenciais para aceder ao painel</p>
          </div>

          <form onSubmit={lidarComLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">E-mail</label>
              <input type="email" placeholder="seu@email.com" required className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700 font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Senha</label>
              <input type="password" placeholder="••••••••" required className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700 font-medium" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-blue-600 active:scale-[0.99] transition-all shadow-sm mt-2">Entrar no Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER DA TELA PRINCIPAL ---
  return (
    <div className="min-h-screen bg-[#f2f2f7] text-neutral-900 pb-8">
      <Toaster position="bottom-right" reverseOrder={false} />
      
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-500" />
            <h1 className="text-sm font-bold">Gestor Financeiro</h1>
          </div>
          <button onClick={lidarComLogout} className="flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* CARDS DE MONTANTE */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm border-gray-200/60">
            <div><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Entradas</p><h3 className="text-lg font-bold text-green-600">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3></div>
            <ArrowUpCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm border-gray-200/60">
            <div><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Saídas</p><h3 className="text-lg font-bold text-red-500">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3></div>
            <ArrowDownCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm border-gray-200/60">
            <div><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Saldo Geral</p><h3 className={`text-lg font-bold ${saldoAtual >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3></div>
            <Wallet className={`w-5 h-5 ${saldoAtual >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
          </div>
        </section>

        {/* CENTRAL DE FILTROS */}
        <section className="bg-white p-3 rounded-2xl border border-gray-200/60 grid grid-cols-1 sm:grid-cols-4 gap-2.5 shadow-sm">
          <input type="text" placeholder="Buscar descrição..." className="bg-neutral-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700" value={buscaTexto} onChange={(e) => { setBuscaTexto(e.target.value); setPaginaAtual(1); }} />
          <select className="bg-neutral-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all" value={filtroMes} onChange={(e) => { setFiltroMes(e.target.value); setPaginaAtual(1); }}>
            <option value="">Todos os Meses</option>
            <option value="01">Janeiro</option><option value="02">Fevereiro</option><option value="03">Março</option>
            <option value="04">Abril</option><option value="05">Maio</option><option value="06">Junho</option>
            <option value="07">Julho</option><option value="08">Agosto</option><option value="09">Setembro</option>
            <option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
          </select>
          <select className="bg-neutral-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all" value={filtroCategoria} onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaAtual(1); }}>
            <option value="">Todas Categorias</option>
            {categoriasUnicas.map((c, i) => <option key={i} value={c}>{c}</option>)}
          </select>
          <select className="bg-neutral-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all" value={filtroStatus} onChange={(e) => { setFiltroStatus(e.target.value); setPaginaAtual(1); }}>
            <option value="">Todos Status</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
          </select>
        </section>

        {/* TABELA DE LANÇAMENTOS */}
        <section className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm w-full">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-2">
            <h2 className="font-bold text-xs md:text-sm">Histórico de Lançamentos</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsModalAberto(true)} className="flex items-center gap-1 bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
                <PlusCircle className="w-3.5 h-3.5" /> Novo Lançamento
              </button>
              <button onClick={exportarPDF} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-gray-100">
                  <th className="p-3.5">Data Lanc. / Venc.</th>
                  <th className="p-3.5">Descrição / Informações</th>
                  <th className="p-3.5">Valor</th>
                  <th className="p-3.5 text-center">Status / Alerta</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {transacoesPaginadas.map((t) => {
                  const alertaVencimento = verificarStatusVencimento(t.data_vencimento, t.status);
                  return (
                    <tr key={t.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-3.5 whitespace-nowrap text-neutral-500">
                        <div className="font-bold text-xs text-neutral-700">{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                        {t.data_vencimento && <div className="text-xs font-semibold text-neutral-400 mt-0.5">Validade: {new Date(t.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</div>}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-neutral-900 text-sm">{t.descricao}</div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-neutral-500">
                          <span className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-md font-medium">
                            <Tag className="w-3 h-3 text-neutral-400" /> {t.categoria}
                          </span>
                          {t.dados_pagamento && (
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-100">
                              <CreditCard className="w-3 h-3 text-blue-400" /> {t.dados_pagamento}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`p-3.5 font-bold whitespace-nowrap text-sm ${t.tipo === 'Entrada' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.tipo === 'Entrada' ? '+ ' : '- '}R$ {t.valor.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap space-y-1">
                        <div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${t.status === 'Pago' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-500 border-orange-200'}`}>{t.status}</span>
                        </div>
                        {alertaVencimento && (
                          <div className="flex justify-center">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold border flex items-center gap-0.5 ${alertaVencimento.cor}`}>
                              <AlertTriangle className="w-2.5 h-2.5" /> {alertaVencimento.rotulo}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => prepararEdicao(t)} className="p-1.5 bg-neutral-50 rounded-lg border border-gray-200 hover:bg-neutral-100 text-neutral-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          {/* Modificado para acionar o modal customizado de exclusão */}
                          <button onClick={() => setIdExclusaoConfirmar(t.id)} className="p-1.5 bg-neutral-50 rounded-lg border border-gray-200 hover:bg-neutral-100 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* CONTROLO DE PAGINAÇÃO */}
          <div className="p-3 bg-neutral-50 border-t border-gray-100 flex items-center justify-between text-neutral-500 text-xs">
            <span>Página <b>{paginaAtual}</b> de {totalPaginas}</span>
            <div className="flex items-center gap-1">
              <button disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => p - 1)} className="p-1 border border-gray-200 bg-white rounded-lg disabled:opacity-40 hover:bg-neutral-50"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(p => p + 1)} className="p-1 border border-gray-200 bg-white rounded-lg disabled:opacity-40 hover:bg-neutral-50"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </section>

        {/* MODAL PARA ADICIONAR / EDITAR LANÇAMENTO */}
        {isModalAberto && (
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h2 className="font-bold text-sm flex items-center gap-2 text-neutral-800">
                  <PlusCircle className="w-4 h-4 text-blue-500" />
                  {editandoId ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h2>
                <button onClick={limparFormulario} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={salvarLancamento} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Data Lançamento</label>
                    <input type="date" required className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700 font-medium" value={data} onChange={(e) => setData(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Data Vencimento</label>
                    <input type="date" className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700 font-medium" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Descrição</label>
                  <input type="text" required placeholder="Ex: Mercado Central" className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Dados para Pagamento</label>
                  <input type="text" placeholder="Chave Pix, código de barras, agência/conta..." className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700" value={dadosPagamento} onChange={(e) => setDadosPagamento(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" required placeholder="0.00" className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700 font-semibold" value={valor} onChange={(e) => setValor(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Categoria</label>
                    <input type="text" required placeholder="Ex: Alimentação" className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Tipo de Operação</label>
                    <select className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700 font-medium" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                      <option value="Saída">🔻 Saída</option>
                      <option value="Entrada">🔺 Entrada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Status Inicial</label>
                    <select className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700 font-medium" value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="Pago">Pago</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button type="button" onClick={limparFormulario} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-semibold transition-colors">Cancelar</button>
                  <button type="submit" className={`px-5 py-2 font-semibold rounded-xl text-xs text-white transition-all shadow-sm active:scale-[0.99] ${editandoId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                    {editandoId ? 'Atualizar Lançamento' : 'Salvar Lançamento'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* MODAL CUSTOMIZADO DE CONFIRMAÇÃO DE EXCLUSÃO */}
        {idExclusaoConfirmar && (
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm space-y-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-red-500">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h2 className="font-bold text-sm text-neutral-800">Confirmar Exclusão</h2>
                <p className="text-xs text-neutral-500">
                  Tem certeza de que deseja apagar permanentemente este lançamento? Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIdExclusaoConfirmar(null)} 
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-semibold transition-colors w-full"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={executarExclusao} 
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-all shadow-sm w-full active:scale-[0.99]"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}