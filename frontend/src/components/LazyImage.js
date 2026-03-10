// Lazy Loading Image Component with progressive loading
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Hook to detect network connection quality
export const useNetworkQuality = () => {
  const [quality, setQuality] = useState('high'); // high, medium, low

  useEffect(() => {
    const updateQuality = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        const { effectiveType, downlink } = connection;
        
        if (effectiveType === '4g' && downlink > 5) {
          setQuality('high');
        } else if (effectiveType === '4g' || effectiveType === '3g') {
          setQuality('medium');
        } else {
          setQuality('low');
        }
      }
    };

    updateQuality();
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateQuality);
      return () => connection.removeEventListener('change', updateQuality);
    }
  }, []);

  return quality;
};

// Get optimized image URL based on network quality
export const getOptimizedImageUrl = (url, quality = 'high', width = 800) => {
  if (!url) return '';
  
  // For unsplash images, append quality params
  if (url.includes('unsplash.com')) {
    const qualityMap = { high: 80, medium: 60, low: 40 };
    const widthMap = { high: width, medium: Math.round(width * 0.7), low: Math.round(width * 0.5) };
    return `${url.split('?')[0]}?w=${widthMap[quality]}&q=${qualityMap[quality]}&fm=webp`;
  }
  
  return url;
};

// Lazy Image Component
export const LazyImage = ({ 
  src, 
  alt = '', 
  className = '', 
  aspectRatio = 'square',
  quality = null,
  placeholder = null,
  onLoad = () => {},
  ...props 
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef(null);
  const networkQuality = useNetworkQuality();
  const finalQuality = quality || networkQuality;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setError(true);
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: ''
  }[aspectRatio] || 'aspect-square';

  const optimizedSrc = getOptimizedImageUrl(src, finalQuality);

  return (
    <div ref={imgRef} className={`relative overflow-hidden bg-gray-100 ${aspectRatioClass} ${className}`}>
      {/* Placeholder/Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse">
          {placeholder || (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs">Image indisponible</p>
          </div>
        </div>
      )}
      
      {/* Actual Image */}
      {inView && !error && (
        <motion.img
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

// Lazy Video Component with thumbnail
export const LazyVideo = ({
  src,
  thumbnail,
  alt = '',
  className = '',
  autoPlay = false,
  quality = null,
  onPlay = () => {},
  ...props
}) => {
  const [playing, setPlaying] = useState(autoPlay);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const networkQuality = useNetworkQuality();
  const finalQuality = quality || networkQuality;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        } else if (playing) {
          // Pause video when out of view
          setPlaying(false);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      { rootMargin: '50px', threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [playing]);

  const handlePlay = () => {
    setPlaying(true);
    onPlay();
  };

  const handleLoaded = () => {
    setLoaded(true);
  };

  // Quality-based video resolution
  const videoQualityClass = {
    high: '',
    medium: 'max-h-[720px]',
    low: 'max-h-[360px]'
  }[finalQuality] || '';

  return (
    <div ref={containerRef} className={`relative aspect-video bg-black ${className}`}>
      {/* Thumbnail - shown when not playing */}
      {!playing && (
        <div className="absolute inset-0">
          {thumbnail ? (
            <LazyImage
              src={thumbnail}
              alt={alt}
              className="w-full h-full"
              aspectRatio="video"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Play Button Overlay */}
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
            data-testid="video-play-btn"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
          
          {/* Network quality indicator */}
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
            {finalQuality === 'high' ? '1080p' : finalQuality === 'medium' ? '720p' : '360p'}
          </div>
        </div>
      )}
      
      {/* Video - only loads when clicked */}
      {playing && inView && (
        <>
          {!loaded && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <video
            ref={videoRef}
            src={src}
            className={`w-full h-full object-contain ${videoQualityClass} ${loaded ? 'opacity-100' : 'opacity-0'}`}
            controls
            autoPlay
            onLoadedData={handleLoaded}
            {...props}
          />
        </>
      )}
    </div>
  );
};

// Connection Status Banner
export const ConnectionStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const networkQuality = useNetworkQuality();

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setTimeout(() => setShowBanner(false), 3000);
    };
    
    const handleOffline = () => {
      setOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 py-3 px-4 text-center text-white font-medium ${
        online 
          ? 'bg-green-500' 
          : 'bg-red-500'
      }`}
    >
      {online ? (
        <span>Connexion rétablie</span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          Pas de connexion internet
        </span>
      )}
    </motion.div>
  );
};

export default LazyImage;
