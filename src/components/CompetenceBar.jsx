import { ChevronLeft, ChevronRight, Calendar, Layers } from 'lucide-react';

const CATEGORIAS_PADRAO = [
  'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 
  'Lazer', 'Renda', 'Transferência', 'Contas', 'Investimentos', 'Outros'
];

export default function CompetenceBar({ 
  filtroCompetencia, 
  setFiltroCompetencia, 
  filtroPeriodo,       // Novo: 'mensal' | '3meses' | 'ano' | 'tudo'
  setFiltroPeriodo,    // Novo
  filtroCategoria,     // Novo: '' ou nome da categoria
  setFiltroCategoria,  // Novo
  setPaginaAtual 
}) {

  // Altera o mês caso o período selecionado seja o mensal
  function alterarCompetencia(offset) {
    if (!filtroCompetencia) {
      const hoje = new Date();
      setFiltroCompetencia(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`);
      return;
    }
    const [ano, mes] = filtroCompetencia.split('-').map(Number);
    const novaData = new Date(ano, mes - 1 + offset, 1);
    const novoAno = novaData.getFullYear();
    const novoMes = String(novaData.getMonth() + 1).padStart(2, '0');
    
    setFiltroCompetencia(`${novoAno}-${novoMes}`);
    setPaginaAtual(1);
  }

  function formatarCompetenciaTexto(compString) {
    if (filtroPeriodo === 'tudo') return "Histórico Completo";
    if (filtroPeriodo === '3meses') return "Últimos 3 Meses";
    if (filtroPeriodo === 'ano') return `Ano de ${new Date().getFullYear()}`;
    
    if (!compString) return "Mês Não Selecionado";
    const [ano, mes] = compString.split('-');
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${meses[Number(mes) - 1]} de ${ano}`;
  }

  return (
    <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200/60 dark:border-zinc-800 shadow-sm gap-4 transition-colors duration-200">
      
      {/* SEÇÃO DA ESQUERDA: Filtros de Tempo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
        
        {/* Seletor de Tipo de Período */}
        <div className="flex items-center gap-1 bg-neutral-100/80 dark:bg-zinc-800/60 p-1 rounded-xl border border-gray-200/30 dark:border-zinc-700 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => { setFiltroPeriodo('mensal'); setPaginaAtual(1); }}
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filtroPeriodo === 'mensal' 
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => { setFiltroPeriodo('3meses'); setPaginaAtual(1); }}
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filtroPeriodo === '3meses' 
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200'
            }`}
          >
            3 Meses
          </button>
          <button
            onClick={() => { setFiltroPeriodo('ano'); setPaginaAtual(1); }}
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filtroPeriodo === 'ano' 
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200'
            }`}
          >
            Este Ano
          </button>
          <button
            onClick={() => { setFiltroPeriodo('tudo'); setPaginaAtual(1); }}
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filtroPeriodo === 'tudo' 
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200'
            }`}
          >
            Tudo
          </button>
        </div>

        {/* Visualizador do Escopo Cronológico + Navegação por Setas */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
          {filtroPeriodo === 'mensal' && (
            <button 
              onClick={() => alterarCompetencia(-1)} 
              className="p-1.5 bg-neutral-50 dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 rounded-xl border border-gray-200/40 dark:border-zinc-700 transition-all active:scale-95 text-neutral-600 dark:text-zinc-400 cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 bg-neutral-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-gray-200/30 dark:border-zinc-700 text-xs font-bold text-neutral-700 dark:text-zinc-300 min-w-40 justify-center shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>{formatarCompetenciaTexto(filtroCompetencia)}</span>
          </div>

          {filtroPeriodo === 'mensal' && (
            <button 
              onClick={() => alterarCompetencia(1)} 
              className="p-1.5 bg-neutral-50 dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 rounded-xl border border-gray-200/40 dark:border-zinc-700 transition-all active:scale-95 text-neutral-600 dark:text-zinc-400 cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SEÇÃO DA DIREITA: Novo Filtro por Categoria */}
      <div className="flex items-center gap-2 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-gray-200/40 dark:border-zinc-700 text-xs font-bold text-neutral-600 dark:text-zinc-400 w-full lg:w-60">
          <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <select
            value={filtroCategoria}
            onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaAtual(1); }}
            className="bg-transparent text-neutral-700 dark:text-zinc-200 outline-none w-full cursor-pointer font-semibold text-xs"
          >
            <option value="" className="bg-white dark:bg-zinc-900">Todas as Categorias</option>
            {CATEGORIAS_PADRAO.map((cat) => (
              <option key={cat} value={cat} className="bg-white dark:bg-zinc-900">
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

    </section>
  );
}