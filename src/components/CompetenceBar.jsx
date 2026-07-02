import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function CompetenceBar({ filtroCompetencia, setFiltroCompetencia, setPaginaAtual }) {
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
    if (!compString) return "Histórico Completo";
    const [ano, mes] = compString.split('-');
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${meses[Number(mes) - 1]} de ${ano}`;
  }

  return (
    <section className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm gap-3">
      <div className="flex items-center gap-2">
        <div className="bg-blue-50 p-2 rounded-xl text-blue-500 border border-blue-100 hidden sm:block">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => alterarCompetencia(-1)} 
            className="p-1.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-gray-200/40 transition-all active:scale-95 text-neutral-600"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-neutral-700 min-w-37.5 text-center bg-neutral-50 px-3 py-1.5 rounded-xl border border-gray-200/30">
            {formatarCompetenciaTexto(filtroCompetencia)}
          </span>
          <button 
            onClick={() => alterarCompetencia(1)} 
            className="p-1.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-gray-200/40 transition-all active:scale-95 text-neutral-600"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <button 
        onClick={() => {
          if (filtroCompetencia) {
            setFiltroCompetencia('');
          } else {
            const hoje = new Date();
            setFiltroCompetencia(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`);
          }
          setPaginaAtual(1);
        }}
        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-[0.98] ${!filtroCompetencia ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'bg-neutral-50 text-neutral-600 border-gray-200/80 hover:bg-neutral-100'}`}
      >
        {!filtroCompetencia ? 'Voltar para Visão Mensal' : 'Ver Histórico Completo'}
      </button>
    </section>
  );
}