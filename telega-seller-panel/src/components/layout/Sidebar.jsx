import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Tag,
  Bot
} from 'lucide-react';

const navigation = [
  {
    name: 'Главная',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Магазины',
    href: '/stores',
    icon: Store,
    children: [
      { name: 'Все магазины', href: '/stores' },
      { name: 'Создать магазин', href: '/stores/create' },
    ]
  },
  {
    name: 'Товары',
    icon: Package,
    children: [
      { name: 'Все товары', href: '/products' },
      { name: 'Добавить товар', href: '/products/create' },
    ]
  },
  {
    name: 'Категории',
    href: '/categories',
    icon: Tag,
  },
  {
    name: 'Заказы',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    name: 'Клиенты',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Telegram Боты',
    href: '/bots',
    icon: Bot,
  },
  {
    name: 'Аналитика',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Настройки',
    href: '/settings',
    icon: Settings,
  },
];

export default function Sidebar({ open, setOpen }) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpanded = (name) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const isActive = (href) => {
    if (href === '/dashboard' && location.pathname === '/') return true;
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">Tele•Ga</h1>
                <p className="text-xs text-sidebar-foreground/60">Панель продавца</p>
              </div>
            </div>
            
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-sidebar-accent"
            >
              <X className="w-5 h-5 text-sidebar-foreground" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      {expandedItems[item.name] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    {expandedItems[item.name] && (
                      <div className="mt-1 ml-8 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            className={cn(
                              "block px-3 py-2 text-sm rounded-lg transition-colors",
                              isActive(child.href)
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive(item.href)
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">П</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Продавец
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  seller@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

