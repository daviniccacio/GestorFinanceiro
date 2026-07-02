import { PlusCircle, XCircle } from 'lucide-react';

export default function TransactionModal({ editandoId, limparFormulario, salvarLancamento, data, setData, dataVencimento, setDataVencimento, descricao, setDescricao, dadosPagamento, setDadosPagamento, valorMascara, setValorMascara, categoria, setCategoria, tipo, setTipo, status, setStatus }) {
  
  const lidarComMudancaValor = (e) => {
    let valorLimpo = e.target.value.replace(/\D/g, '');
    if (!valorLimpo) {
      setValorMascara('');
      return;
    }
    const valorNumerico = Number(valorLimpo) / 100;
    setValorMascara(valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="font-bold text-sm flex items-center gap-2 text-neutral-800">
            <PlusCircle className="w-4 h-4 text-blue-500" />
            {editandoId ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button type="button" onClick={limparFormulario} className="text-neutral-400 hover:text-neutral-600 transition-colors">
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
            <input type="text" placeholder="Chave Pix, código de barras..." className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700" value={dadosPagamento} onChange={(e) => setDadosPagamento(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Valor</label>
              <input type="text" required placeholder="R$ 0,00" className="w-full bg-neutral-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-neutral-700 font-semibold" value={valorMascara} onChange={lidarComMudancaValor} />
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
  );
}