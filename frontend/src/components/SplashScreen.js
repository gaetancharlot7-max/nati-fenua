import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Attendre la fin de l'animation de sortie
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#FF6B35] via-[#FF1493] to-[#00CED1]"
        >
          {/* Cercles décoratifs animés */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 2, 2.5],
                  opacity: [0, 0.3, 0]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                style={{
                  width: '200px',
                  height: '200px',
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                }}
              />
            ))}
          </div>

          {/* Logo principal avec animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              duration: 0.8 
            }}
            className="relative"
          >
            {/* Halo lumineux derrière le logo */}
            <motion.div
              className="absolute -inset-8 rounded-full bg-white/30 blur-2xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Logo SVG */}
            <motion.img
              src="/assets/logo_nati_fenua_v2.svg"
              alt="Nati Fenua"
              className="w-32 h-32 md:w-40 md:h-40 relative z-10 drop-shadow-2xl"
              animate={{ 
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Titre animé */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
              Nati Fenua
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-white/80 text-lg mt-2"
            >
              Le réseau social polynésien
            </motion.p>
          </motion.div>

          {/* Barre de chargement */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '200px' }}
            transition={{ delay: 1, duration: 0.3 }}
            className="mt-10 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 1.2, duration: 1.3, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Texte de chargement */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0.5, 1] }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="mt-4 text-white/60 text-sm"
          >
            Ia ora na...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
