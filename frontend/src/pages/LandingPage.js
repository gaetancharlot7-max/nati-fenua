import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, ShoppingBag, Play, Heart, MapPin, MessageCircle, Radio, Sparkles, Camera, Film } from 'lucide-react';
import { Button } from '../components/ui/button';

// Nati Fenua Logo Component - Style original avec drapeau polynésien
const NatiFenuaLogo = ({ size = 'lg' }) => {
  const sizes = {
    sm: { outer: 'w-8 h-8', inner: 'text-lg', flag: 'w-4 h-3' },
    md: { outer: 'w-12 h-12', inner: 'text-2xl', flag: 'w-5 h-3.5' },
    lg: { outer: 'w-24 h-24', inner: 'text-5xl', flag: 'w-8 h-5' },
    xl: { outer: 'w-32 h-32', inner: 'text-6xl', flag: 'w-10 h-6' }
  };
  
  return (
    <div className="relative">
      <motion.div 
        className={`${sizes[size].outer} rounded-3xl bg-gradient-to-br from-[#FF6B35] via-[#FF1493] to-[#00CED1] p-1 rotate-6`}
        animate={{ rotate: [6, -6, 6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full rounded-[20px] bg-white flex items-center justify-center">
          <span className={`${sizes[size].inner} font-black bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#00CED1] bg-clip-text text-transparent`}>N</span>
        </div>
      </motion.div>
      {/* Drapeau polynésien en bas à droite */}
      <div className={`absolute -bottom-1 -right-1 ${sizes[size].flag} rounded-sm overflow-hidden shadow-md border border-white`}>
        <div className="h-[30%] bg-[#CE1126]"></div>
        <div className="h-[40%] bg-white flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#0055A4] flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#CE1126]"></div>
          </div>
        </div>
        <div className="h-[30%] bg-[#CE1126]"></div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const features = [
    {
      icon: Camera,
      title: 'Photos & Stories',
      description: 'Partagez vos plus beaux moments polynésiens avec des stories éphémères.',
      color: 'from-[#FF6B35] to-[#FF1493]'
    },
    {
      icon: Film,
      title: 'Reels & Vidéos',
      description: 'Créez des vidéos courtes virales style TikTok.',
      color: 'from-[#FF1493] to-[#9400D3]'
    },
    {
      icon: Radio,
      title: 'Lives en Direct',
      description: 'Diffusez en direct et connectez-vous en temps réel.',
      color: 'from-[#9400D3] to-[#00CED1]'
    },
    {
      icon: MessageCircle,
      title: 'Messagerie',
      description: 'Discutez en privé avec vos proches à travers les îles.',
      color: 'from-[#00CED1] to-[#FFD700]'
    },
    {
      icon: ShoppingBag,
      title: 'Marché',
      description: 'Perles, monoï, artisanat... Achetez et vendez local.',
      color: 'from-[#FFD700] to-[#FF6B35]'
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Rejoignez la communauté polynésienne connectée.',
      color: 'from-[#FF6B35] to-[#00CED1]'
    }
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
          
          {/* Background image overlay - Huahine Island aerial view */}
          <div 
            className="absolute inset-0 opacity-50 bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.pexels.com/photos/34010769/pexels-photo-34010769.jpeg?auto=compress&cs=tinysrgb&w=1920)' }}
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
              <NatiFenuaLogo size="xl" />
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#00CED1] bg-clip-text text-transparent">Nati</span>
              {' '}
              <span className="text-white">Fenua</span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-white/90 mb-4 font-light">
              Le réseau social de la <span className="font-semibold text-[#FFD700]">Polynésie Française</span>
            </p>
            
            <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
              Photos • Vidéos • Stories • Reels • Lives • Marché • Chat
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                <p className="text-white font-bold">Partagez</p>
                <p className="text-white/60 text-sm">vos moments</p>
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
                <p className="text-white font-bold">Lives</p>
                <p className="text-white/60 text-sm">en direct</p>
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

      {/* Marché Preview */}
      <section className="py-24 bg-[#FFF5E6]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1A2E] mb-4">
              Marché <span className="bg-gradient-to-r from-[#FF6B35] to-[#00CED1] bg-clip-text text-transparent">Local</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Les trésors de notre Fenua à portée de main
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { img: 'https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=400', title: 'Perles de Tahiti', color: '#00CED1' },
              { img: 'https://images.unsplash.com/photo-1690228987673-f6e104fa653c?w=400', title: 'Monoï & Beauté', color: '#FFD700' },
              { img: 'https://images.unsplash.com/photo-1663018084454-86fd8150f950?w=400', title: 'Produits Locaux', color: '#32CD32' },
              { img: 'https://images.unsplash.com/photo-1746511299666-5ba663a2a5df?w=400', title: 'Artisanat', color: '#FF6B35' }
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
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-24 bg-[#1A1A2E]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Téléchargez l'application
              </h2>
              <p className="text-lg text-white/70 mb-8 leading-relaxed">
                Nati Fenua est disponible sur votre smartphone. 
                Installez l'application et restez connecté à la communauté polynésienne.
              </p>
              
              <div className="flex flex-wrap gap-4">
                {/* App Store Button */}
                <a href="#" className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl hover:bg-gray-100 transition-all hover:scale-105">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Télécharger sur</p>
                    <p className="font-bold text-[#1A1A2E]">App Store</p>
                  </div>
                </a>
                
                {/* Play Store Button */}
                <a href="#" className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl hover:bg-gray-100 transition-all hover:scale-105">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">Disponible sur</p>
                    <p className="font-bold text-[#1A1A2E]">Google Play</p>
                  </div>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative flex justify-center"
            >
              {/* Phone Mockup */}
              <div className="relative w-72">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] to-[#00CED1] rounded-[3rem] blur-3xl opacity-40"></div>
                <div className="relative bg-[#1a1a1a] rounded-[2.5rem] p-3 shadow-2xl">
                  <div className="bg-[#2F2F31] rounded-[2rem] overflow-hidden aspect-[9/19]">
                    <img 
                      src="https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=400"
                      alt="App preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay UI */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493]"></div>
                        <span className="text-white font-medium text-sm">@hinano_tahiti</span>
                      </div>
                      <p className="text-white/80 text-sm">Ia ora na depuis Moorea 🌴</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
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
              Connectez-vous avec la communauté polynésienne dès aujourd'hui
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
              <NatiFenuaLogo size="md" />
              <div>
                <span className="text-white font-black text-xl">Nati Fenua</span>
                <p className="text-white/50 text-sm">Polynésie Française</p>
              </div>
            </div>
            
            <p className="text-white/50 text-sm">
              © 2026 Nati Fenua. Fait avec ❤️ à Tahiti
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
