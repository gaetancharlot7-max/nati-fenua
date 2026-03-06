import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Star, Plus, ShoppingBag, Briefcase, Package, Utensils, Compass, Sparkles, Gem, Droplet, Shirt, Home, Calendar, Car, Book } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { marketplaceApi } from '../lib/api';

// Icon mapping
const iconMap = {
  gem: Gem,
  palette: Sparkles,
  droplet: Droplet,
  shirt: Shirt,
  sparkles: Sparkles,
  utensils: Utensils,
  home: Home,
  package: Package,
  compass: Compass,
  calendar: Calendar,
  car: Car,
  book: Book,
  briefcase: Briefcase
};

// Demo products
const demoProducts = [
  {
    product_id: 'prod1',
    title: 'Collier Perles de Tahiti',
    price: 45000,
    currency: 'XPF',
    category: 'perles',
    images: ['https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=400'],
    location: 'Papeete',
    seller: { name: 'Perles Manava', picture: 'https://ui-avatars.com/api/?name=PM&background=00899B&color=fff' }
  },
  {
    product_id: 'prod2',
    title: 'Monoï Tiare Tahiti 100ml',
    price: 2500,
    currency: 'XPF',
    category: 'monoi',
    images: ['https://images.unsplash.com/photo-1690228987673-f6e104fa653c?w=400'],
    location: 'Moorea',
    seller: { name: 'Hei Poa', picture: 'https://ui-avatars.com/api/?name=HP&background=E97C07&color=fff' }
  },
  {
    product_id: 'prod3',
    title: 'Paréo traditionnel Tapa',
    price: 8000,
    currency: 'XPF',
    category: 'vetements',
    images: ['https://images.unsplash.com/photo-1746511299666-5ba663a2a5df?w=400'],
    location: 'Tahiti',
    seller: { name: 'Hinano Shop', picture: 'https://ui-avatars.com/api/?name=HS&background=64A7A1&color=fff' }
  },
  {
    product_id: 'prod4',
    title: 'Fruits tropicaux frais',
    price: 1500,
    currency: 'XPF',
    category: 'alimentaire',
    images: ['https://images.unsplash.com/photo-1663018084454-86fd8150f950?w=400'],
    location: 'Raiatea',
    seller: { name: 'Mahana Fruits', picture: 'https://ui-avatars.com/api/?name=MF&background=00899B&color=fff' }
  }
];

// Demo services
const demoServices = [
  {
    service_id: 'svc1',
    title: 'Excursion Lagon Privée',
    price_range: '15 000 - 30 000 XPF',
    category: 'tourisme',
    images: ['https://images.unsplash.com/photo-1703549068359-49d854524ddd?w=400'],
    location: 'Bora Bora',
    rating: 4.9,
    reviews_count: 128,
    provider: { name: 'Bora Tours', picture: 'https://ui-avatars.com/api/?name=BT&background=00899B&color=fff' }
  },
  {
    service_id: 'svc2',
    title: 'Massage Polynésien Traditionnel',
    price_range: '8 000 - 12 000 XPF',
    category: 'beaute',
    images: ['https://images.unsplash.com/photo-1690228987673-f6e104fa653c?w=400'],
    location: 'Moorea',
    rating: 4.8,
    reviews_count: 89,
    provider: { name: 'Spa Manea', picture: 'https://ui-avatars.com/api/?name=SM&background=E97C07&color=fff' }
  },
  {
    service_id: 'svc3',
    title: 'Cours de Ori Tahiti',
    price_range: '3 000 XPF / séance',
    category: 'cours',
    images: ['https://images.unsplash.com/photo-1746511299666-5ba663a2a5df?w=400'],
    location: 'Papeete',
    rating: 5.0,
    reviews_count: 45,
    provider: { name: 'Heiva Dance', picture: 'https://ui-avatars.com/api/?name=HD&background=64A7A1&color=fff' }
  }
];

