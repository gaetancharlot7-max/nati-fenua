import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Phone, Clock, Star, Utensils, MessageCircle, Loader2, Store } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const VendorPublicProfilePage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/roulotte/profile/${vendorId}`);
        if (!res.ok) throw new Error('not_found');
        const data = await res.json();
        if (!cancelled) setVendor(data);
      } catch (e) {
        if (!cancelled) {
          toast.error('Roulotte introuvable');
          setVendor(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF5E6] to-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF5E6] to-white p-6 text-center">
        <Store className="w-12 h-12 text-gray-300 mb-3" />
        <h1 className="text-xl font-bold text-[#1A1A2E] mb-2">Roulotte introuvable</h1>
        <p className="text-gray-500 mb-5">Cette roulotte n&apos;existe pas ou a été supprimée.</p>
        <Button onClick={() => navigate(-1)} data-testid="back-btn" className="bg-[#FF6B35] hover:bg-[#FF5722]">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  const v = vendor;
  const open = v.is_open ?? false;
  const menu = v.menu_items || v.menu || [];
  const reviews = v.reviews || [];
  const rating = v.rating || v.avg_rating || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white pb-24">
      {/* Cover */}
      <div className="relative h-48 bg-gradient-to-br from-[#FF6B35] to-[#FF1493]" data-testid="vendor-cover">
        {v.cover_url && (
          <img src={v.cover_url} alt="" className="w-full h-full object-cover" />
        )}
        <button
          onClick={() => navigate(-1)}
          data-testid="vendor-back-btn"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="px-4 -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-5"
          data-testid="vendor-card"
        >
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 rounded-2xl border-4 border-white shadow-md">
              <AvatarImage src={v.logo_url || v.picture} />
              <AvatarFallback className="bg-gradient-to-br from-[#FF6B35] to-[#FF1493] text-white text-xl rounded-2xl">
                {(v.name || 'R').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[#1A1A2E] truncate" data-testid="vendor-name">{v.name || 'Roulotte'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={open ? 'bg-green-500' : 'bg-gray-400'} data-testid="vendor-status">
                  {open ? 'Ouverte' : 'Fermée'}
                </Badge>
                {rating > 0 && (
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" /> {rating.toFixed(1)}
                  </span>
                )}
              </div>
              {v.cuisine_type && (
                <p className="text-sm text-gray-500 mt-1">{v.cuisine_type}</p>
              )}
            </div>
          </div>

          {v.description && (
            <p className="text-gray-700 mt-4 text-sm leading-relaxed">{v.description}</p>
          )}

          <div className="space-y-2 mt-4 text-sm">
            {v.phone && (
              <a href={`tel:${v.phone}`} className="flex items-center gap-2 text-[#1A1A2E] hover:text-[#FF6B35]" data-testid="vendor-phone">
                <Phone size={16} /> {v.phone}
              </a>
            )}
            {v.address && (
              <div className="flex items-center gap-2 text-[#1A1A2E]">
                <MapPin size={16} /> {v.address}
              </div>
            )}
            {v.opening_hours && (
              <div className="flex items-center gap-2 text-[#1A1A2E]">
                <Clock size={16} /> {v.opening_hours}
              </div>
            )}
          </div>

          <Link
            to={`/messages?to=${v.user_id || vendorId}`}
            data-testid="vendor-contact-btn"
            className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-bold hover:opacity-95"
          >
            <MessageCircle size={18} /> Contacter
          </Link>
        </motion.div>

        {/* Menu */}
        {menu.length > 0 && (
          <div className="mt-5">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
              <Utensils size={18} /> Menu
            </h2>
            <div className="space-y-2">
              {menu.map((item, i) => (
                <div
                  key={item.item_id || item.id || i}
                  data-testid={`menu-item-${i}`}
                  className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm"
                >
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#1A1A2E] truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                  {item.price != null && (
                    <p className="text-sm font-bold text-[#FF6B35] whitespace-nowrap">{item.price} XPF</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-5">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-3 flex items-center gap-2">
              <Star size={18} /> Avis
            </h2>
            <div className="space-y-2">
              {reviews.slice(0, 5).map((r, i) => (
                <div key={r.review_id || i} className="bg-white rounded-2xl p-3 shadow-sm" data-testid={`review-${i}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{r.user_name || 'Anonyme'}</p>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" /> {r.rating}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPublicProfilePage;
