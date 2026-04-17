import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Briefcase, X, Upload, MapPin, Tag, DollarSign, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { marketplaceApi } from '../lib/api';
import { toast } from 'sonner';

const CreateProductPage = () => {
  const navigate = useNavigate();
  const [listingType, setListingType] = useState('product');
  const [categories, setCategories] = useState({ products: [], services: [] });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_range: '',
    category: '',
    images: [''],
    location: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await marketplaceApi.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      if (listingType === 'product') {
        await marketplaceApi.createProduct({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          category: formData.category,
          images: formData.images.filter(img => img),
          location: formData.location
        });
        toast.success('Produit ajouté au marché !');
      } else {
        await marketplaceApi.createService({
          title: formData.title,
          description: formData.description,
          price_range: formData.price_range,
          category: formData.category,
          images: formData.images.filter(img => img),
          location: formData.location
        });
        toast.success('Service ajouté au marché !');
      }
      navigate('/marketplace');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const addImageField = () => {
    if (formData.images.length < 5) {
      setFormData({ ...formData, images: [...formData.images, ''] });
    }
  };

  const updateImage = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages.length ? newImages : [''] });
  };

  const currentCategories = listingType === 'product' ? categories.products : categories.services;

  // Demo images
  const demoImages = [
    'https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=400',
    'https://images.unsplash.com/photo-1690228987673-f6e104fa653c?w=400',
    'https://images.unsplash.com/photo-1663018084454-86fd8150f950?w=400'
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif text-[#2F2F31]">Vendre</h1>
          <Button 
            variant="ghost"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Listing Type Toggle */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => setListingType('product')}
            data-testid="listing-type-product"
            className={`p-4 rounded-2xl flex items-center gap-3 transition-all ${
              listingType === 'product'
                ? 'bg-[#00899B] text-white'
                : 'bg-white text-[#2F2F31] hover:bg-[#F5E6D3]'
            }`}
          >
            <Package size={24} />
            <div className="text-left">
              <p className="font-medium">Produit</p>
              <p className={`text-xs ${listingType === 'product' ? 'text-white/70' : 'text-gray-500'}`}>
                Vendre un article
              </p>
            </div>
          </button>
          <button
            onClick={() => setListingType('service')}
            data-testid="listing-type-service"
            className={`p-4 rounded-2xl flex items-center gap-3 transition-all ${
              listingType === 'service'
                ? 'bg-[#00899B] text-white'
                : 'bg-white text-[#2F2F31] hover:bg-[#F5E6D3]'
            }`}
          >
            <Briefcase size={24} />
            <div className="text-left">
              <p className="font-medium">Service</p>
              <p className={`text-xs ${listingType === 'service' ? 'text-white/70' : 'text-gray-500'}`}>
                Proposer un service
              </p>
            </div>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-3">
            <Label className="text-[#2F2F31]">Titre *</Label>
            <Input
              data-testid="listing-title"
              placeholder={listingType === 'product' ? 'Ex: Collier perles de Tahiti' : 'Ex: Cours de Ori Tahiti'}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="py-6 rounded-xl"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label className="text-[#2F2F31]">Description</Label>
            <Textarea
              data-testid="listing-description"
              placeholder="Décrivez votre produit ou service..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[100px] rounded-xl resize-none"
            />
          </div>

          {/* Price */}
          <div className="space-y-3">
            <Label className="text-[#2F2F31]">
              {listingType === 'product' ? 'Prix (XPF) *' : 'Fourchette de prix'}
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                data-testid="listing-price"
                type={listingType === 'product' ? 'number' : 'text'}
                placeholder={listingType === 'product' ? '5000' : 'Ex: 3 000 - 5 000 XPF'}
                value={listingType === 'product' ? formData.price : formData.price_range}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  [listingType === 'product' ? 'price' : 'price_range']: e.target.value 
                })}
                className="pl-12 py-6 rounded-xl"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label className="text-[#2F2F31]">Catégorie *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger data-testid="listing-category" className="py-6 rounded-xl">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {currentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Images */}
          <div className="space-y-3">
            <Label className="text-[#2F2F31]">Images</Label>
            {formData.images.map((url, index) => (
              <div key={index} className="flex gap-2">
                <div className="relative flex-1">
                  <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    data-testid={`image-url-${index}`}
                    placeholder="URL de l'image"
                    value={url}
                    onChange={(e) => updateImage(index, e.target.value)}
                    className="pl-12 py-6 rounded-xl"
                  />
                </div>
                {formData.images.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeImage(index)}
                    className="text-red-500"
                  >
                    <X size={20} />
                  </Button>
                )}
              </div>
            ))}
            
            {/* Quick Select Demo Images */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {demoImages.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateImage(0, url)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-[#00899B] transition-all"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            
            {formData.images.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={addImageField}
                className="w-full rounded-xl"
              >
                <Plus size={18} className="mr-2" />
                Ajouter une image
              </Button>
            )}
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label className="text-[#2F2F31]">Localisation</Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                data-testid="listing-location"
                placeholder="Ex: Papeete, Tahiti"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="pl-12 py-6 rounded-xl"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            data-testid="create-listing-btn"
            disabled={loading}
            className="w-full py-6 rounded-xl bg-[#00899B] hover:bg-[#007585] text-white font-medium"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Publier l'annonce</>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProductPage;