const MarketplacePage = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState(demoProducts);
  const [services, setServices] = useState(demoServices);
  const [categories, setCategories] = useState({ products: [], services: [] });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    try {
      const [productsRes, servicesRes, categoriesRes] = await Promise.all([
        marketplaceApi.getProducts({ limit: 20 }),
        marketplaceApi.getServices({ limit: 20 }),
        marketplaceApi.getCategories()
      ]);
      
      if (productsRes.data.length > 0) setProducts(productsRes.data);
      if (servicesRes.data.length > 0) setServices(servicesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, currency = 'XPF') => {
    return `${price.toLocaleString()} ${currency}`;
  };

  const currentCategories = activeTab === 'products' ? categories.products : categories.services;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 safe-bottom">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif text-[#2F2F31] mb-2">Marketplace</h1>
        <p className="text-gray-600">Découvrez les trésors de notre Fenua</p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            data-testid="marketplace-search"
            placeholder="Rechercher produits, services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 rounded-xl border-gray-200 bg-white"
          />
        </div>
        <Button 
          variant="outline" 
          data-testid="filter-btn"
          className="px-4 rounded-xl border-gray-200"
        >
          <Filter size={20} />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-transparent gap-2 mb-6 p-0">
          <TabsTrigger 
            value="products"
            data-testid="products-tab"
            className="px-6 py-3 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white bg-white text-[#2F2F31] shadow-sm"
          >
            <ShoppingBag size={18} className="mr-2" />
            Produits
          </TabsTrigger>
          <TabsTrigger 
            value="services"
            data-testid="services-tab"
            className="px-6 py-3 rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white bg-white text-[#2F2F31] shadow-sm"
          >
            <Briefcase size={18} className="mr-2" />
            Services
          </TabsTrigger>
        </TabsList>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            data-testid="category-all"
            className={`category-pill ${selectedCategory === 'all' ? 'active' : 'bg-white text-[#2F2F31]'}`}
          >
            Tout
          </button>
          {currentCategories.map((cat) => {
            const IconComponent = iconMap[cat.icon] || Package;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                data-testid={`category-${cat.id}`}
                className={`category-pill flex items-center gap-2 ${selectedCategory === cat.id ? 'active' : 'bg-white text-[#2F2F31]'}`}
              >
                <IconComponent size={16} />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <TabsContent value="products">
          <div className="marketplace-grid">
            {products.map((product, index) => (
              <motion.div
                key={product.product_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                data-testid={`product-${product.product_id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover"
              >
                <div className="aspect-product relative">
                  <img 
                    src={product.images?.[0]} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-[#2F2F31] text-sm mb-1 line-clamp-2">{product.title}</h3>
                  <p className="text-[#00899B] font-bold text-lg mb-2">
                    {formatPrice(product.price, product.currency)}
                  </p>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <MapPin size={12} />
                    {product.location}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Services Grid */}
        <TabsContent value="services">
          <div className="marketplace-grid">
            {services.map((service, index) => (
              <motion.div
                key={service.service_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                data-testid={`service-${service.service_id}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover"
              >
                <div className="aspect-product relative">
                  <img 
                    src={service.images?.[0]} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  {service.rating && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm flex items-center gap-1">
                      <Star size={12} className="text-[#E97C07] fill-[#E97C07]" />
                      <span className="text-xs font-medium">{service.rating}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-[#2F2F31] text-sm mb-1 line-clamp-2">{service.title}</h3>
                  <p className="text-[#00899B] font-bold mb-2">
                    {service.price_range}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <MapPin size={12} />
                      {service.location}
                    </div>
                    {service.reviews_count && (
                      <span className="text-xs text-gray-400">({service.reviews_count} avis)</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* FAB - Create Listing */}
      <Link 
        to="/create-product"
        data-testid="create-listing-fab"
        className="fab bg-[#00899B] text-white"
      >
        <Plus size={28} />
      </Link>
    </div>
  );
};

export default MarketplacePage;
