import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { formatPrice, calculateDiscount } from '../lib/utils';

export default function ProductCard({ product }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  const discount = product.originalPrice ? calculateDiscount(product.originalPrice, product.price) : 0;

  return (
    <div className="product-card group">
      <a href={`/product/${product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square bg-muted rounded-t-xl overflow-hidden">
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 z-10">
              <span className="discount-badge">-{discount}%</span>
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className={`absolute top-2 right-2 z-10 favorite-button ${
              isFavorite(product.id) ? 'text-red-400 bg-red-500/10 border-red-500/50' : ''
            }`}
          >
            <Heart 
              className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-current' : ''}`} 
            />
          </button>

          {/* Product Image */}
          <div className="relative w-full h-full">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 animate-pulse" />
            )}
            <img
              src={product.image}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </div>

          {/* Quick Add to Cart (appears on hover) */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleAddToCart}
              className="cart-button w-full text-sm"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              В корзину
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Brand */}
          {product.brand && (
            <div className="text-xs text-muted-foreground mb-1">
              {product.brand}
            </div>
          )}

          {/* Product Name */}
          <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-purple-400 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center space-x-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount || 0})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center space-x-2">
            <span className="price-tag text-lg">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Delivery Info */}
          {product.freeDelivery && (
            <div className="text-xs text-green-400 mt-1">
              Бесплатная доставка
            </div>
          )}
        </div>
      </a>
    </div>
  );
}

