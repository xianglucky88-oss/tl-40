import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Trophy,
  Settings,
  HelpCircle,
  Menu,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbMap: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  '/': { label: '仪表盘', icon: Home },
  '/teams': { label: '参赛队伍' },
  '/judges': { label: '评委管理' },
  '/topics': { label: '辩题库' },
  '/tournament': { label: '赛程安排' },
  '/live': { label: '实时计时' },
  '/scoring': { label: '评分中心' },
  '/ranking': { label: '排名榜' },
};

interface TopNavProps {
  onMobileMenu: () => void;
}

export default function TopNav({ onMobileMenu }: TopNavProps) {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const crumbs: { label: string; path: string; icon?: React.ComponentType<{ className?: string }> }[] = [
      { label: '首页', path: '/', icon: Home },
    ];

    const current = breadcrumbMap[location.pathname];
    if (current && location.pathname !== '/') {
      crumbs.push({ label: current.label, path: location.pathname });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 h-16 bg-ivory-50/80 backdrop-blur-xl border-b border-navy-100/80">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMobileMenu}
            className={cn(
              'md:hidden flex-shrink-0 w-10 h-10 rounded-lg',
              'flex items-center justify-center',
              'text-navy-600 hover:text-navy-900 hover:bg-navy-50',
              'transition-all duration-200',
            )}
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-1.5 text-sm font-sans min-w-0">
            {breadcrumbs.map((crumb, index) => {
              const Icon = crumb.icon;
              const isLast = index === breadcrumbs.length - 1;

              return (
                <div key={crumb.path + index} className="flex items-center gap-1.5 min-w-0">
                  <Link
                    to={crumb.path}
                    className={cn(
                      'flex items-center gap-1.5 transition-all duration-200',
                      'truncate max-w-[160px]',
                      isLast
                        ? 'text-navy-900 font-semibold font-serif'
                        : 'text-navy-500 hover:text-navy-700',
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                    <span className="truncate">{crumb.label}</span>
                  </Link>
                  {!isLast && (
                    <ChevronRight className="w-3.5 h-3.5 text-navy-300 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-navy/5 border border-navy-100">
            <Trophy className="w-4 h-4 text-gold-600 flex-shrink-0" />
            <span className="text-sm font-serif font-semibold text-navy-800 truncate max-w-[180px]">
              2026 春季冠军赛
            </span>
          </div>

          <button
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              'text-navy-500 hover:text-navy-900 hover:bg-navy-50',
              'transition-all duration-200 hover:shadow-sm',
            )}
            title="赛事设置"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>

          <button
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              'text-navy-500 hover:text-navy-900 hover:bg-navy-50',
              'transition-all duration-200 hover:shadow-sm',
            )}
            title="帮助中心"
          >
            <HelpCircle className="w-[18px] h-[18px]" />
          </button>

          <div className="w-px h-6 bg-navy-200 mx-1 hidden md:block" />

          <button
            className={cn(
              'flex items-center gap-2 pl-1 pr-3 h-10 rounded-full',
              'hover:bg-navy-50 transition-all duration-200',
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full',
                'bg-gradient-gold flex items-center justify-center',
                'text-white font-serif font-bold text-sm shadow-sm',
              )}
            >
              主
            </div>
            <span className="hidden lg:block text-sm font-medium text-navy-800">
              总裁判
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
