import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [sessionId]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/payments/status/${sessionId}`);
      const data = await response.json();
      
      setPaymentData(data);

      if (data.payment_status === 'paid') {
        setStatus('success');
        return;
      } else if (data.status === 'expired') {
        setStatus('expired');
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 size={64} className="text-[#FF6B35] mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Vérification du paiement...</h1>
            <p className="text-gray-500">Veuillez patienter quelques instants</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Paiement réussi !</h1>
            <p className="text-gray-500 mb-6">
              Votre publicité est maintenant active.
              {paymentData?.metadata?.package_name && (
                <span className="block mt-2 font-semibold text-[#FF6B35]">
                  {paymentData.metadata.package_name}
                </span>
              )}
            </p>
            <Button
              onClick={() => navigate('/feed')}
              className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] w-full"
            >
              Retour au fil d'actualité
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </>
        )}

        {(status === 'expired' || status === 'error' || status === 'timeout') && (
          <>
            <XCircle size={80} className="text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">
              {status === 'expired' ? 'Session expirée' : 'Erreur de paiement'}
            </h1>
            <p className="text-gray-500 mb-6">
              {status === 'expired' 
                ? 'Votre session de paiement a expiré. Veuillez réessayer.'
                : 'Une erreur est survenue. Veuillez réessayer ou contacter le support.'}
            </p>
            <Button
              onClick={() => navigate('/advertising')}
              variant="outline"
              className="w-full border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35]/10"
            >
              Réessayer
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
};

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <XCircle size={80} className="text-orange-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Paiement annulé</h1>
        <p className="text-gray-500 mb-6">
          Vous avez annulé le paiement. Aucun montant n'a été débité.
        </p>
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/advertising')}
            className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] w-full"
          >
            Voir les offres publicitaires
          </Button>
          <Button
            onClick={() => navigate('/feed')}
            variant="outline"
            className="w-full border-gray-200"
          >
            Retour au fil d'actualité
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export { PaymentSuccessPage, PaymentCancelPage };
