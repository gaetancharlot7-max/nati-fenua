import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, MapPin, Clock, Phone, CreditCard, Camera, Plus, X,
  Star, Users, Bell, Check, Edit2, Trash2, AlertCircle, 
  DollarSign, Loader2, Power, PowerOff, Timer, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import api from '../lib/api';
import { Link } from 'react-router-dom';

const VendorDashboardPage = () => {
  const { user } = useAuth();
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [openingStatus, setOpeningStatus] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cuisineRes, paymentRes] = await Promise.all([
        api.get('/roulotte/cuisine-types'),
        api.get('/roulotte/payment-methods')
      ]);
      
      setCuisineTypes(cuisineRes.data);
      setPaymentMethods(paymentRes.data);
      
      // Try to load vendor profile
      try {
        const profileRes = await api.get('/roulotte/profile/me');
        setVendorProfile(profileRes.data);
      } catch (e) {
        // No vendor profile yet
        setVendorProfile(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoulotte = async () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non disponible');
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await api.post('/roulotte/open', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          
          setVendorProfile(prev => ({ ...prev, is_open: true }));
          setOpeningStatus({
            expires_at: response.data.expires_at,
            marker_id: response.data.marker_id
          });
          
          toast.success('🚚 Votre roulotte est maintenant visible sur Fenua Pulse !');
        } catch (error) {
          toast.error(error.response?.data?.detail || 'Erreur lors de l\'ouverture');
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        toast.error('Position GPS requise');
        setGettingLocation(false);
      }
    );
  };

  const handleCloseRoulotte = async () => {
    try {
      await api.post('/roulotte/close');
      setVendorProfile(prev => ({ ...prev, is_open: false }));
      setOpeningStatus(null);
      toast.success('Roulotte fermée');
    } catch (error) {
      toast.error('Erreur lors de la fermeture');
    }
  };

  const handleExtendOpening = async () => {
    try {
      await api.post('/roulotte/extend', { hours: 2 });
      toast.success('Ouverture prolongée de 2 heures !');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No vendor profile yet
  if (!vendorProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Truck size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Devenir vendeur</h1>
          <p className="text-gray-500">
            Créez votre profil vendeur et apparaissez sur Fenua Pulse !
          </p>
        </div>

        <Button
          onClick={() => setShowCreateProfile(true)}
          className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-2xl h-14 text-lg"
        >
          <Plus size={24} className="mr-2" />
          Créer mon profil vendeur
        </Button>

        <div className="mt-8 space-y-4">
          <div className="p-4 bg-white rounded-2xl shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <MapPin className="text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A1A2E]">Soyez visible</h3>
              <p className="text-sm text-gray-500">Apparaissez sur la carte Fenua Pulse quand vous êtes ouvert</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Bell className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A1A2E]">Notifiez vos clients</h3>
              <p className="text-sm text-gray-500">Vos abonnés reçoivent une notification quand vous ouvrez</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Star className="text-yellow-500" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A1A2E]">Collectez des avis</h3>
              <p className="text-sm text-gray-500">Obtenez le badge "Coup de cœur du Fenua" avec 4.5+ étoiles</p>
            </div>
          </div>
        </div>

        {/* Create Profile Modal */}
        <CreateVendorProfileModal
          isOpen={showCreateProfile}
          onClose={() => setShowCreateProfile(false)}
          cuisineTypes={cuisineTypes}
          paymentMethods={paymentMethods}
          onSuccess={() => {
            loadData();
            setShowCreateProfile(false);
          }}
        />
      </div>
    );
  }

  // Vendor Dashboard
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Ma Roulotte</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCreateProfile(true)}
          className="rounded-xl"
        >
          <Edit2 size={20} />
        </Button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-6">
        {vendorProfile.photo_url ? (
          <img 
            src={vendorProfile.photo_url} 
            alt={vendorProfile.name}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center">
            <Truck size={60} className="text-white" />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A2E]">{vendorProfile.name}</h2>
              <p className="text-gray-500 text-sm">{vendorProfile.description}</p>
            </div>
            
            {vendorProfile.is_coup_coeur && (
              <div className="px-3 py-1 bg-pink-100 rounded-full flex items-center gap-1">
                <span>💖</span>
                <span className="text-xs font-bold text-pink-600">Coup de cœur</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1">
              <Star className="text-yellow-400" fill="#FACC15" size={18} />
              <span className="font-bold">{vendorProfile.rating_avg?.toFixed(1) || '0.0'}</span>
              <span className="text-gray-400 text-sm">({vendorProfile.rating_count || 0})</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={18} className="text-gray-400" />
              <span className="text-gray-600">{vendorProfile.subscriber_count || 0} abonnés</span>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {vendorProfile.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={16} />
                {vendorProfile.phone}
              </div>
            )}
            {vendorProfile.usual_hours && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                {vendorProfile.usual_hours}
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(vendorProfile.payment_methods || []).map(method => {
              const pm = paymentMethods.find(p => p.id === method);
              return (
                <span key={method} className="px-2 py-1 bg-gray-100 rounded-lg text-sm">
                  {pm?.icon} {pm?.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Open/Close Button */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
        {vendorProfile.is_open ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Power size={24} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-green-700">Vous êtes ouvert !</p>
                <p className="text-sm text-green-600">Visible sur Fenua Pulse</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleExtendOpening}
                variant="outline"
                className="flex-1 rounded-xl"
              >
                <Timer size={18} className="mr-2" />
                +2 heures
              </Button>
              <Button
                onClick={handleCloseRoulotte}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
              >
                <PowerOff size={18} className="mr-2" />
                Je ferme
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleOpenRoulotte}
            disabled={gettingLocation}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-lg"
          >
            {gettingLocation ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <Power size={24} className="mr-3" />
                Je suis ouvert maintenant !
              </>
            )}
          </Button>
        )}
      </div>

      {/* Menu Section */}
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1A1A2E]">Mon Menu</h3>
          <Button
            onClick={() => setShowAddMenuItem(true)}
            size="icon"
            className="rounded-xl bg-[#FF6B35]"
          >
            <Plus size={20} />
          </Button>
        </div>

        {(vendorProfile.menu_items || []).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign size={40} className="mx-auto mb-2 text-gray-300" />
            <p>Aucun plat dans le menu</p>
            <p className="text-sm">Ajoutez vos plats pour les afficher aux clients</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendorProfile.menu_items.map(item => (
              <MenuItem 
                key={item.item_id} 
                item={item} 
                onDelete={async () => {
                  try {
                    await api.delete(`/roulotte/menu/${item.item_id}`);
                    loadData();
                    toast.success('Plat supprimé');
                  } catch (e) {
                    toast.error('Erreur');
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Reviews */}
      {vendorProfile.recent_reviews?.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm p-6 mt-6">
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-4">Derniers avis</h3>
          <div className="space-y-4">
            {vendorProfile.recent_reviews.map(review => (
              <div key={review.review_id} className="flex gap-3">
                <Avatar className="w-10 h-10 rounded-xl">
                  <AvatarImage src={review.user?.picture} className="rounded-xl" />
                  <AvatarFallback className="bg-[#FF6B35] text-white rounded-xl">
                    {review.user?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.user?.name}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'}
                          fill={i < review.rating ? '#FACC15' : 'none'}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateVendorProfileModal
        isOpen={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        cuisineTypes={cuisineTypes}
        paymentMethods={paymentMethods}
        initialData={vendorProfile}
        onSuccess={() => {
          loadData();
          setShowCreateProfile(false);
        }}
      />

      <AddMenuItemModal
        isOpen={showAddMenuItem}
        onClose={() => setShowAddMenuItem(false)}
        onSuccess={() => {
          loadData();
          setShowAddMenuItem(false);
        }}
      />
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ item, onDelete }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
    {item.photo_url ? (
      <img src={item.photo_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
    ) : (
      <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center">
        <DollarSign className="text-gray-400" />
      </div>
    )}
    <div className="flex-1">
      <p className="font-medium text-[#1A1A2E]">{item.name}</p>
      {item.description && (
        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
      )}
    </div>
    <div className="text-right">
      <p className="font-bold text-[#FF6B35]">{item.price?.toLocaleString()} XPF</p>
      <button onClick={onDelete} className="text-red-500 text-sm mt-1">
        Supprimer
      </button>
    </div>
  </div>
);

// Create/Edit Vendor Profile Modal
const CreateVendorProfileModal = ({ isOpen, onClose, cuisineTypes, paymentMethods, initialData, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    cuisine_type: initialData?.cuisine_type || '',
    phone: initialData?.phone || '',
    usual_hours: initialData?.usual_hours || '',
    usual_location: initialData?.usual_location || '',
    payment_methods: initialData?.payment_methods || ['cash']
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        cuisine_type: initialData.cuisine_type || '',
        phone: initialData.phone || '',
        usual_hours: initialData.usual_hours || '',
        usual_location: initialData.usual_location || '',
        payment_methods: initialData.payment_methods || ['cash']
      });
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.cuisine_type) {
      toast.error('Nom et type de cuisine requis');
      return;
    }

    setLoading(true);
    try {
      await api.post('/roulotte/profile', formData);
      toast.success(initialData ? 'Profil mis à jour !' : 'Profil créé !');
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = (methodId) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(methodId)
        ? prev.payment_methods.filter(m => m !== methodId)
        : [...prev.payment_methods, methodId]
    }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">{initialData ? 'Modifier' : 'Créer'} mon profil vendeur</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nom de la roulotte *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Chez Moemoe"
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Type de cuisine *</label>
            <select
              value={formData.cuisine_type}
              onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 p-3"
            >
              <option value="">Sélectionner...</option>
              {cuisineTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre roulotte..."
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Téléphone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="87 12 34 56"
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Horaires habituels</label>
            <Input
              value={formData.usual_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, usual_hours: e.target.value }))}
              placeholder="Ex: 11h-14h, 18h-22h"
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Modes de paiement</label>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => togglePaymentMethod(method.id)}
                  className={`px-3 py-2 rounded-xl border-2 transition-colors ${
                    formData.payment_methods.includes(method.id)
                      ? 'border-[#FF6B35] bg-orange-50'
                      : 'border-gray-200'
                  }`}
                >
                  {method.icon} {method.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493]"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enregistrer'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Add Menu Item Modal
const AddMenuItemModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Nom et prix requis');
      return;
    }

    setLoading(true);
    try {
      await api.post('/roulotte/menu', {
        name: formData.name,
        price: parseInt(formData.price),
        description: formData.description
      });
      toast.success('Plat ajouté !');
      setFormData({ name: '', price: '', description: '' });
      onSuccess();
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full lg:w-[400px] lg:rounded-3xl rounded-t-3xl"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Ajouter un plat</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nom du plat *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Poisson cru au lait de coco"
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Prix (XPF) *</label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="1500"
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du plat..."
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="p-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-[#FF6B35]"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Ajouter au menu'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VendorDashboardPage;
