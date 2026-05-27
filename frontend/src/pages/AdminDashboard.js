import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Calendar, MessageCircle, Megaphone, Users, BookOpen, Plus, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, API } from '../App';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

function AdminDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen py-12 px-6 md:px-12 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-light tracking-tight mb-2">
            Panel Administracyjny
          </h1>
          <p className="text-muted-foreground font-body">
            Witaj, {user?.name}! Zarządzaj swoją kawiarnią.
          </p>
        </div>

        <Tabs defaultValue="announcements" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
            <TabsTrigger value="announcements" data-testid="tab-announcements">
              <Megaphone className="mr-2 h-4 w-4" /> Ogłoszenia
            </TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule">
              <Calendar className="mr-2 h-4 w-4" /> Grafik
            </TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat">
              <MessageCircle className="mr-2 h-4 w-4" /> Czat
            </TabsTrigger>
            <TabsTrigger value="books" data-testid="tab-books">
              <BookOpen className="mr-2 h-4 w-4" /> Książki
            </TabsTrigger>
            {user?.role === 'admin' && (
              <TabsTrigger value="users" data-testid="tab-users">
                <Users className="mr-2 h-4 w-4" /> Użytkownicy
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="announcements">
            <AnnouncementsTab />
          </TabsContent>
          <TabsContent value="schedule">
            <ScheduleTab />
          </TabsContent>
          <TabsContent value="chat">
            <ChatTab />
          </TabsContent>
          <TabsContent value="books">
            <BooksTab />
          </TabsContent>
          {user?.role === 'admin' && (
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// ============= ANNOUNCEMENTS TAB =============
function AnnouncementsTab() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API}/announcements`, { credentials: 'include' });
      if (response.ok) {
        setAnnouncements(await response.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`${API}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success('Ogłoszenie utworzone');
        setOpen(false);
        setFormData({ title: '', content: '' });
        fetchAnnouncements();
      }
    } catch (error) {
      toast.error('Błąd przy tworzeniu ogłoszenia');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API}/announcements/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Ogłoszenie usunięte');
        fetchAnnouncements();
      }
    } catch (error) {
      toast.error('Błąd przy usuwaniu');
    }
  };

  return (
    <Card className="neumorphic border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-heading">Ogłoszenia dla pracowników</CardTitle>
          <CardDescription>Komunikaty od pracodawcy</CardDescription>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="add-announcement-button">
                <Plus className="mr-2 h-4 w-4" /> Dodaj
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nowe ogłoszenie</DialogTitle>
                <DialogDescription>Wyślij komunikat do pracowników</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tytuł</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    data-testid="announcement-title-input"
                  />
                </div>
                <div>
                  <Label>Treść</Label>
                  <Textarea
                    rows={5}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    data-testid="announcement-content-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} data-testid="submit-announcement">Utwórz</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {announcements.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Brak ogłoszeń</p>
        ) : (
          announcements.map((ann) => (
            <div key={ann.announcement_id} className="border border-border rounded-xl p-4 bg-card" data-testid={`announcement-${ann.announcement_id}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-heading font-semibold text-lg">{ann.title}</h3>
                {user?.role === 'admin' && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(ann.announcement_id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{ann.content}</p>
              <p className="text-xs text-muted-foreground">
                {ann.created_by} • {new Date(ann.created_at).toLocaleDateString('pl-PL')}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ============= SCHEDULE TAB =============
function ScheduleTab() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    user_name: '',
    date: '',
    shift_start: '',
    shift_end: '',
    notes: '',
  });

  useEffect(() => {
    fetchSchedules();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`${API}/schedule`, { credentials: 'include' });
      if (response.ok) {
        setSchedules(await response.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API}/users`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((u) => u.role === 'employee' || u.role === 'admin'));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`${API}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success('Grafik utworzony');
        setOpen(false);
        setFormData({ user_id: '', user_name: '', date: '', shift_start: '', shift_end: '', notes: '' });
        fetchSchedules();
      }
    } catch (error) {
      toast.error('Błąd');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API}/schedule/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Usunięto');
        fetchSchedules();
      }
    } catch (error) {
      toast.error('Błąd');
    }
  };

  const handleUserSelect = (userId) => {
    const selectedUser = users.find((u) => u.user_id === userId);
    setFormData({ ...formData, user_id: userId, user_name: selectedUser?.name || '' });
  };

  return (
    <Card className="neumorphic border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-heading">Grafik Pracy</CardTitle>
          <CardDescription>
            {user?.role === 'admin' ? 'Zarządzaj zmianami pracowników' : 'Twoje zaplanowane zmiany'}
          </CardDescription>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="add-schedule-button">
                <Plus className="mr-2 h-4 w-4" /> Dodaj zmianę
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nowa zmiana</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Pracownik</Label>
                  <Select value={formData.user_id} onValueChange={handleUserSelect}>
                    <SelectTrigger data-testid="schedule-user-select">
                      <SelectValue placeholder="Wybierz pracownika" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    data-testid="schedule-date-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Początek</Label>
                    <Input
                      type="time"
                      value={formData.shift_start}
                      onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Koniec</Label>
                    <Input
                      type="time"
                      value={formData.shift_end}
                      onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notatki</Label>
                  <Textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} data-testid="submit-schedule">Utwórz</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Brak zaplanowanych zmian</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.schedule_id} className="border border-border rounded-xl p-4 bg-card flex justify-between items-center" data-testid={`schedule-${s.schedule_id}`}>
                <div>
                  <div className="font-semibold">{s.user_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(s.date).toLocaleDateString('pl-PL')} • {s.shift_start} - {s.shift_end}
                  </div>
                  {s.notes && <div className="text-xs text-muted-foreground mt-1">{s.notes}</div>}
                </div>
                {user?.role === 'admin' && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(s.schedule_id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============= CHAT TAB =============
function ChatTab() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API}/chat`, { credentials: 'include' });
      if (response.ok) {
        setMessages(await response.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: newMessage }),
      });
      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      toast.error('Błąd przy wysyłaniu');
    }
  };

  return (
    <Card className="neumorphic border-border/40">
      <CardHeader>
        <CardTitle className="font-heading">Czat zespołu</CardTitle>
        <CardDescription>Komunikacja między pracownikami</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="h-96 overflow-y-auto border border-border rounded-xl p-4 bg-muted/30 mb-4 flex flex-col space-y-2"
          data-testid="chat-messages"
        >
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center my-auto">Brak wiadomości. Napisz pierwszą!</p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.user_id === user?.user_id;
              return (
                <div
                  key={msg.message_id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border'
                    }`}
                  >
                    {!isOwn && (
                      <div className="text-xs font-semibold mb-1 text-muted-foreground">
                        {msg.user_name}
                      </div>
                    )}
                    <div className="text-sm">{msg.message}</div>
                    <div className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={handleSend} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Napisz wiadomość..."
            data-testid="chat-input"
          />
          <Button type="submit" data-testid="chat-send-button">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ============= BOOKS TAB =============
function BooksTab() {
  const [books, setBooks] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    price: 0,
    image_url: '',
    stock: 10,
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${API}/books`);
      if (response.ok) {
        setBooks(await response.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`${API}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
        }),
      });
      if (response.ok) {
        toast.success('Książka dodana');
        setOpen(false);
        setFormData({ title: '', author: '', description: '', price: 0, image_url: '', stock: 10 });
        fetchBooks();
      } else {
        toast.error('Błąd');
      }
    } catch (error) {
      toast.error('Błąd');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Na pewno usunąć książkę?')) return;
    try {
      const response = await fetch(`${API}/books/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Usunięto');
        fetchBooks();
      }
    } catch (error) {
      toast.error('Błąd');
    }
  };

  return (
    <Card className="neumorphic border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-heading">Zarządzanie książkami</CardTitle>
          <CardDescription>Dodawaj i edytuj książki w księgarni</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full" data-testid="add-book-button">
              <Plus className="mr-2 h-4 w-4" /> Dodaj książkę
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nowa książka</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>Tytuł</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="book-title-input"
                />
              </div>
              <div>
                <Label>Autor</Label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  data-testid="book-author-input"
                />
              </div>
              <div>
                <Label>Opis</Label>
                <Textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  data-testid="book-description-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cena (zł)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    data-testid="book-price-input"
                  />
                </div>
                <div>
                  <Label>Ilość</Label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>URL Zdjęcia</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  data-testid="book-image-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} data-testid="submit-book">Dodaj</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {books.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Brak książek</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {books.map((book) => (
              <div key={book.book_id} className="border border-border rounded-xl p-4 bg-card flex space-x-4" data-testid={`admin-book-${book.book_id}`}>
                <img
                  src={book.image_url}
                  alt={book.title}
                  className="w-20 h-28 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-heading font-semibold">{book.title}</h3>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  <p className="text-sm font-semibold text-primary mt-1">{book.price.toFixed(2)} zł</p>
                  <p className="text-xs text-muted-foreground">Stan: {book.stock}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(book.book_id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============= USERS TAB =============
function UsersTab() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API}/users`, { credentials: 'include' });
      if (response.ok) {
        setUsers(await response.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      const response = await fetch(`${API}/users/${userId}/role?role=${newRole}`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (response.ok) {
        toast.success('Rola zaktualizowana');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Błąd');
    }
  };

  const roleBadge = (role) => {
    if (role === 'admin') return <Badge className="bg-primary">Admin</Badge>;
    if (role === 'employee') return <Badge variant="secondary">Pracownik</Badge>;
    return <Badge variant="outline">Klient</Badge>;
  };

  return (
    <Card className="neumorphic border-border/40">
      <CardHeader>
        <CardTitle className="font-heading">Użytkownicy</CardTitle>
        <CardDescription>Zarządzaj rolami użytkowników</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.user_id} className="border border-border rounded-xl p-4 bg-card flex justify-between items-center" data-testid={`user-${u.user_id}`}>
              <div>
                <div className="font-semibold">{u.name}</div>
                <div className="text-sm text-muted-foreground">{u.email}</div>
                <div className="mt-1">{roleBadge(u.role)}</div>
              </div>
              <Select value={u.role} onValueChange={(value) => updateRole(u.user_id, value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Klient</SelectItem>
                  <SelectItem value="employee">Pracownik</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminDashboard;
