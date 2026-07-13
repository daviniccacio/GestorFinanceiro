import { useState } from 'react';

const CATEGORIAS_PADRAO = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Renda', 'Transferência', 'Contas', 'Investimentos', 'Outros'];

export default function TransactionModal({
  editandoId,
  limparFormulario,
  salvarLancamento,
  data,
  setData,
  dataVencimento,
  setDataVencimento,
  descricao,
  setDescricao,
  dadosPagamento,
  setDadosPagamento,
  valorMascara,
  setValorMascara,
  category,
  setCategoria,
  tipo,
  setTipo,
  status,
  setStatus,
  repetir,
  setRepetir,
  tipoRepeticao, 
  setTipoRepeticao,
  numeroParcelas, 
  setNumeroParcelas
}) {
  const [modoTexto, setModoTexto] = useState(() => {
    return category && !CATEGORIAS_PADRAO.includes(category);
  });

  const formatarMoeda = (valor) => {
    let apenasDigitos = valor.replace(/\D/g, "");
    if (!apenasDigitos) return "";
    let valorComDecimais = (Number(apenasDigitos) / 100).toFixed(2);
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valorComDecimais);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      {/* 📐 MUDANÇA AQUI: Alterado de max-w-md para max-w-2xl para alargar o modal */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-gray-150 dark:border-zinc-800 text-gray-950 dark:text-zinc-50 transition-colors duration-200">
        
        <h2 className="text-xl font-bold mb-5 text-gray-950 dark:text-zinc-100">
          {editandoId ? '📝 Editar Lançamento' : '✨ Nova Transação'}
        </h2>

        <form onSubmit={salvarLancamento} className="space-y-4">
          
          {/* 📐 GRID SISTEMA: Base de 6 colunas no desktop (md:) e 1 coluna no mobile */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            
            {/* Campo: Descrição (Ocupa 4 colunas) */}
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>

            {/* Campo: Valor (Ocupa 2 colunas) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Valor (R$)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={valorMascara}
                onChange={(e) => {
                  const valorFormatado = formatarMoeda(e.target.value);
                  setValorMascara(valorFormatado);
                }}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-500"
                required
              />
            </div>

            {/* Campo: Categoria (Ocupa 3 colunas) */}
            <div className="md:col-span-3">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Categoria
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setModoTexto(!modoTexto);
                    setCategoria(""); 
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {modoTexto ? "📋 Ver Lista" : "➕ Nova Categoria"}
                </button>
              </div>

              {modoTexto ? (
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Nome da nova categoria"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                  autoFocus
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {CATEGORIAS_PADRAO.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Campo: Dados de Pagamento (Ocupa 3 colunas) */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Dados de Pagamento (Opcional)
              </label>
              <input
                type="text"
                value={dadosPagamento}
                onChange={(e) => setDadosPagamento(e.target.value)}
                placeholder="Chave Pix, Conta, Banco..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 placeholder:text-gray-500"
              />
            </div>

            {/* Campo: Data do Lançamento (Ocupa 3 colunas) */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Data do Lançamento
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 cursor-pointer"
                required
              />
            </div>

            {/* Campo: Data de Vencimento (Ocupa 3 colunas) */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 cursor-pointer"
              />
            </div>

            {/* Campo: Tipo (Ocupa 3 colunas) */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 cursor-pointer"
                required
              >
                <option value="Entrada">📈 Entrada</option>
                <option value="Saída">📉 Saída</option>
              </select>
            </div>

            {/* Campo: Status (Ocupa 3 colunas) */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 cursor-pointer"
                required
              >
                <option value="Pago">✅ Pago / Recebido</option>
                <option value="Pendente">⏳ Pendente</option>
              </select>
            </div>

            {/* Seção Completa: Repetição e Parcelamento (Ocupa a largura total: 6 colunas) */}
            {!editandoId && (
              <div className="md:col-span-6 bg-gray-50 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl space-y-3 mt-1">
                <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={repetir}
                    onChange={(e) => setRepetir(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-zinc-700 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Repetir lançamento / Parcelamento</span>
                </label>

                {repetir && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-dashed border-gray-200 dark:border-zinc-700">
                    {/* Alternador de Frequência */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">Frequência</label>
                      <div className="flex bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 p-1 rounded-lg gap-1">
                        <button
                          type="button"
                          onClick={() => setTipoRepeticao('fixo')}
                          className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all cursor-pointer ${
                            tipoRepeticao === 'fixo'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-150 dark:hover:bg-zinc-700'
                          }`}
                        >
                          Fixo Mensal
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoRepeticao('parcelado')}
                          className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all cursor-pointer ${
                            tipoRepeticao === 'parcelado'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-150 dark:hover:bg-zinc-700'
                          }`}
                        >
                          Parcelado
                        </button>
                      </div>
                    </div>

                    {/* Detalhes de Parcelas / Informativo */}
                    {tipoRepeticao === 'parcelado' ? (
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">Nº de Parcelas</label>
                        <input
                          type="number"
                          min="2"
                          max="72"
                          value={numeroParcelas}
                          onChange={(e) => setNumeroParcelas(Math.max(2, Number(e.target.value)))}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-center px-2 text-xs font-medium text-gray-500 dark:text-zinc-400 bg-gray-100/50 dark:bg-zinc-800/50 rounded-lg border border-gray-200/50 dark:border-zinc-700/50 mt-4 sm:mt-0">
                        Lança automaticamente este valor para os próximos 12 meses.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={limparFormulario}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-150 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all cursor-pointer"
            >
              {editandoId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}