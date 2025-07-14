import { X, Home, Package, Heart, ShoppingCart, User, Tag } from 'lucide-react';

const categories = [
  { name: 'Электроника', icon: Package, href: '/catalog/electronics' },
  { name: 'Одежда', icon: Tag, href: '/catalog/clothing' },
  { name: 'Дом и сад', icon: Home, href: '/catalog/home' },
  { name: 'Красота', icon: Heart, href: '/catalog/beauty' },
  { name: 'Спорт', icon: Package, href: '/catalog/sport' },
];

export default function MobileNav({ open, onClose }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-80 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:hidden
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Tele•Ga
                </h1>
                <p className="text-xs text-muted-foreground">Интернет-магазин</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <a
              href="/"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
              onClick={onClose}
            >
              <Home className="w-5 h-5 text-purple-400" />
              <span>Главная</span>
            </a>

            <div className="py-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-3">
                Категории
              </h3>
              {categories.map((category) => (
                <a
                  key={category.name}
                  href={category.href}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  onClick={onClose}
                >
                  <category.icon className="w-5 h-5 text-blue-400" />
                  <span>{category.name}</span>
                </a>
              ))}
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <a
                href="/favorites"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={onClose}
              >
                <Heart className="w-5 h-5 text-red-400" />
                <span>Избранное</span>
              </a>

              <a
                href="/cart"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={onClose}
              >
                <ShoppingCart className="w-5 h-5 text-green-400" />
                <span>Корзина</span>
              </a>

              <a
                href="/profile"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={onClose}
              >
                <User className="w-5 h-5 text-orange-400" />
                <span>Профиль</span>
              </a>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-center text-sm text-muted-foreground">
              © 2024 Tele•Ga
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

