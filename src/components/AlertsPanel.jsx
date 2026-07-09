import { AlertTriangle, CalendarClock, CheckCircle } from 'lucide-react';

/**
 * Componente AlertsPanel - Versão Corrigida (Compatível com Supabase)
 */
export default function AlertsPanel({ transacoes = [] }) {
  
  // 1. Filtragem inteligente tolerante a maiúsculas/minúsculas e corrigindo a chave do banco
  const contasPendentes = transacoes.filter((t) => {
    const tipoTexto = t.tipo ? t.tipo.toLowerCase().trim() : '';
    const statusTexto = t.status ? t.status.toLowerCase().trim() : '';

    const ehSaida = tipoTexto === 'saída' || tipoTexto === 'saida' || tipoTexto === 'despesa';
    const ehPendente = statusTexto === 'pendente' || statusTexto === 'a pagar' || statusTexto === 'em aberto';
    
    // 💡 CORREÇÃO AQUI: Verifica tanto a propriedade do banco (data_vencimento) quanto do estado local
    const dataAlvo = t.data_vencimento || t.dataVencimento;
    const temVencimento = !!dataAlvo;

    return ehSaida && ehPendente && temVencimento;
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 2. Mapear e calcular os prazos restantes
  const alertas = contasPendentes.map((transacao) => {
    // 💡 CORREÇÃO AQUI: Captura o valor correto independente da nomenclatura da propriedade
    const dataAlvo = transacao.data_vencimento || transacao.dataVencimento;
    let vencimento;

    if (typeof dataAlvo === 'string') {
      const separador = dataAlvo.includes('/') ? '/' : '-';
      const partes = dataAlvo.split(separador).map(Number);
      
      if (separador === '-') {
        // Formato AAAA-MM-DD (Vindo do banco/HTML)
        vencimento = new Date(partes[0], partes[1] - 1, partes[2]);
      } else {
        // Formato DD/MM/AAAA
        vencimento = new Date(partes[2], partes[1] - 1, partes[0]);
      }
    } else {
      vencimento = new Date(dataAlvo);
    }
    
    vencimento.setHours(0, 0, 0, 0);

    const diferencaTempo = vencimento.getTime() - hoje.getTime();
    const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

    let statusVencimento = 'em-dia'; 
    let mensagem = '';

    if (diferencaDias < 0) {
      statusVencimento = 'vencida';
      mensagem = `Vencida há ${Math.abs(diferencaDias)} ${Math.abs(diferencaDias) === 1 ? 'dia' : 'dias'}`;
    } else if (diferencaDias <= 3) {
      statusVencimento = 'urgente';
      mensagem = diferencaDias === 0 ? 'Vence HOJE!' : `Vence em ${diferencaDias} ${diferencaDias === 1 ? 'dia' : 'dias'}`;
    }

    return {
      ...transacao,
      statusVencimento,
      mensagem,
      diferencaDias
    };
  })
  // Mantém no painel apenas o que está vencido ou vence em até 3 dias
  .filter(item => item.statusVencimento === 'vencida' || item.statusVencimento === 'urgente');

  // Ordenar: o que está mais crítico/atrasado sobe para o topo
  alertas.sort((a, b) => a.diferencaDias - b.diferencaDias);

  // Cenário A: Tudo pago ou em dia
  if (alertas.length === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/30 flex items-center gap-3 transition-colors duration-200">
        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          Tudo sob controle! Nenhuma conta vencida ou próxima do vencimento para o período selecionado.
        </p>
      </div>
    );
  }

  // Cenário B: Renderizar os cards de aviso
  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-200/60 dark:border-zinc-800 shadow-xs space-y-3 transition-colors duration-200">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
          Atenção: Contas Pendentes
        </h3>
      </div>
      
      <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
        {alertas.map((alerta) => (
          <div 
            key={alerta.id} 
            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
              alerta.statusVencimento === 'vencida'
                ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400'
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-gray-900 dark:text-zinc-100">{alerta.descricao}</span>
              <span className="text-[10px] opacity-80 flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5" /> {alerta.mensagem}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold block text-gray-900 dark:text-zinc-100">
                R$ {alerta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-zinc-800/60 font-semibold border border-current/10 inline-block mt-0.5">
                {alerta.categoria}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}