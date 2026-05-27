import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { API } from '../App';

function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const stored = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(stored);
  };

  const updateQuantity = (book_id, delta) => {
    const updated = cart.map((item) => {
      if (item.book_id === book_id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (book_id) => {
    const updated = cart.filter((item) => item.book_id !== book_id);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    toast.success('Usunięto z koszyka');
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      // Create order
      const orderResponse = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          cart.map((item) => ({ book_id: item.book_id, quantity: item.quantity }))
        ),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.detail || 'Failed to create order');
      }

      const order = await orderResponse.json();

      // Create checkout session
      const checkoutResponse = await fetch(`${API}/payment/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order_id: order.order_id,
          origin_url: window.location.origin,
        }),
      });

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session');
      }

      const checkout = await checkoutResponse.json();

      // Save cart for clearing after payment
      localStorage.setItem('pending_order_id', order.order_id);

      // Redirect to Stripe
      window.location.href = checkout.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Błąd przy płatności');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-heading font-light tracking-tight mb-8">
          Twój Koszyk
        </h1>

        {cart.length === 0 ? (
          <Card className="neumorphic border-border/40">
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-2">Koszyk jest pusty</h3>
              <p className="text-muted-foreground font-body mb-6">
                Dodaj książki, aby kontynuować
              </p>
              <Button onClick={() => navigate('/bookstore')} className="rounded-full">
                Przeglądaj księgarnię
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {cart.map((item) => (
                <Card key={item.book_id} className="neumorphic border-border/40" data-testid={`cart-item-${item.book_id}`}>
                  <CardContent className="p-4 flex items-center space-x-4">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-20 h-28 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-lg">{item.title}</h3>
                      <p className="text-primary font-semibold">{item.price.toFixed(2)} zł</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.book_id, -1)}
                        data-testid={`decrease-qty-${item.book_id}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.book_id, 1)}
                        data-testid={`increase-qty-${item.book_id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(item.book_id)}
                      data-testid={`remove-item-${item.book_id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="neumorphic border-border/40">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-heading font-semibold">Suma:</span>
                  <span className="text-3xl font-semibold text-primary" data-testid="cart-total">
                    {total.toFixed(2)} zł
                  </span>
                </div>
                <Button
                  className="w-full rounded-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={loading}
                  data-testid="checkout-button"
                >
                  {loading ? 'Przekierowywanie...' : 'Przejdź do płatności'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default CartPage;
