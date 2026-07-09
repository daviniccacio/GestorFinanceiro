import { LayoutDashboard, ReceiptText, LogOut, Wallet, Sun, Moon } from 'lucide-react';

export default function Sidebar({ abaAtiva, setAbaAtiva, lidarComLogout, dark, setDark }) {
  const menus = [
    { id: 'dashboard', nome: 'Resumo / Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'lancamentos', nome: 'Lançamentos', icon: <ReceiptText className="w-4 h-4" /> }
  ];

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200/80 dark:border-zinc-800 h-screen sticky top-0 flex flex-col justify-between p-5 select-none hidden md:flex transition-colors duration-200">
      <div>
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="p-2 bg-blue-500 rounded-xl text-white shadow-xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-zinc-100 leading-none">Gestor Financeiro</h1>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">Controle Interno</span>
          </div>
        </div>

        <nav className="space-y-1">
          {menus.map((menu) => {
            const isActive = abaAtiva === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => setAbaAtiva(menu.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-zinc-100'
                }`}
              >
                {menu.icon}
                {menu.nome}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-200 dark:border-zinc-800 pt-4 space-y-1 ">
        
        {/* BOTÃO DE SOL / LUA LOGO ACIMA DO BOTÃO DE LOGOUT */}
        <button
          type="button"
          onClick={() => setDark(!dark)}
          className="w-full flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-500 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-zinc-100 transition-all cursor-pointer"
        >
          {dark ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>Modo Escuro</span>
            </>
          )}
        </button>

        {/* BOTÃO DE SAIR DA CONTA */}
        <button
          onClick={lidarComLogout}
          className="w-full flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </button>
      </div>
    </aside>
  );
}