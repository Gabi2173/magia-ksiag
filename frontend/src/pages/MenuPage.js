import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const menuItems = {
  kawa: [
    { name: 'Espresso', price: '8 zł', description: 'Klasyczne espresso z aromatycznych ziaren' },
    { name: 'Latte', price: '14 zł', description: 'Espresso z mlekiem i delikatną pianą' },
    { name: 'Cappuccino', price: '13 zł', description: 'Idealne połączenie kawy i mleka' },
    { name: 'Caffè Latte', price: '15 zł', description: 'Duża porcja latte z aromatem' },
    { name: 'Kawa Czarna', price: '9 zł', description: 'Klasyczna kawa parzona' },
    { name: 'Latte i coś dla duszy', price: '22 zł', description: 'Latte z deserem dnia' },
  ],
  herbata: [
    { name: 'Herbata Imbirowa', price: '12 zł', description: 'Rozgrzewająca herbata z imbirem' },
    { name: 'Herbata Klasyczna', price: '10 zł', description: 'Wybierz spośród naszych mieszanek' },
    { name: 'Herbata Owocowa', price: '11 zł', description: 'Aromatyczne mieszanki owocowe' },
    { name: 'Kakao z bitą śmietaną', price: '15 zł', description: 'Domowe kakao z bitą śmietaną' },
  ],
  desery: [
    { name: 'Serniczek', price: '14 zł', description: 'Domowy sernik na ciepło lub zimno' },
    { name: 'Szarlotka', price: '15 zł', description: 'Tradycyjna szarlotka z lodami' },
    { name: 'Miodownik', price: '14 zł', description: 'Klasyczny miodownik' },
    { name: 'Naleśniki z serem', price: '18 zł', description: 'Naleśniki z słodkim serem' },
    { name: 'Deser Lodowy Rafaello', price: '22 zł', description: 'Lody z dodatkami w stylu Rafaello' },
    { name: 'Dwie porcje lodów', price: '16 zł', description: 'Lody w różnych smakach' },
    { name: 'Lody Czekoladowe', price: '12 zł', description: 'Pyszne lody czekoladowe' },
    { name: 'Latte i Sorbet', price: '20 zł', description: 'Połączenie kawy i sorbetu' },
  ],
  jedzenie: [
    { name: 'Sałatka z Gruszką', price: '24 zł', description: 'Wyrafinowana sałatka z gruszką i serem' },
    { name: 'Makaron', price: '28 zł', description: 'Makaron w sosie do wyboru' },
    { name: 'Quiche dnia', price: '22 zł', description: 'Tarta wytrawna z dodatkami' },
    { name: 'Kanapka', price: '18 zł', description: 'Kanapka z różnymi dodatkami' },
  ],
};

function MenuPage() {
  return (
    <div className="min-h-screen py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light tracking-tight text-foreground mb-4">
            Nasze Menu
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            Odkryj smaki, które sprawią, że zechcesz wracać.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
          <img
            src="https://images.unsplash.com/photo-1563311977-d285756282dc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxjb2ZmZWUlMjBsYXR0ZSUyMGFydCUyMHBvdXJpbmd8ZW58MHx8fHwxNzc5ODk3OTg5fDA&ixlib=rb-4.1.0&q=85"
            alt="Kawa"
            className="rounded-2xl object-cover h-64 w-full neumorphic"
          />
          <img
            src="https://images.unsplash.com/photo-1761637604549-4943604df127?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwyfHxjYWtlJTIwZGVzc2VydCUyMHBhc3RyeSUyMGNhZmV8ZW58MHx8fHwxNzc5ODk3OTk5fDA&ixlib=rb-4.1.0&q=85"
            alt="Deser"
            className="rounded-2xl object-cover h-64 w-full neumorphic"
          />
          <img
            src="https://images.pexels.com/photos/9828855/pexels-photo-9828855.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="Ciasta"
            className="rounded-2xl object-cover h-64 w-full neumorphic col-span-2 md:col-span-1"
          />
        </div>

        <Tabs defaultValue="kawa" className="w-full" data-testid="menu-tabs">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl mx-auto mb-8">
            <TabsTrigger value="kawa" data-testid="tab-kawa">Kawa</TabsTrigger>
            <TabsTrigger value="herbata" data-testid="tab-herbata">Herbata</TabsTrigger>
            <TabsTrigger value="desery" data-testid="tab-desery">Desery</TabsTrigger>
            <TabsTrigger value="jedzenie" data-testid="tab-jedzenie">Jedzenie</TabsTrigger>
          </TabsList>

          {Object.entries(menuItems).map(([category, items]) => (
            <TabsContent key={category} value={category}>
              <div className="grid md:grid-cols-2 gap-6">
                {items.map((item, index) => (
                  <Card key={index} className="neumorphic border-border/40 transition-transform duration-300 hover:scale-[1.02]" data-testid={`menu-item-${category}-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-heading font-semibold text-foreground">
                          {item.name}
                        </h3>
                        <span className="text-lg font-body font-semibold text-primary">
                          {item.price}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-body">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-16 text-center bg-muted/40 rounded-2xl p-8">
          <p className="text-sm text-muted-foreground font-body">
            Ceny mogą się różnić. Aktualne menu zawsze w lokalu. Średnia cena za osobę: <strong className="text-foreground">20-40 zł</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default MenuPage;
