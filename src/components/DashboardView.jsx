import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import SummaryCards from './SummaryCards';
import AlertsPanel from './AlertsPanel'; // IMPORTAÇÃO DO NOVO COMPONENTE
import BudgetPanel from './BudgetPanel';

export default function DashboardView({ totalEntradas, totalSaidas, saldoAtual, transacoesFiltradas }) {
  
  const dadosFluxo = [
    { name: 'Entradas', valor: totalEntradas, fill: '#16a34a' },
    { name: 'Saídas', valor: totalSaidas, fill: '#dc2626' }
  ];

  const despesasPorCategoria = transacoesFiltradas
    .filter(t => t.tipo === 'Saída')
    .reduce((acc, atual) => {
      const categoriaExistente = acc.find(item => item.name === atual.categoria);
      if (categoriaExistente) {
        categoriaExistente.value += atual.valor;
      } else {
        acc.push({ name: atual.categoria, value: atual.valor });
      }
      return acc;
    }, []);

  const CORES_GRAFICO = ['#2563eb', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280'];

  const formatarMoedaToolTip = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-4">
      <SummaryCards totalEntradas={totalEntradas} totalSaidas={totalSaidas} saldoAtual={saldoAtual} />

      {/* NOVO PAINEL INSERIDO AQUI PARA DAR DESTAQUE ANTES DOS GRÁFICOS */}
      <AlertsPanel transacoes={transacoesFiltradas} />

      <BudgetPanel transacoes={transacoesFiltradas} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Gráfico 1: Fluxo de Caixa */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-200/60 dark:border-zinc-800 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Fluxo de Caixa Geral</h3>
          
          {/* Correção aplicada: As diretivas de importância '!' mudaram para o final de cada classe utilitária */}
          <div className="h-60 w-full text-[10px] font-semibold text-gray-400 dark:text-zinc-500 [&_.recharts-default-tooltip]:bg-white! [&_.recharts-default-tooltip]:dark:bg-zinc-800! [&_.recharts-default-tooltip]:border-gray-200! [&_.recharts-default-tooltip]:dark:border-zinc-700! [&_.recharts-default-tooltip_*]:text-gray-900! [&_.recharts-default-tooltip_*]:dark:text-zinc-100!">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosFluxo} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-zinc-800/80" />
                <XAxis dataKey="name" stroke="currentColor" className="text-slate-400 dark:text-zinc-500" />
                <YAxis stroke="currentColor" className="text-slate-400 dark:text-zinc-500" tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip formatter={formatarMoedaToolTip} cursor={{ fill: 'currentColor', opacity: 0.04 }} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {dadosFluxo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Despesas por Categoria */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-200/60 dark:border-zinc-800 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <h3 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Despesas por Categoria</h3>
          
          {/* Correção aplicada: As diretivas de importância '!' mudaram para o final de cada classe utilitária */}
          <div className="h-60 w-full flex items-center justify-center [&_.recharts-default-tooltip]:bg-white! [&_.recharts-default-tooltip]:dark:bg-zinc-800! [&_.recharts-default-tooltip]:border-gray-200! [&_.recharts-default-tooltip]:dark:border-zinc-700! [&_.recharts-default-tooltip_*]:text-gray-900! [&_.recharts-default-tooltip_*]:dark:text-zinc-100!">
            {despesasPorCategoria.length === 0 ? (
              <span className="text-xs font-medium text-gray-400 dark:text-zinc-500">Nenhum gasto registrado neste período.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={despesasPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {despesasPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatarMoedaToolTip} />
                  <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} className="text-slate-500 dark:text-zinc-400" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}