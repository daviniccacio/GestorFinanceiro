import { PlusCircle, FileText, FolderOpen, Tag, CreditCard, AlertTriangle, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// ADICIONADO: Recebimento da prop "carregando" no componente
export default function TransactionTable({ carregando, transacoesPaginadas, totalPaginas, paginaAtual, setPaginaAtual, setIsModalAberto, exportarPDF, prepararEdicao, setIdExclusaoConfirmar }) {
  
  // Formatação de data padrão BRL segura (Evita bugs de fuso horário)
  function formatarDataBRL(dataString) {
    if (!dataString) return '-';
    const partes = dataString.split('-');
    if (partes.length !== 3) return dataString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

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

  return (
    <section className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm w-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-2">
        <h2 className="font-bold text-xs md:text-sm">Histórico de Lançamentos</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setIsModalAberto(true)} className="flex items-center gap-1 bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
            <PlusCircle className="w-3.5 h-3.5" /> Novo Lançamento
          </button>
          <button type="button" onClick={exportarPDF} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* MODIFICADO: Só mostra tela vazia se NÃO estiver carregando e o array for zero */}
      {transacoesPaginadas.length === 0 && !carregando ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white">
          <div className="p-4 bg-neutral-50 rounded-2xl border border-gray-100 mb-3 text-neutral-400">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-neutral-700">Nenhum lançamento por aqui</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm font-medium leading-relaxed">
            Não encontramos transações cadastradas ou correspondentes aos filtros ativos neste período.
          </p>
          <button type="button" onClick={() => setIsModalAberto(true)} className="mt-4 flex items-center gap-1 bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors shadow-sm active:scale-95">
            <PlusCircle className="w-3.5 h-3.5" /> Cadastrar transação
          </button>
        </div>
      ) : (
        <>
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
                {/* MODIFICADO: Injeta linhas de esqueleto se "carregando" for true */}
                {carregando ? (
                  [1, 2, 3, 4].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-3.5">
                        <div className="h-3.5 bg-neutral-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-neutral-100 rounded w-20"></div>
                      </td>
                      <td className="p-3.5">
                        <div className="h-4 bg-neutral-200 rounded w-44 mb-1"></div>
                        <div className="h-3 bg-neutral-100 rounded w-28"></div>
                      </td>
                      <td className="p-3.5">
                        <div className="h-4 bg-neutral-200 rounded w-16"></div>
                      </td>
                      <td className="p-3.5">
                        <div className="h-4 bg-neutral-200 rounded w-10 mx-auto"></div>
                      </td>
                      <td className="p-3.5">
                        <div className="h-6 bg-neutral-100 rounded-lg w-14 mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  transacoesPaginadas.map((t) => {
                    const alertaVencimento = verificarStatusVencimento(t.data_vencimento, t.status);
                    return (
                      <tr key={t.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-3.5 whitespace-nowrap text-neutral-500">
                          <div className="font-bold text-xs text-neutral-700">{formatarDataBRL(t.data)}</div>
                          {t.data_vencimento && <div className="text-xs font-semibold text-neutral-400 mt-0.5">Validade: {formatarDataBRL(t.data_vencimento)}</div>}
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
                          {t.tipo === 'Entrada' ? '+ ' : '- '}R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                            <button type="button" onClick={() => prepararEdicao(t)} className="p-1.5 bg-neutral-50 rounded-lg border border-gray-200 hover:bg-neutral-100 text-neutral-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => setIdExclusaoConfirmar(t.id)} className="p-1.5 bg-neutral-50 rounded-lg border border-gray-200 hover:bg-neutral-100 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MODIFICADO: Esconde a paginação visual enquanto carrega os dados novos */}
          {!carregando && (
            <div className="p-3 bg-neutral-50 border-t border-gray-100 flex items-center justify-between text-neutral-500 text-xs">
              <span>Página <b>{paginaAtual}</b> de {totalPaginas}</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => p - 1)} className="p-1 border border-gray-200 bg-white rounded-lg disabled:opacity-40 hover:bg-neutral-50"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button type="button" disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(p => p + 1)} className="p-1 border border-gray-200 bg-white rounded-lg disabled:opacity-40 hover:bg-neutral-50"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}