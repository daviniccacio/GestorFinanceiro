import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast, { Toaster } from 'react-hot-toast';
import { Wallet, Eye, EyeOff } from 'lucide-react';

// IMPORTAÇÃO DOS COMPONENTES REFATORADOS
import CompetenceBar from './components/CompetenceBar';
import SummaryCards from './components/SummaryCards';
import FilterCenter from './components/FilterCenter';
import TransactionTable from './components/TransactionTable';
import TransactionModal from './components/TransactionModal';
import DeleteModal from './components/DeleteModal';

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [idExclusaoConfirmar, setIdExclusaoConfirmar] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const [filtroCompetencia, setFiltroCompetencia] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  const [descricao, setDescricao] = useState('');
  const [valorMascara, setValorMascara] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState('Saída');
  const [status, setStatus] = useState('Pago');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [dataVencimento, setDataVencimento] = useState('');
  const [dadosPagamento, setDadosPagamento] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { 
    if (session) buscarTransacoes(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function buscarTransacoes() {
    try {
      setCarregando(true);
      const { data: dados, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('data', { ascending: false });
      if (error) throw error;
      setTransacoes(dados || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao buscar dados do banco.');
    } finally {
      setCarregando(false);
    }
  }

  async function lidarComLogin(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error('E-mail ou senha incorretos.');
    else toast.success('Bem-vindo de volta!');
  }

  async function lidarComLogout() {
    await supabase.auth.signOut();
    setTransacoes([]);
    toast.success('Sessão encerrada.');
  }

  async function salvarLancamento(e) {
    e.preventDefault();
    const valorFloat = Number(valorMascara.replace(/\D/g, '')) / 100;

    if (!descricao || valorFloat <= 0 || !categoria) {
      toast.error('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const dadosLancamento = {
      data, descricao, categoria: categoria.trim(), valor: valorFloat, tipo, status,
      data_vencimento: dataVencimento || null, dados_pagamento: dadosPagamento || null, user_id: session.user.id
    };

    const { error } = editandoId
      ? await supabase.from('transacoes').update(dadosLancamento).eq('id', editandoId)
      : await supabase.from('transacoes').insert([dadosLancamento]);

    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } else {
      toast.success(editandoId ? 'Lançamento updated!' : 'Lançamento cadastrado!');
      limparFormulario();
      buscarTransacoes();
    }
  }

  async function ejecutarExclusao() {
    if (!idExclusaoConfirmar) return;
    try {
      const { error } = await supabase.from('transacoes').delete().eq('id', idExclusaoConfirmar);
      if (error) throw error;
      toast.success('Lançamento removido.');
      if (editandoId === idExclusaoConfirmar) limparFormulario();
      buscarTransacoes();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir registro.');
    } finally {
      setIdExclusaoConfirmar(null);
    }
  }

  function prepararEdicao(t) {
    setEditandoId(t.id);
    setData(t.data);
    setDescricao(t.descricao);
    setValorMascara(t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    setCategoria(t.categoria);
    setTipo(t.tipo);
    setStatus(t.status);
    setDataVencimento(t.data_vencimento || '');
    setDadosPagamento(t.dados_pagamento || '');
    setIsModalAberto(true);
  }

  function limparFormulario() {
    setEditandoId(null); setDescricao(''); setValorMascara(''); setCategoria('');
    setData(new Date().toISOString().split('T')[0]); setTipo('Saída'); setStatus('Pago');
    setDataVencimento(''); setDadosPagamento(''); setIsModalAberto(false);
  }

  const categoriasUnicas = [...new Set(transacoes.map(t => t.categoria))].filter(Boolean);

  const transacoesFiltradas = transacoes.filter(t => {
    const bateTexto = t.descricao.toLowerCase().includes(buscaTexto.toLowerCase()) || t.categoria.toLowerCase().includes(buscaTexto.toLowerCase());
    const bateCompetencia = !filtroCompetencia || t.data.substring(0, 7) === filtroCompetencia;
    const bateCategoria = !filtroCategoria || t.categoria.toLowerCase() === filtroCategoria.toLowerCase();
    const bateStatus = !filtroStatus || t.status === filtroStatus;
    return bateTexto && bateCompetencia && bateCategoria && bateStatus;
  });

  const totalPaginas = Math.ceil(transacoesFiltradas.length / itensPorPagina) || 1;
  const transacoesPaginadas = transacoesFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const totalEntradas = transacoesFiltradas.filter(t => t.tipo === 'Entrada').reduce((acc, curr) => acc + curr.valor, 0);
  const totalSaidas = transacoesFiltradas.filter(t => t.tipo === 'Saída').reduce((acc, curr) => acc + curr.valor, 0);
  const saldoAtual = totalEntradas - totalSaidas;

  function exportarPDF() {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const azulInstitucional = [37, 99, 235]; 
    const cinzaTexto = [100, 116, 139];     
    const fundoCard = [248, 250, 252];       

    const competenciaFormatada = filtroCompetencia ? filtroCompetencia.split('-').reverse().join('/') : 'Geral';

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.textColor = azulInstitucional[0], azulInstitucional[1], azulInstitucional[2];
    doc.text("GESTOR FINANCEIRO", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.textColor = cinzaTexto[0], cinzaTexto[1], cinzaTexto[2];
    doc.text(`Relatório de Movimentação Mensal - Período: ${competenciaFormatada}`, 14, 26);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 150, 26);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 30, 196, 30);

    doc.setFillColor(fundoCard[0], fundoCard[1], fundoCard[2]);
    doc.roundedRect(14, 35, 182, 22, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.textColor = 148, 163, 184; 
    doc.text("TOTAL ENTRADAS", 22, 41);
    doc.text("TOTAL SAÍDAS", 82, 41);
    doc.text("SALDO DO PERÍODO", 142, 41);

    doc.setFontSize(12);
    doc.textColor = 22, 163, 74; 
    doc.text(`R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 22, 50);

    doc.textColor = 220, 38, 38; 
    doc.text(`R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 82, 50);

    if (saldoAtual >= 0) {
      doc.textColor = 37, 99, 235;
    } else {
      doc.textColor = 234, 88, 12;
    }
    doc.text(`R$ ${saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 142, 50);

    const colunasTabela = ["Data Lanc.", "Vencimento", "Descrição", "Categoria", "Valor", "Status"];
    
    const canalLinhas = transacoesFiltradas.map(t => [
      new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      t.data_vencimento ? new Date(t.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
      t.descricao, 
      t.categoria, 
      `${t.tipo === 'Entrada' ? '+ ' : '- '}R$ ${t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      t.status
    ]);

    autoTable(doc, {
      startY: 64,
      head: [colunasTabela],
      body: canalLinhas,
      margin: { left: 14, right: 14 },
      theme: 'striped',
      headStyles: {
        fillColor: azulInstitucional,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 4) {
          const textoValor = data.cell.raw || '';
          if (textoValor.startsWith('+')) {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          } else if (textoValor.startsWith('-')) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    doc.save(`Relatorio_Financeiro_${filtroCompetencia || 'Geral'}.pdf`);
    toast.success('PDF exportado com sucesso!');
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4 md:p-8 font-sans">
        <Toaster position="bottom-right" />

        <div className="bg-white w-full max-w-4xl rounded-3xl shadow-sm border border-gray-200/60 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-130">

          <div className="hidden md:flex flex-col justify-between p-10 bg-linear-to-br from-blue-600 to-indigo-800 text-white relative overflow-hidden">
            
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 150 Q 200 220, 400 110 T 800 200" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-wider uppercase">Gestor Financeiro</span>
            </div>

            <div className="space-y-3 relative z-10 my-auto">
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
                Simplifique o controle <br />
                do seu dinheiro.
              </h2>
              <p className="text-xs text-blue-100/80 max-w-sm font-medium leading-relaxed">
                Uma plataforma direta e intuitiva para você lançar despesas, acompanhar receitas, gerenciar vencimentos e exportar relatórios sem complicação.
              </p>
            </div>

            <div className="text-[11px] text-blue-200/50 font-medium relative z-10">
              Sistema de Controle Interno • Conexão Segura
            </div>
          </div>

          <div className="flex flex-col justify-center p-8 md:p-12 bg-white">
            <div className="w-full max-w-sm mx-auto space-y-6">

              <div className="flex md:hidden items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-blue-500" />
                <h1 className="text-sm font-bold text-gray-900">Gestor Financeiro</h1>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Acesse sua conta</h3>
                <p className="text-xs text-gray-400 font-medium">Insira suas credenciais para gerenciar a aplicação.</p>
              </div>

              <form onSubmit={lidarComLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">E-mail de acesso</label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="w-full bg-neutral-50/60 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Senha</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="w-full bg-neutral-50/60 border border-gray-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-blue-600 transition-all shadow-sm shadow-blue-500/10 active:scale-[0.98] mt-2"
                >
                  Entrar no Sistema
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] pb-8">
      <Toaster position="bottom-right" />
      <header className="bg-white/80 backdrop-blur-md border-b border-b-gray-200 sticky top-0 z-40 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Wallet className="w-5 h-5 text-blue-500" /><h1 className="text-sm font-bold">Gestor Financeiro</h1></div>
          <button onClick={lidarComLogout} className="flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-semibold px-2.5 py-1.5 rounded-xl">Sair</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <CompetenceBar filtroCompetencia={filtroCompetencia} setFiltroCompetencia={setFiltroCompetencia} setPaginaAtual={setPaginaAtual} />
        <SummaryCards totalEntradas={totalEntradas} totalSaidas={totalSaidas} saldoAtual={saldoAtual} />
        <FilterCenter buscaTexto={buscaTexto} setBuscaTexto={setBuscaTexto} filtroCategoria={filtroCategoria} setFiltroCategoria={setFiltroCategoria} filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus} categoriasUnicas={categoriasUnicas} setPaginaAtual={setPaginaAtual} />
        <TransactionTable carregando={carregando} transacoesPaginadas={transacoesPaginadas} totalPaginas={totalPaginas} paginaAtual={paginaAtual} setPaginaAtual={setPaginaAtual} setIsModalAberto={setIsModalAberto} exportarPDF={exportarPDF} prepararEdicao={prepararEdicao} setIdExclusaoConfirmar={setIdExclusaoConfirmar} />

        {isModalAberto && (
          <TransactionModal editandoId={editandoId} limparFormulario={limparFormulario} salvarLancamento={salvarLancamento} data={data} setData={setData} dataVencimento={dataVencimento} setDataVencimento={setDataVencimento} descricao={descricao} setDescricao={setDescricao} dadosPagamento={dadosPagamento} setDadosPagamento={setDadosPagamento} valorMascara={valorMascara} setValorMascara={setValorMascara} category={categoria} setCategoria={setCategoria} tipo={tipo} setTipo={setTipo} status={status} setStatus={setStatus} />
        )}

        {idExclusaoConfirmar && (
          <DeleteModal setIdExclusaoConfirmar={setIdExclusaoConfirmar} ejecutarExclusao={ejecutarExclusao} />
        )}
      </main>
    </div>
  );
}