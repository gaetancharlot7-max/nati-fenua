import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, ShoppingBag, Megaphone, Play, Heart, MapPin, MessageCircle, Radio, Sparkles, Check } from 'lucide-react';
import { Button } from '../components/ui/button';

// Fenua Logo Component
const FenuaLogo = ({ size = 'lg' }) => {
  const sizes = {
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
    xl: 'w-32 h-32 text-6xl'
  };
  
  return (
    <motion.div 
      className={`${sizes[size]} rounded-3xl bg-gradient-to-br from-[#FF6B35] via-[#FF1493] to-[#9400D3] p-1 rotate-6`}
      animate={{ rotate: [6, -6, 6] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="w-full h-full rounded-[20px] bg-white flex items-center justify-center">
        <span className={`font-black bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#00CED1] bg-clip-text text-transparent`}>F</span>
      </div>
    </motion.div>
  );
};

const LandingPage = () => {
  const features = [
    {
      icon: Users,
      title: 'Réseau Social',
      description: 'Photos, vidéos, stories et Reels. Partagez votre vie polynésienne.',
      color: 'from-[#FF6B35] to-[#FF1493]'
    },
    {
      icon: Radio,
      title: 'Lives en Direct',
      description: 'Diffusez en direct et connectez-vous en temps réel avec votre communauté.',
      color: 'from-[#FF1493] to-[#9400D3]'
    },
    {
      icon: MessageCircle,
      title: 'Messagerie',
      description: 'Discutez en privé avec vos amis et votre famille à travers les îles.',
      color: 'from-[#9400D3] to-[#00CED1]'
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace',
      description: 'Perles, monoï, artisanat... Achetez et vendez les trésors du Fenua.',
      color: 'from-[#00CED1] to-[#FFD700]'
    },
    {
      icon: Megaphone,
      title: 'Publicité Locale',
      description: 'Faites connaître votre business à toute la Polynésie Française.',
      color: 'from-[#FFD700] to-[#FF6B35]'
    },
    {
      icon: Sparkles,
      title: 'Effets & Filtres',
      description: 'Des effets inspirés de la culture polynésienne pour vos contenus.',
      color: 'from-[#FF6B35] to-[#00CED1]'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Utilisateurs' },
    { value: '1M+', label: 'Posts partagés' },
    { value: '10K+', label: 'Produits vendus' },
    { value: '100+', label: 'Lives par jour' }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[#1A1A2E]">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF6B35] rounded-full blur-[150px] opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00CED1] rounded-full blur-[150px] opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF1493] rounded-full blur-[200px] opacity-20"></div>
          
          {/* Background image overlay */}
          <div 
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=1920)' }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <FenuaLogo size="xl" />
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#00CED1] bg-clip-text text-transparent">Fenua</span>
              {' '}
              <span className="text-white">Social</span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-white/90 mb-4 font-light">
              Le réseau social de la <span className="font-semibold text-[#FFD700]">Polynésie Française</span>
            </p>
            
            <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
              Photos • Vidéos • Stories • Reels • Lives • Marketplace • Chat
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/auth">
                <Button 
                  data-testid="get-started-btn"
                  className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:from-[#FF8E72] hover:to-[#FF1493] text-white px-10 py-7 text-xl font-bold rounded-2xl shadow-2xl shadow-orange-500/30 transition-all duration-300 hover:scale-105 hover:shadow-orange-500/50"
                >
                  Commencer Gratuit
                  <ArrowRight className="ml-2" size={24} />
                </Button>
              </Link>
              
              <Link to="/auth">
                <Button 
                  variant="outline"
                  data-testid="login-btn"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-10 py-7 text-xl font-semibold rounded-2xl transition-all duration-300 backdrop-blur-sm"
                >
                  Se connecter
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[#FFD700] to-[#FF6B35] bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-white/60 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Floating Elements */}
          <motion.div 
            className="absolute left-8 top-1/3 hidden xl:block"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <div className="glass-dark rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center">
                <Heart size={24} className="text-white" fill="white" />
              </div>
              <div>
                <p className="text-white font-bold">+2.5K</p>
                <p className="text-white/60 text-sm">Likes aujourd'hui</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="absolute right-8 top-1/4 hidden xl:block"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <div className="glass-dark rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#00CED1] to-[#006994] flex items-center justify-center">
                <MapPin size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold">Tahiti • Moorea</p>
                <p className="text-white/60 text-sm">Bora Bora • Raiatea</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="absolute right-16 bottom-1/4 hidden xl:block"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            <div className="glass-dark rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center relative">
                <Radio size={24} className="text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></span>
              </div>
              <div>
                <p className="text-white font-bold">12 Lives</p>
                <p className="text-white/60 text-sm">en direct maintenant</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-7 h-12 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
            <div className="w-2 h-3 rounded-full bg-gradient-to-b from-[#FF6B35] to-[#FF1493]"></div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-[#1A1A2E] to-[#FFF5E6]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              <span className="text-white">Ia ora na !</span>
              <br />
              <span className="bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#00CED1] bg-clip-text text-transparent">Bienvenue</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour connecter, partager et prospérer en Polynésie
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={32} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-[#1A1A2E] mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace Preview */}
      <section className="py-24 bg-[#FFF5E6]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1A2E] mb-4">
              Marketplace <span className="bg-gradient-to-r from-[#FF6B35] to-[#00CED1] bg-clip-text text-transparent">Local</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Les trésors de notre Fenua à portée de main
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { img: 'https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=400', title: 'Perles', price: '15 000 XPF', color: '#00CED1' },
              { img: 'https://images.unsplash.com/photo-1690228987673-f6e104fa653c?w=400', title: 'Monoï', price: '2 500 XPF', color: '#FFD700' },
              { img: 'https://images.unsplash.com/photo-1663018084454-86fd8150f950?w=400', title: 'Fruits', price: '1 000 XPF', color: '#32CD32' },
              { img: 'https://images.unsplash.com/photo-1746511299666-5ba663a2a5df?w=400', title: 'Artisanat', price: '8 000 XPF', color: '#FF6B35' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="aspect-square overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-[#1A1A2E]">{item.title}</h4>
                  <p className="font-black text-lg" style={{ color: item.color }}>{item.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-[#1A1A2E]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Publicité <span className="bg-gradient-to-r from-[#FF6B35] to-[#FFD700] bg-clip-text text-transparent">Payante</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Boostez votre visibilité auprès de la communauté polynésienne
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: '5 000', features: ['1 000 impressions', '7 jours', 'Feed uniquement'] },
              { name: 'Boost', price: '15 000', features: ['5 000 impressions', '14 jours', 'Feed + Stories', 'Statistiques'], popular: true },
              { name: 'Pro', price: '35 000', features: ['15 000 impressions', '30 jours', 'Tous placements', 'Stats avancées', 'Support prioritaire'] }
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-3xl p-8 ${plan.popular ? 'bg-gradient-to-br from-[#FF6B35] to-[#FF1493] text-white' : 'bg-white text-[#1A1A2E]'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FFD700] text-[#1A1A2E] text-sm font-bold rounded-full">
                    POPULAIRE
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-4xl font-black mb-6">{plan.price} <span className="text-lg font-normal opacity-70">XPF</span></p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check size={20} className={plan.popular ? 'text-white' : 'text-[#00CED1]'} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full py-6 rounded-xl font-bold ${plan.popular ? 'bg-white text-[#FF6B35] hover:bg-gray-100' : 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white'}`}>
                  Choisir
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#9400D3]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Rejoignez la famille
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Plus de 50 000 polynésiens nous font déjà confiance
            </p>
            <Link to="/auth">
              <Button 
                data-testid="cta-join-btn"
                className="bg-white text-[#FF6B35] hover:bg-gray-100 px-12 py-7 text-xl font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Créer mon compte gratuit
                <ArrowRight className="ml-2" size={24} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#1A1A2E]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <FenuaLogo size="md" />
              <div>
                <span className="text-white font-black text-xl">Fenua Social</span>
                <p className="text-white/50 text-sm">Polynésie Française</p>
              </div>
            </div>
            
            <p className="text-white/50 text-sm">
              © 2026 Fenua Social. Fait avec ❤️ à Tahiti
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
