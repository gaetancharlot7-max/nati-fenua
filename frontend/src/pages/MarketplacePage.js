import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MapPin, Star, Plus, ShoppingBag, Briefcase, Package, Utensils, Compass, Sparkles, Gem, Droplet, Shirt, Home, Calendar, Car, Book, X, MessageCircle, Phone, Heart, Share2, ImagePlus, Loader2, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { marketplaceApi, uploadApi } from '../lib/api';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ShareModal } from '../components/ShareModal';
import { ReportModal } from '../components/ReportModal';
import { toast } from 'sonner';

// Product Detail Modal Component
const ProductDetailModal = ({ product, onClose, onReport }) => {
  if (!product) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header Image */}
        <div className="relative aspect-video">
          <img 
            src={product.images?.[0]} 
            alt={product.title}
            className="w-full h-full object-cover"
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <X size={20} />
          </button>
          <button className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Heart size={20} />
          </button>
          <button 
            onClick={() => onReport(product)}
            className="absolute top-4 left-16 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <Flag size={18} className="text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">{product.title}</h2>
              <p className="text-3xl font-bold text-[#FF6B35]">
                {product.price?.toLocaleString()} {product.currency || 'XPF'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <MapPin size={16} />
            <span>{product.location}</span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-[#1A1A2E] mb-2">Description</h3>
            <p className="text-gray-600">
              {product.description || 'Produit local authentique de Polynésie Française. Contactez le vendeur pour plus d\'informations.'}
            </p>
          </div>

          {/* Seller Info */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-[#1A1A2E] mb-3">Vendeur</h3>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={product.seller?.picture} />
                <AvatarFallback className="bg-[#FF6B35] text-white">{product.seller?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{product.seller?.name}</p>
                <p className="text-sm text-gray-500">{product.location}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1 bg-[#FF6B35] hover:bg-[#FF5722] rounded-xl py-6">
              <MessageCircle size={20} className="mr-2" />
              Contacter
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl py-6 border-[#FF6B35] text-[#FF6B35]">
              <Phone size={20} className="mr-2" />
              Appeler
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Service Detail Modal Component
const ServiceDetailModal = ({ service, onClose, onReport }) => {
  if (!service) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header Image */}
        <div className="relative aspect-video">
          <img 
            src={service.images?.[0]} 
            alt={service.title}
            className="w-full h-full object-cover"
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <X size={20} />
          </button>
          <button 
            onClick={() => onReport(service)}
            className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <Flag size={18} className="text-red-500" />
          </button>
          {service.rating && (
            <div className="absolute top-4 left-16 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm flex items-center gap-1">
              <Star size={16} className="text-[#E97C07] fill-[#E97C07]" />
              <span className="font-semibold">{service.rating}</span>
              <span className="text-gray-500 text-sm">({service.reviews_count} avis)</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">{service.title}</h2>
          <p className="text-2xl font-bold text-[#FF6B35] mb-4">{service.price_range}</p>

          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <MapPin size={16} />
            <span>{service.location}</span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-[#1A1A2E] mb-2">À propos du service</h3>
            <p className="text-gray-600">
              {service.description || 'Service professionnel en Polynésie Française. Contactez le prestataire pour réserver ou obtenir plus d\'informations.'}
            </p>
          </div>

          {/* Provider Info */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-[#1A1A2E] mb-3">Prestataire</h3>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={service.provider?.picture} />
                <AvatarFallback className="bg-[#00CED1] text-white">{service.provider?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{service.provider?.name}</p>
                <p className="text-sm text-gray-500">{service.location}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1 bg-[#00CED1] hover:bg-[#00B5B5] rounded-xl py-6">
              <Calendar size={20} className="mr-2" />
              Réserver
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl py-6 border-[#00CED1] text-[#00CED1]">
              <MessageCircle size={20} className="mr-2" />
              Contacter
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [reportItem, setReportItem] = useState(null);

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
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover cursor-pointer"
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
                  <p className="text-[#FF6B35] font-bold text-lg mb-2">
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
                onClick={() => setSelectedService(service)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover cursor-pointer"
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
                  <p className="text-[#00CED1] font-bold mb-2">
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

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onReport={(item) => {
              setSelectedProduct(null);
              setReportItem({ ...item, type: 'product' });
            }}
          />
        )}
      </AnimatePresence>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {selectedService && (
          <ServiceDetailModal 
            service={selectedService} 
            onClose={() => setSelectedService(null)} 
            onReport={(item) => {
              setSelectedService(null);
              setReportItem({ ...item, type: 'service' });
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreateProduct && (
          <CreateProductModal 
            onClose={() => setShowCreateProduct(false)} 
            onSuccess={() => {
              setShowCreateProduct(false);
              loadMarketplace();
              toast.success('Annonce publiée !');
            }}
          />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        url={shareItem ? `${window.location.origin}/marketplace/${shareItem.product_id || shareItem.service_id}` : ''}
        title={shareItem?.title || 'Découvrez cette annonce sur Fenua Social'}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={!!reportItem}
        onClose={() => setReportItem(null)}
        contentType={reportItem?.type === 'service' ? 'service' : 'product'}
        contentId={reportItem?.product_id || reportItem?.service_id}
        contentPreview={reportItem?.title}
      />

      {/* FAB - Create Listing */}
      <button
        onClick={() => setShowCreateProduct(true)}
        data-testid="create-listing-fab"
        className="fab bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

// Create Product Modal with File Upload
const CreateProductModal = ({ onClose, onSuccess }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'autre',
    location: '',
    images: []
  });

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      try {
        const response = await uploadApi.uploadFile(file);
        if (response.data.success) {
          uploadedUrls.push(response.data.url);
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls]
    }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price || formData.images.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await marketplaceApi.createProduct({
        ...formData,
        price: parseInt(formData.price)
      });
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la création de l\'annonce');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Nouvelle Annonce</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="flex flex-wrap gap-2">
                {formData.images.map((url, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        images: prev.images.filter((_, idx) => idx !== i)
                      }))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#FF6B35] transition-colors"
                >
                  {uploading ? (
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  ) : (
                    <ImagePlus size={24} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de votre annonce"
                className="rounded-xl"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix (XPF) *</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="10000"
                className="rounded-xl"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre produit..."
                className="w-full p-3 border rounded-xl min-h-[100px] focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Papeete, Tahiti"
                className="rounded-xl"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:from-[#FF5722] hover:to-[#E91E63] rounded-xl"
            >
              Publier l'annonce
            </Button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MarketplacePage;
