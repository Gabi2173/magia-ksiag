import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Instagram } from 'lucide-react';
import { Button } from '../components/ui/button';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function HomePage() {
  const cafeLocation = [53.428543, 14.552812]; // Szczecin, Moniuszki 6/1

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1758610605872-3195caed0bdd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxjb3p5JTIwY2FmZSUyMGJvb2tzdG9yZSUyMGludGVyaW9yfGVufDB8fHx8MTc3OTg5Nzk4NHww&ixlib=rb-4.1.0&q=85)',
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center justify-center text-center px-6">
          <div className="max-w-4xl space-y-6" data-testid="hero-section">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight">
              Między Wierszami
            </h1>
            <p className="text-base sm:text-lg text-white/90 font-body max-w-2xl mx-auto">
              Kawiarnia-księgarnia w sercu Szczecina. Odkryj magiczną przestrzeń, gdzie kawa spotyka
              literaturę.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button
                size="lg"
                className="rounded-full px-8"
                asChild
                data-testid="view-menu-button"
              >
                <Link to="/menu">Zobacz Menu</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 bg-white/10 backdrop-blur text-white border-white hover:bg-white/20"
                asChild
                data-testid="browse-books-button"
              >
                <Link to="/bookstore">Przeglądaj Książki</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-heading font-light tracking-tight text-foreground">
              Witamy w naszej przestrzeni
            </h2>
            <p className="text-base text-muted-foreground font-body leading-relaxed">
              Między Wierszami to wyjątkowe miejsce, gdzie aromaty świeżo parzonej kawy łączą się z
              zapachem książek. Nasza kawiarnia-księgarnia to przytulna przestrzeń, idealna do
              spotkań, pracy lub chwili relaksu z ulubionym tytułem.
            </p>
            <p className="text-base text-muted-foreground font-body leading-relaxed">
              Oferujemy starannie wyselekcjonowane kawy, domowe desery oraz bogatą kolekcję książek.
              Każdy znajdzie tu coś dla siebie.
            </p>
            <Button size="lg" className="rounded-full" asChild>
              <Link to="/contact">Odwiedź nas</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1563311977-d285756282dc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxjb2ZmZWUlMjBsYXR0ZSUyMGFydCUyMHBvdXJpbmd8ZW58MHx8fHwxNzc5ODk3OTg5fDA&ixlib=rb-4.1.0&q=85"
              alt="Kawa latte"
              className="rounded-2xl object-cover h-64 w-full neumorphic"
            />
            <img
              src="https://images.unsplash.com/photo-1761637604549-4943604df127?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwyfHxjYWtlJTIwZGVzc2VydCUyMHBhc3RyeSUyMGNhZmV8ZW58MHx8fHwxNzc5ODk3OTk5fDA&ixlib=rb-4.1.0&q=85"
              alt="Deser"
              className="rounded-2xl object-cover h-64 w-full neumorphic mt-8"
            />
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-24 md:py-32 bg-muted/30" data-testid="map-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-heading font-light tracking-tight text-foreground mb-4">
              Znajdź nas
            </h2>
            <p className="text-base text-muted-foreground font-body">
              Odwiedź nas w centrum Szczecina
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Map */}
            <div className="h-96 md:h-[500px] rounded-2xl overflow-hidden neumorphic">
              <MapContainer
                center={cafeLocation}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={cafeLocation}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-heading font-semibold text-lg">Między Wierszami</h3>
                      <p className="text-sm">Stanisława Moniuszki 6/1</p>
                      <p className="text-sm">71-430 Szczecin</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2">Adres</h3>
                  <p className="text-muted-foreground font-body">
                    Stanisława Moniuszki 6/1
                    <br />
                    71-430 Szczecin
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Clock className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2">Godziny otwarcia</h3>
                  <div className="text-muted-foreground font-body space-y-1">
                    <p>Poniedziałek - Piątek: 8:00 - 21:00</p>
                    <p>Sobota: 9:00 - 21:00</p>
                    <p>Niedziela: 10:00 - 20:00</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2">Kontakt</h3>
                  <p className="text-muted-foreground font-body">
                    <a href="tel:+48791041061" className="hover:text-primary transition-colors">
                      +48 791 041 061
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Instagram className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2">Instagram</h3>
                  <a
                    href="https://www.instagram.com/kawiarniamiedzywierszami/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground font-body hover:text-primary transition-colors"
                  >
                    @kawiarniamiedzywierszami
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-heading font-light tracking-tight text-foreground mb-4">
            Odwiedź nas na Instagramie
          </h2>
          <p className="text-base text-muted-foreground font-body">
            Zobacz, co się u nas dzieje
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'https://images.unsplash.com/photo-1542372147193-a7aca54189cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxhZXN0aGV0aWMlMjBjYWZlJTIwbGlmZXN0eWxlJTIwaW5zdGFncmFtfGVufDB8fHx8MTc3OTg5ODAwNXww&ixlib=rb-4.1.0&q=85',
            'https://images.pexels.com/photos/29802751/pexels-photo-29802751.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
            'https://images.unsplash.com/photo-1559032195-42b455e61dfe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxhZXN0aGV0aWMlMjBjYWZlJTIwbGlmZXN0eWxlJTIwaW5zdGFncmFtfGVufDB8fHx8MTc3OTg5ODAwNXww&ixlib=rb-4.1.0&q=85',
            'https://images.pexels.com/photos/29679392/pexels-photo-29679392.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
          ].map((url, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer"
            >
              <img
                src={url}
                alt={`Instagram ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="rounded-full" asChild>
            <a
              href="https://www.instagram.com/kawiarniamiedzywierszami/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="mr-2 h-5 w-5" />
              Śledź nas
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground font-body">
            &copy; {new Date().getFullYear()} Między Wierszami. Wszystkie prawa zastrzeżone.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;