import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Target, Users, MapPin, Calendar, DollarSign, Check, Sparkles, Eye, MousePointer } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { adsApi } from '../lib/api';
import { toast } from 'sonner';

const CreateAdPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [campaignData, setCampaignData] = useState({
    name: '',
    objective: 'awareness',
    budget_total: 15000,
    budget_daily: 2000,
    target_audience: {
      age_min: 18,
      age_max: 65,
      locations: ['tahiti', 'moorea'],
      interests: []
    },
    placement: ['feed', 'stories']
  });
  
  const [adData, setAdData] = useState({
    title: '',
    description: '',
    media_url: '',
    media_type: 'image',
    cta_text: 'En savoir plus',
    cta_url: ''
  });

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      const response = await adsApi.getPricing();
      setPricing(response.data);
    } catch (error) {
      console.error('Error loading pricing:', error);
    }
  };

  const objectives = [
    { id: 'awareness', name: 'Notoriété', description: 'Faites connaître votre marque', icon: Eye },
    { id: 'engagement', name: 'Engagement', description: 'Plus de likes, commentaires, partages', icon: Sparkles },
    { id: 'traffic', name: 'Trafic', description: 'Redirigez vers votre site', icon: MousePointer },
    { id: 'conversions', name: 'Conversions', description: 'Générez des ventes', icon: Target }
  ];

  const placements = [
    { id: 'feed', name: 'Feed', description: 'Publications principales' },
    { id: 'stories', name: 'Stories', description: 'Stories 24h' },
    { id: 'reels', name: 'Reels', description: 'Vidéos courtes' }
  ];

  const locations = [
    { id: 'tahiti', name: 'Tahiti' },
    { id: 'moorea', name: 'Moorea' },
    { id: 'bora_bora', name: 'Bora Bora' },
    { id: 'raiatea', name: 'Raiatea' },
    { id: 'huahine', name: 'Huahine' },
    { id: 'rangiroa', name: 'Rangiroa' }
  ];

  const interests = [
    'Tourisme', 'Gastronomie', 'Mode', 'Beauté', 'Sport', 'Culture', 
    'Musique', 'Art', 'Technologie', 'Business'
  ];

  const demoImages = [
    'https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=600',
    'https://images.unsplash.com/photo-1690228987673-f6e104fa653c?w=600',
    'https://images.unsplash.com/photo-1703549068359-49d854524ddd?w=600'
  ];

  const handleCreateCampaign = async () => {
    if (!campaignData.name) {
      toast.error('Veuillez donner un nom à votre campagne');
      return;
    }
    setStep(2);
  };

  const handleCreateAd = async () => {
    if (!adData.title || !adData.media_url) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Create campaign first
      const campaignRes = await adsApi.createCampaign(campaignData);
      
      // Then create ad
      await adsApi.create({
        ...adData,
        campaign_id: campaignRes.data.campaign_id
      });

      toast.success('Publicité créée avec succès !');
      navigate('/business');
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const estimatedReach = Math.floor(campaignData.budget_total / 10);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-[#1A1A2E]">Créer une Publicité</h1>
          <p className="text-gray-600">Étape {step} sur 2</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493]"
          initial={{ width: '50%' }}
          animate={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>

      {/* Step 1: Campaign Settings */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          {/* Campaign Name */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">Nom de la campagne</h2>
            <Input
              value={campaignData.name}
              onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
              placeholder="Ex: Promo Été 2026"
              data-testid="campaign-name"
              className="rounded-xl py-6"
            />
          </div>

          {/* Objective */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">Objectif</h2>
            <div className="grid grid-cols-2 gap-4">
              {objectives.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => setCampaignData({ ...campaignData, objective: obj.id })}
                  data-testid={`objective-${obj.id}`}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    campaignData.objective === obj.id
                      ? 'border-[#FF6B35] bg-gradient-to-r from-[#FF6B35]/10 to-[#FF1493]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <obj.icon size={24} className={campaignData.objective === obj.id ? 'text-[#FF6B35]' : 'text-gray-400'} />
                  <p className="font-semibold text-[#1A1A2E] mt-2">{obj.name}</p>
                  <p className="text-sm text-gray-500">{obj.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">Budget</h2>
            
            {/* Package Selection */}
            {pricing?.packages && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {pricing.packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setCampaignData({
                      ...campaignData,
                      budget_total: pkg.price,
                      budget_daily: Math.floor(pkg.price / pkg.duration_days)
                    })}
                    className={`p-4 rounded-2xl border-2 text-center transition-all relative ${
                      campaignData.budget_total === pkg.price
                        ? 'border-[#FF6B35] bg-gradient-to-r from-[#FF6B35]/10 to-[#FF1493]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs font-bold rounded-full">
                        Populaire
                      </span>
                    )}
                    <p className="font-bold text-lg text-[#1A1A2E]">{pkg.name}</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-[#FF6B35] to-[#FF1493] bg-clip-text text-transparent">
                      {pkg.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">XPF</p>
                  </button>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#1A1A2E]">Budget total (XPF)</Label>
                <Input
                  type="number"
                  value={campaignData.budget_total}
                  onChange={(e) => setCampaignData({ ...campaignData, budget_total: parseInt(e.target.value) || 0 })}
                  className="rounded-xl py-6 mt-2"
                />
              </div>
              <div>
                <Label className="text-[#1A1A2E]">Budget quotidien (XPF)</Label>
                <Input
                  type="number"
                  value={campaignData.budget_daily}
                  onChange={(e) => setCampaignData({ ...campaignData, budget_daily: parseInt(e.target.value) || 0 })}
                  className="rounded-xl py-6 mt-2"
                />
              </div>
            </div>

            {/* Estimated Reach */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#00CED1]/10 to-[#006994]/10">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-[#00CED1]" />
                <div>
                  <p className="font-bold text-[#1A1A2E]">Portée estimée</p>
                  <p className="text-2xl font-black text-[#00CED1]">{estimatedReach.toLocaleString()} - {(estimatedReach * 1.5).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">personnes atteintes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Targeting */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">Ciblage</h2>
            
            <div className="space-y-6">
              {/* Locations */}
              <div>
                <Label className="text-[#1A1A2E] mb-3 block">Îles ciblées</Label>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        const current = campaignData.target_audience.locations;
                        const updated = current.includes(loc.id)
                          ? current.filter(l => l !== loc.id)
                          : [...current, loc.id];
                        setCampaignData({
                          ...campaignData,
                          target_audience: { ...campaignData.target_audience, locations: updated }
                        });
                      }}
                      className={`px-4 py-2 rounded-full font-medium transition-all ${
                        campaignData.target_audience.locations.includes(loc.id)
                          ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white'
                          : 'bg-gray-100 text-[#1A1A2E] hover:bg-gray-200'
                      }`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <Label className="text-[#1A1A2E] mb-3 block">Centres d'intérêt</Label>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => {
                        const current = campaignData.target_audience.interests || [];
                        const updated = current.includes(interest)
                          ? current.filter(i => i !== interest)
                          : [...current, interest];
                        setCampaignData({
                          ...campaignData,
                          target_audience: { ...campaignData.target_audience, interests: updated }
                        });
                      }}
                      className={`px-4 py-2 rounded-full font-medium transition-all ${
                        (campaignData.target_audience.interests || []).includes(interest)
                          ? 'bg-gradient-to-r from-[#00CED1] to-[#006994] text-white'
                          : 'bg-gray-100 text-[#1A1A2E] hover:bg-gray-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Placements */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">Emplacements</h2>
            <div className="grid grid-cols-3 gap-4">
              {placements.map((placement) => (
                <button
                  key={placement.id}
                  onClick={() => {
                    const current = campaignData.placement;
                    const updated = current.includes(placement.id)
                      ? current.filter(p => p !== placement.id)
                      : [...current, placement.id];
                    setCampaignData({ ...campaignData, placement: updated });
                  }}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    campaignData.placement.includes(placement.id)
                      ? 'border-[#FF6B35] bg-gradient-to-r from-[#FF6B35]/10 to-[#FF1493]/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {campaignData.placement.includes(placement.id) && (
                    <Check size={20} className="text-[#FF6B35] mx-auto mb-2" />
                  )}
                  <p className="font-semibold text-[#1A1A2E]">{placement.name}</p>
                  <p className="text-xs text-gray-500">{placement.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreateCampaign}
            data-testid="next-step-btn"
            className="w-full py-6 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-semibold text-lg"
          >
            Continuer
          </Button>
        </motion.div>
      )}

      {/* Step 2: Ad Creative */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          {/* Media */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">Média</h2>
            
            <div className="relative">
              <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                value={adData.media_url}
                onChange={(e) => setAdData({ ...adData, media_url: e.target.value })}
                placeholder="URL de votre image ou vidéo"
                data-testid="ad-media-url"
                className="pl-12 py-6 rounded-xl"
              />
            </div>

            {/* Demo Images */}
            <div className="flex gap-3 mt-4 overflow-x-auto hide-scrollbar">
              {demoImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setAdData({ ...adData, media_url: url })}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    adData.media_url === url ? 'border-[#FF6B35]' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Preview */}
            {adData.media_url && (
              <div className="mt-4 rounded-2xl overflow-hidden aspect-video bg-gray-100">
                <img src={adData.media_url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Ad Content */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">Contenu</h2>
            
            <div className="space-y-4">
              <div>
                <Label className="text-[#1A1A2E]">Titre *</Label>
                <Input
                  value={adData.title}
                  onChange={(e) => setAdData({ ...adData, title: e.target.value })}
                  placeholder="Ex: Nouvelle collection disponible"
                  data-testid="ad-title"
                  className="rounded-xl py-6 mt-2"
                />
              </div>
              
              <div>
                <Label className="text-[#1A1A2E]">Description</Label>
                <Textarea
                  value={adData.description}
                  onChange={(e) => setAdData({ ...adData, description: e.target.value })}
                  placeholder="Décrivez votre offre..."
                  className="rounded-xl mt-2 min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#1A1A2E]">Bouton d'action</Label>
                  <Select value={adData.cta_text} onValueChange={(v) => setAdData({ ...adData, cta_text: v })}>
                    <SelectTrigger className="rounded-xl py-6 mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="En savoir plus">En savoir plus</SelectItem>
                      <SelectItem value="Acheter">Acheter</SelectItem>
                      <SelectItem value="S'inscrire">S'inscrire</SelectItem>
                      <SelectItem value="Contacter">Contacter</SelectItem>
                      <SelectItem value="Réserver">Réserver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-[#1A1A2E]">Lien de destination</Label>
                  <Input
                    value={adData.cta_url}
                    onChange={(e) => setAdData({ ...adData, cta_url: e.target.value })}
                    placeholder="https://..."
                    className="rounded-xl py-6 mt-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-[#FF6B35]/10 to-[#FF1493]/10 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">Résumé</h2>
            <div className="space-y-2 text-[#1A1A2E]">
              <p><strong>Campagne:</strong> {campaignData.name}</p>
              <p><strong>Budget:</strong> {campaignData.budget_total.toLocaleString()} XPF</p>
              <p><strong>Ciblage:</strong> {campaignData.target_audience.locations.join(', ')}</p>
              <p><strong>Emplacements:</strong> {campaignData.placement.join(', ')}</p>
            </div>
          </div>

          <Button
            onClick={handleCreateAd}
            disabled={loading}
            data-testid="create-ad-btn"
            className="w-full py-6 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-semibold text-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Lancer la publicité</>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default CreateAdPage;
