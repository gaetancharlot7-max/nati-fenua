import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, MousePointer, Users, DollarSign, Plus, BarChart3, Target, Pause, Play, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { analyticsApi, adsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// Demo stats
const demoStats = {
  posts: { total: 24, total_likes: 1250, total_views: 8900, total_comments: 156 },
  products: { total: 8, total_views: 3400 },
  ads: { total: 3, total_impressions: 25600, total_clicks: 890, ctr: 3.48 },
  followers: 456,
  following: 128
};

// Demo ads
const demoAds = [
  {
    ad_id: 'ad1',
    title: 'Nouvelle collection Perles',
    media_url: 'https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=200',
    status: 'active',
    impressions: 12500,
    clicks: 450,
    budget: 50000,
    budget_spent: 23000
  },
  {
    ad_id: 'ad2',
    title: 'Promo Monoï -20%',
    media_url: 'https://images.unsplash.com/photo-1690228987673-f6e104fa653c?w=200',
    status: 'paused',
    impressions: 8200,
    clicks: 310,
    budget: 30000,
    budget_spent: 15000
  }
];

const BusinessDashboard = () => {
  const { user, updateProfile } = useAuth();
  const [stats, setStats] = useState(demoStats);
  const [ads, setAds] = useState(demoAds);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, adsRes] = await Promise.all([
        analyticsApi.getDashboard(),
        adsApi.getMyAds()
      ]);
      
      if (statsRes.data) setStats(statsRes.data);
      if (adsRes.data?.length > 0) setAds(adsRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToBusiness = async () => {
    try {
      await updateProfile({ is_business: true });
    } catch (error) {
      console.error('Error upgrading:', error);
    }
  };

  const statCards = [
    { title: 'Impressions', value: stats.ads?.total_impressions || 0, icon: Eye, color: 'bg-blue-500', change: '+12%' },
    { title: 'Clics', value: stats.ads?.total_clicks || 0, icon: MousePointer, color: 'bg-green-500', change: '+8%' },
    { title: 'CTR', value: `${stats.ads?.ctr || 0}%`, icon: Target, color: 'bg-purple-500', change: '+2%' },
    { title: 'Abonnés', value: stats.followers || 0, icon: Users, color: 'bg-orange-500', change: '+15%' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 safe-bottom">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-[#2F2F31]">Dashboard Business</h1>
          <p className="text-gray-600">Gérez vos publicités et analysez vos performances</p>
        </div>
        
        <Link to="/create-ad">
          <Button 
            data-testid="create-ad-btn"
            className="bg-[#E97C07] hover:bg-[#D16B00] text-white rounded-full"
          >
            <Plus size={20} className="mr-2" />
            Créer une publicité
          </Button>
        </Link>
      </div>

      {/* Business Account CTA */}
      {!user?.is_business && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#00899B] to-[#006d7a] rounded-3xl p-6 mb-8 text-white"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif mb-2">Passez au compte Professionnel</h2>
              <p className="text-white/80">Accédez aux statistiques avancées et créez des publicités pour votre entreprise.</p>
            </div>
            <Button 
              onClick={handleUpgradeToBusiness}
              data-testid="upgrade-business-btn"
              className="bg-white text-[#00899B] hover:bg-[#F9FAF8] rounded-full whitespace-nowrap"
            >
              Passer Pro
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={20} className="text-white" />
                  </div>
                  <span className="text-xs text-green-500 font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold text-[#2F2F31]">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white rounded-full p-1 mb-6 shadow-sm">
          <TabsTrigger 
            value="overview"
            data-testid="overview-tab"
            className="rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white px-6"
          >
            <BarChart3 size={18} className="mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger 
            value="ads"
            data-testid="ads-tab"
            className="rounded-full data-[state=active]:bg-[#00899B] data-[state=active]:text-white px-6"
          >
            <Target size={18} className="mr-2" />
            Mes Publicités
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Posts Stats */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-[#2F2F31]">Publications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total publications</span>
                    <span className="font-bold">{stats.posts?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total J'aime</span>
                    <span className="font-bold">{(stats.posts?.total_likes || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total vues</span>
                    <span className="font-bold">{(stats.posts?.total_views || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Commentaires</span>
                    <span className="font-bold">{stats.posts?.total_comments || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Stats */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-[#2F2F31]">Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Produits en vente</span>
                    <span className="font-bold">{stats.products?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Vues produits</span>
                    <span className="font-bold">{(stats.products?.total_views || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Publicités actives</span>
                    <span className="font-bold">{stats.ads?.total || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ads Tab */}
        <TabsContent value="ads">
          <div className="space-y-4">
            {ads.length === 0 ? (
              <Card className="border-none shadow-sm">
                <CardContent className="py-12 text-center">
                  <Target size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-[#2F2F31] mb-2">Aucune publicité</h3>
                  <p className="text-gray-500 mb-4">Créez votre première publicité pour atteindre plus de clients</p>
                  <Link to="/create-ad">
                    <Button className="bg-[#E97C07] hover:bg-[#D16B00] text-white rounded-full">
                      <Plus size={18} className="mr-2" />
                      Créer une publicité
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              ads.map((ad, index) => (
                <motion.div
                  key={ad.ad_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-none shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Ad Image */}
                        <div className="w-full md:w-48 h-32 md:h-auto">
                          <img 
                            src={ad.media_url} 
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Ad Info */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-[#2F2F31]">{ad.title}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                ad.status === 'active' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-yellow-100 text-yellow-600'
                              }`}>
                                {ad.status === 'active' ? 'Active' : 'En pause'}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="rounded-full">
                                {ad.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-full text-red-500">
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Impressions</p>
                              <p className="font-bold text-[#2F2F31]">{ad.impressions.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Clics</p>
                              <p className="font-bold text-[#2F2F31]">{ad.clicks.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">CTR</p>
                              <p className="font-bold text-[#2F2F31]">{((ad.clicks / ad.impressions) * 100).toFixed(2)}%</p>
                            </div>
                          </div>
                          
                          {/* Budget Progress */}
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Budget utilisé</span>
                              <span className="font-medium">{ad.budget_spent.toLocaleString()} / {ad.budget.toLocaleString()} XPF</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#00899B] rounded-full transition-all"
                                style={{ width: `${(ad.budget_spent / ad.budget) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessDashboard;
