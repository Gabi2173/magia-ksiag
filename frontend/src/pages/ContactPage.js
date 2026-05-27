import React from 'react';
import { MapPin, Phone, Mail, Instagram, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function ContactPage() {
  const cafeLocation = [53.428543, 14.552812];

  return (
    <div className="min-h-screen py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light tracking-tight text-foreground mb-4">
            Kontakt
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            Zapraszamy do naszej kawiarni. Nie możesz się doczekać? Zadzwoń!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="neumorphic border-border/40 transition-transform duration-300 hover:scale-[1.03]">
            <CardContent className="p-6 text-center">
              <MapPin className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">Adres</h3>
              <p className="text-sm text-muted-foreground font-body">
                Stanisława Moniuszki 6/1
                <br />
                71-430 Szczecin
              </p>
            </CardContent>
          </Card>

          <Card className="neumorphic border-border/40 transition-transform duration-300 hover:scale-[1.03]">
            <CardContent className="p-6 text-center">
              <Phone className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">Telefon</h3>
              <a
                href="tel:+48791041061"
                className="text-sm text-muted-foreground font-body hover:text-primary transition-colors"
                data-testid="phone-link"
              >
                +48 791 041 061
              </a>
            </CardContent>
          </Card>

          <Card className="neumorphic border-border/40 transition-transform duration-300 hover:scale-[1.03]">
            <CardContent className="p-6 text-center">
              <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">Strona WWW</h3>
              <a
                href="https://miedzywierszami.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground font-body hover:text-primary transition-colors"
              >
                miedzywierszami.pl
              </a>
            </CardContent>
          </Card>

          <Card className="neumorphic border-border/40 transition-transform duration-300 hover:scale-[1.03]">
            <CardContent className="p-6 text-center">
              <Instagram className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">Instagram</h3>
              <a
                href="https://www.instagram.com/kawiarniamiedzywierszami/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground font-body hover:text-primary transition-colors"
                data-testid="instagram-link"
              >
                @kawiarniamiedzywierszami
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <Card className="neumorphic border-border/40">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <Clock className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-2xl font-heading font-semibold">Godziny otwarcia</h2>
              </div>
              <div className="space-y-4">
                {[
                  { day: 'Poniedziałek', hours: '8:00 - 21:00' },
                  { day: 'Wtorek', hours: '8:00 - 21:00' },
                  { day: 'Środa', hours: '8:00 - 21:00' },
                  { day: 'Czwartek', hours: '8:00 - 21:00' },
                  { day: 'Piątek', hours: '8:00 - 21:00' },
                  { day: 'Sobota', hours: '9:00 - 21:00' },
                  { day: 'Niedziela', hours: '10:00 - 20:00' },
                ].map((item) => (
                  <div
                    key={item.day}
                    className="flex justify-between items-center border-b border-border/40 pb-2 font-body"
                  >
                    <span className="text-foreground">{item.day}</span>
                    <span className="text-muted-foreground">{item.hours}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="h-96 md:h-full rounded-2xl overflow-hidden neumorphic">
            <MapContainer
              center={cafeLocation}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={cafeLocation}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-heading font-semibold">Między Wierszami</h3>
                    <p className="text-sm">Stanisława Moniuszki 6/1, Szczecin</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
