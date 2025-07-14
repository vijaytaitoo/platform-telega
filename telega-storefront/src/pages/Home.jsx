import { useState, useEffect } from 'react';
import { ChevronRight, Zap, TrendingUp, Gift } from 'lucide-react';
import ProductCard from '../components/ProductCard';

// Mock data
const categories = [
  { id: 1, name: 'Электроника', icon: '📱', color: 'from-blue-500 to-cyan-500' },
  { id: 2, name: 'Одежда', icon: '👕', color: 'from-purple-500 to-pink-500' },
  { id: 3, name: 'Дом и сад', icon: '🏠', color: 'from-green-500 to-emerald-500' },
  { id: 4, name: 'Красота', icon: '💄', color: 'from-pink-500 to-rose-500' },
  { id: 5, name: 'Спорт', icon: '⚽', color: 'from-orange-500 to-red-500' },
  { id: 6, name: 'Книги', icon: '📚', color: 'from-indigo-500 to-purple-500' },
];

const banners = [
  {
    id: 1,
    title: 'Скидки до 70%',
    subtitle: 'На электронику и гаджеты',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop',
    color: 'from-purple-600 to-blue-600'
  },
  {
    id: 2,
    title: 'Новая коллекция',
    subtitle: 'Весенняя мода 2024',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
    color: 'from-pink-600 to-purple-600'
  },
];

const featuredProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max 256GB',
    brand: 'Apple',
    price: 15500000,
    originalPrice: 17000000,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
    rating: 4.8,
    reviewCount: 1247,
    freeDelivery: true
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    price: 14200000,
    originalPrice: 15800000,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
    rating: 4.7,
    reviewCount: 892,
    freeDelivery: true
  },
  {
    id: 3,
    name: 'MacBook Air M2 13"',
    brand: 'Apple',
    price: 18900000,
    originalPrice: 21000000,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
    rating: 4.9,
    reviewCount: 634,
    freeDelivery: true
  },
  {
    id: 4,
    name: 'Sony WH-1000XM5',
    brand: 'Sony',
    price: 4500000,
    originalPrice: 5200000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    rating: 4.6,
    reviewCount: 1156,
    freeDelivery: false
  },
  {
    id: 5,
    name: 'Nike Air Max 270',
    brand: 'Nike',
    price: 1890000,
    originalPrice: 2100000,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    rating: 4.5,
    reviewCount: 743,
    freeDelivery: true
  },
  {
    id: 6,
    name: 'Adidas Ultraboost 22',
    brand: 'Adidas',
    price: 2100000,
    originalPrice: 2400000,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    rating: 4.4,
    reviewCount: 567,
    freeDelivery: true
  }
];

export default function Home() {
  const [currentBanner, setCurrentBanner] = useState(0);

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="relative h-64 md:h-80 rounded-2xl overflow-hidden mx-4 md:mx-6">
        <div className="relative w-full h-full">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentBanner ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} opacity-90`} />
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                <div>
                  <h1 className="text-3xl md:text-5xl font-bold mb-2">{banner.title}</h1>
                  <p className="text-lg md:text-xl opacity-90">{banner.subtitle}</p>
                  <button className="mt-6 bg-white text-gray-900 px-8 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors">
                    Смотреть все
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Banner indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentBanner ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Категории</h2>
          <a href="/catalog" className="flex items-center text-purple-400 hover:text-purple-300 transition-colors">
            Все категории
            <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/catalog/${category.name.toLowerCase()}`}
              className="group"
            >
              <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:scale-105">
                <div className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="font-medium text-sm group-hover:text-purple-400 transition-colors">
                  {category.name}
                </h3>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Special Offers */}
      <section className="px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-6 text-white">
            <Zap className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-bold mb-2">Молниеносные скидки</h3>
            <p className="text-sm opacity-90">До 80% на избранные товары</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
            <TrendingUp className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-bold mb-2">Хиты продаж</h3>
            <p className="text-sm opacity-90">Самые популярные товары</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
            <Gift className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-bold mb-2">Подарки</h3>
            <p className="text-sm opacity-90">Бесплатная доставка от 500,000 сум</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Рекомендуем</h2>
          <a href="/catalog" className="flex items-center text-purple-400 hover:text-purple-300 transition-colors">
            Все товары
            <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </div>

        <div className="product-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-4 md:px-6">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Подпишитесь на новости</h2>
          <p className="text-lg opacity-90 mb-6">
            Получайте уведомления о скидках и новых поступлениях
          </p>
          <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Ваш email"
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder:text-gray-500"
            />
            <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors">
              Подписаться
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

