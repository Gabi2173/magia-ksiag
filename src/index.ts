// ...existing code...
import React, { useState, useEffect, createContext, useContext } from 'react';

/* ---------------------- KONFIG ---------------------- */
const CONFIG = {
  shopName: 'Magia Ksiąg',
  address: 'Stanisława Moniuszki 6/1, Szczecin',
  email: 'kawiarnia@miedzywierszami.pl',
  phone: '+48 791 041 061',
  facebook: 'https://www.facebook.com/SzczecinMiedzyWierszami/?locale=pl_PL',
  theme: {
    accent: '#6b4f37',
    bg: '#f3e9dd',
    card: '#fff'
  }
};

export const CATEGORIES = [
  'Nowości','Bestsellery','Fantastyka','Kryminał i sensacja','Literatura piękna',
  'Romans','Horror','Sci-fi','Dla dzieci','Dla młodzieży',
  'Komiksy i manga','Biografie','Historia','Psychologia','Rozwój osobisty',
  'Filozofia','Religia i duchowość','Kulinaria','Podróże i reportaże','Poradniki i hobby'
];

/* ---------------------- AUTH ---------------------- */
const AuthContext = createContext(null);
AuthContext.displayName = 'AuthContext';
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('mk_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // keep localStorage/state in sync if another tab updated users list
    try {
      const raw = localStorage.getItem('mk_user');
      const parsed = raw ? JSON.parse(raw) : null;
      if (JSON.stringify(parsed) !== JSON.stringify(user)) {
        setUser(parsed);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signup = ({ email, password, name }) => {
    if (!email || !password) throw new Error('Email i hasło są wymagane');
    const users = JSON.parse(localStorage.getItem('mk_users') || '[]');
    if (users.find(u => u.email === email)) throw new Error('Użytkownik już istnieje');
    const newUser = { id: Date.now(), email, password, name, orders: [] };
    users.push(newUser);
    localStorage.setItem('mk_users', JSON.stringify(users));
    localStorage.setItem('mk_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const login = ({ email, password }) => {
    if (!email || !password) throw new Error('Email i hasło są wymagane');
    const users = JSON.parse(localStorage.getItem('mk_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Niepoprawne dane logowania');
    localStorage.setItem('mk_user', JSON.stringify(found));
    setUser(found);
  };

  const logout = () => {
    localStorage.removeItem('mk_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/* ---------------------- KOSZYK ---------------------- */
const CartContext = createContext(null);
CartContext.displayName = 'CartContext';
function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('mk_cart');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mk_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const add = (product, qty = 1) => {
    if (!product || !product.id) return;
    setItems(prev => {
      const found = prev.find(p => p.id === product.id);
      if (found)
        return prev.map(p =>
          p.id === product.id ? { ...p, qty: p.qty + qty } : p
        );
      return [...prev, { ...product, qty }];
    });
  };

  const remove = id => setItems(prev => prev.filter(p => p.id !== id));
  const updateQty = (id, qty) =>
    setItems(prev =>
      prev.map(p => (p.id === id ? { ...p, qty: Number(qty) || 1 } : p))
    );
  const clear = () => setItems([]);
  const total = items.reduce(
    (sum, p) => sum + (parseFloat(p.price) || 0) * (p.qty || 0),
    0
  );

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}
const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

/* ---------------------- DANE ---------------------- */
const seedBooks = [
  {id:1,title:'Cień i Kość',author:'Leigh Bardugo',price:39.99,category:'Fantastyka'},
  {id:2,title:'Sto lat samotności',author:'Gabriel García Márquez',price:44.00,category:'Literatura piękna'},
  {id:3,title:'Mistrz i Małgorzata',author:'Michaił Bułhakow',price:34.50,category:'Literatura piękna'},
  {id:4,title:'Hobbit',author:'J.R.R. Tolkien',price:49.00,category:'Fantastyka'},
  {id:5,title:'Zabić drozda',author:'Harper Lee',price:29.99,category:'Literatura piękna'}
];

function useBooks() {
  const [books, setBooks] = useState(() => {
    try {
      const raw = localStorage.getItem('mk_books');
      if (!raw) {
        localStorage.setItem('mk_books', JSON.stringify(seedBooks));
        return seedBooks;
      }
      return JSON.parse(raw);
    } catch {
      return seedBooks;
    }
  });

  useEffect(() => {
    // ensure localStorage has seed if removed externally
    try {
      if (!localStorage.getItem('mk_books')) {
        localStorage.setItem('mk_books', JSON.stringify(books.length ? books : seedBooks));
      }
    } catch {}
  }, [books]);

  const search = (q = '') => {
    const term = (q || '').trim().toLowerCase();
    if (!term) return books;
    return books.filter(b =>
      ((b.title || '') + ' ' + (b.author || '') + ' ' + (b.category || '')).toLowerCase().includes(term)
    );
  };

  const filterByCategory = cat => {
    if (!cat) return books;
    return books.filter(b => b.category === cat);
  };

  return { books, search, filterByCategory };
}

/* ---------------------- STYL ---------------------- */
const pageStyle = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  background: CONFIG.theme.bg,
  color: '#2b2b2b',
  minHeight: '100vh'
};

/* ---------------------- APP ---------------------- */
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StoreApp />
      </CartProvider>
    </AuthProvider>
  );
}

function StoreApp() {
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [category, setCategory] = useState('');
  const booksHook = useBooks();

  return (
    <div style={pageStyle}>
      <SiteHeader
        onOpenCart={() => setShowCart(true)}
        onOpenAuth={() => setShowAuth(true)}
        category={category}
        setCategory={setCategory}
      />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Catalog booksHook={booksHook} category={category} />
      </main>
      <SiteFooter />
      {showCart && <CartModal onClose={() => setShowCart(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

/* ---------------------- HEADER ---------------------- */
function SiteHeader({ onOpenCart, onOpenAuth, category, setCategory }) {
  const { user, logout } = useAuth();
  const { items } = useCart();
  return (
    <header style={{ background: CONFIG.theme.card, borderBottom: '1px solid #ccc' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 60, height: 60, borderRadius: 10, background: '#efe1d6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: CONFIG.theme.accent }}>MK</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{CONFIG.shopName}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{CONFIG.address}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: 8, borderRadius: 6 }}>
            <option value="">Wszystkie kategorie</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={onOpenCart} style={{ background: CONFIG.theme.accent, color: '#fff', borderRadius: 8, padding: '8px 12px' }}>
            Koszyk {items.length > 0 && <span style={{ background: '#fff', color: CONFIG.theme.accent, marginLeft: 6, padding: '0 5px', borderRadius: 8 }}>{items.length}</span>}
          </button>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Witaj, <b>{user.name || user.email}</b></span>
              <button onClick={logout}>Wyloguj</button>
            </div>
          ) : (
            <button onClick={onOpenAuth}>Zaloguj</button>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------------------- FOOTER ---------------------- */
function SiteFooter() {
  return (
    <footer style={{ padding: 20, textAlign: 'center' }}>
      <b>Magia Ksiąg</b><br />
      {CONFIG.address} · {CONFIG.email} · {CONFIG.phone}<br />
      <a href={CONFIG.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
    </footer>
  );
}

/* ---------------------- KATALOG ---------------------- */
function Catalog({ booksHook, category }) {
  const { books, search, filterByCategory } = booksHook;
  const [q, setQ] = useState('');
  const [results, setResults] = useState(() => books);

  useEffect(() => {
    setResults(category ? filterByCategory(category) : books);
  }, [books, category, filterByCategory]);

  const doSearch = e => {
    if (e && e.preventDefault) e.preventDefault();
    const found = search(q);
    setResults(category ? found.filter(b => b.category === category) : found);
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Katalog książek</h1>
        <form onSubmit={doSearch} style={{ display: 'flex', gap: 6 }}>
          <input placeholder="Szukaj..." value={q} onChange={e => setQ(e.target.value)} style={{ padding: 8, borderRadius: 6 }} />
          <button type="submit">Szukaj</button>
        </form>
      </div>
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 18 }}>
        {results && results.length ? results.map(b => <BookCard key={b.id} book={b} />) : <div>Brak wyników</div>}
      </div>
    </section>
  );
}

function BookCard({ book }) {
  const { add } = useCart();
  return (
    <div style={{ background: CONFIG.theme.card, padding: 12, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 150, background: '#f6f2ea', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b7a6b' }}>OKŁADKA</div>
      <h3 style={{ marginTop: 10 }}>{book.title}</h3>
      <div style={{ color: '#555' }}>{book.author}</div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b>{Number(book.price).toFixed(2)} zł</b>
        <button onClick={() => add(book, 1)}>Dodaj</button>
      </div>
    </div>
  );
}

/* ---------------------- MODALE ---------------------- */
function AuthModal({ onClose }) {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = e => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const payloadEmail = (email || '').trim();
      if (mode === 'login') login({ email: payloadEmail, password: pass });
      else signup({ email: payloadEmail, password: pass, name });
      alert(mode === 'login' ? 'Zalogowano' : 'Zarejestrowano');
      onClose();
    } catch (err) {
      alert(err.message || 'Wystąpił błąd');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, width: 400 }}>
        <h3>{mode === 'login' ? 'Logowanie' : 'Rejestracja'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mode === 'register' && (
            <input placeholder="Imię i nazwisko" value={name} onChange={e => setName(e.target.value)} />
          )}
          <input placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="Hasło" type="password" value={pass} onChange={e => setPass(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Zarejestruj się' : 'Mam konto'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={onClose}>Anuluj</button>
              <button type="submit" style={{ background: CONFIG.theme.accent, color: '#fff', padding: '6px 12px', borderRadius: 6 }}>
                {mode === 'login' ? 'Zaloguj' : 'Rejestruj'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------- KOSZYK ---------------------- */
function CartModal({ onClose }) {
  const { items, remove, updateQty, clear, total } = useCart();

  const checkoutEmail = async () => {
    alert('Zamówienie demo wysłane e-mailem');
    clear();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, width: '90%', maxWidth: 800 }}>
        <h3>Koszyk</h3>
        {items.length === 0 && <p>Koszyk pusty</p>}
        {items.map(it => (
          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
            <span>{it.title}</span>
            <div>
              <input type="number" value={it.qty} min={1} onChange={e => updateQty(it.id, Number(e.target.value) || 1)} style={{ width: 50 }} />
              <button onClick={() => remove(it.id)}>Usuń</button>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
          <b>Suma: {total.toFixed(2)} zł</b>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={checkoutEmail} disabled={items.length === 0}>Zamów e-mailem</button>
            <button onClick={onClose}>Zamknij</button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ...existing code...