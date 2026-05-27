import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ShoppingCart, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useAuth, API } from '../App';

function BookstorePage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${API}/books`);
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (book) => {
    if (!user) {
      toast.error('Zaloguj się, aby dodać do koszyka');
      navigate('/auth');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item) => item.book_id === book.book_id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        book_id: book.book_id,
        title: book.title,
        price: book.price,
        image_url: book.image_url,
        quantity: 1,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(`Dodano "${book.title}" do koszyka`);
    setSelectedBook(null);
  };

  return (
    <div className="min-h-screen py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light tracking-tight text-foreground mb-4">
            Księgarnia
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            Odkryj nasze starannie wybrane książki, które możesz cieszyć z filiżanką kawy.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-heading font-semibold mb-2">Wkrótce nowe pozycje</h3>
            <p className="text-muted-foreground font-body">
              Nasza biblioteka jest aktualnie aktualizowana. Zapraszamy wkrótce!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book) => (
              <Card
                key={book.book_id}
                className="neumorphic border-border/40 overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
                onClick={() => setSelectedBook(book)}
                data-testid={`book-card-${book.book_id}`}
              >
                <div className="aspect-[2/3] overflow-hidden bg-muted">
                  <img
                    src={book.image_url}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-heading font-semibold text-lg line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                  <p className="text-lg font-semibold text-primary">{book.price.toFixed(2)} zł</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
          <DialogContent className="max-w-2xl">
            {selectedBook && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading">{selectedBook.title}</DialogTitle>
                  <DialogDescription className="text-base text-muted-foreground">
                    {selectedBook.author}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6">
                  <img
                    src={selectedBook.image_url}
                    alt={selectedBook.title}
                    className="w-full rounded-xl object-cover aspect-[2/3]"
                  />
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">
                      {selectedBook.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-3xl font-semibold text-primary">
                        {selectedBook.price.toFixed(2)} zł
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Dostępne: {selectedBook.stock} szt.
                      </span>
                    </div>
                    <Button
                      className="w-full rounded-full"
                      size="lg"
                      onClick={() => addToCart(selectedBook)}
                      disabled={selectedBook.stock === 0}
                      data-testid="add-to-cart-btn"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Dodaj do koszyka
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default BookstorePage;
