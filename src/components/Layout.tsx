import { Link, Outlet, useLocation } from 'react-router-dom';
import { Scroll, PenTool, Eye, Hammer, Home } from 'lucide-react';
import { clsx } from 'clsx';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: '大明宫 (Dashboard)' },
    { path: '/zhongshu', icon: PenTool, label: '中书省 (拟旨)' },
    { path: '/menxia', icon: Eye, label: '门下省 (审核)' },
    { path: '/shangshu', icon: Hammer, label: '尚书省 (执行)' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-imperial-yellow border-b-4 md:border-b-0 md:border-r-4 border-imperial-black flex flex-col z-10">
        <div className="p-6 border-b-4 border-imperial-black bg-imperial-red text-white">
          <h1 className="font-display text-3xl tracking-wider flex items-center gap-2">
            <Scroll className="w-8 h-8" />
            御旨督办
          </h1>
          <p className="text-sm mt-2 font-bold opacity-90">IMPERIAL TASKMASTER</p>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 p-3 border-4 border-imperial-black font-bold text-lg transition-all",
                  isActive 
                    ? "bg-imperial-cyan translate-x-2 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]" 
                    : "bg-white hover:bg-gray-100 hover:translate-x-1 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                )}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t-4 border-imperial-black bg-white">
          <div className="text-xs font-bold text-center">
            天命昭昭 · 奉天承运
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
