import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { API } from '../App';

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, failed, expired
  const attemptsRef = useRef(0);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('failed');
      return;
    }

    const pollStatus = async () => {
      const maxAttempts = 10;
      
      if (attemptsRef.current >= maxAttempts) {
        setStatus('expired');
        return;
      }

      try {
        const response = await fetch(`${API}/payment/status/${sessionId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();

        if (data.payment_status === 'paid') {
          setStatus('success');
          localStorage.removeItem('cart');
          localStorage.removeItem('pending_order_id');
          return;
        }

        if (data.status === 'expired') {
          setStatus('expired');
          return;
        }

        attemptsRef.current += 1;
        setTimeout(pollStatus, 2000);
      } catch (error) {
        console.error('Status check error:', error);
        attemptsRef.current += 1;
        setTimeout(pollStatus, 2000);
      }
    };

    pollStatus();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-6">
      <Card className="w-full max-w-md neumorphic border-border/40">
        <CardContent className="p-8 text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <h2 className="text-2xl font-heading font-semibold mb-2">Weryfikujemy płatność...</h2>
              <p className="text-muted-foreground font-body">Proszę czekać</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-heading font-semibold mb-2">Płatność zakończona!</h2>
              <p className="text-muted-foreground font-body mb-6">
                Dziękujemy za zakupy. Skontaktujemy się w sprawie dostawy.
              </p>
              <Button onClick={() => navigate('/')} className="rounded-full" data-testid="back-home-button">
                Wróć na stronę główną
              </Button>
            </>
          )}
          {(status === 'failed' || status === 'expired') && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h2 className="text-2xl font-heading font-semibold mb-2">
                {status === 'expired' ? 'Sesja wygasła' : 'Wystąpił problem'}
              </h2>
              <p className="text-muted-foreground font-body mb-6">
                Spróbuj ponownie lub skontaktuj się z nami
              </p>
              <Button onClick={() => navigate('/cart')} className="rounded-full">
                Wróć do koszyka
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentSuccessPage;
