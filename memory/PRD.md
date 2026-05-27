# Między Wierszami - PRD

## Original Problem
Build a complete polished restaurant/cafe website for "Między Wierszami" - a cafe/bookstore in Szczecin (ul. Stanisława Moniuszki 6/1, 71-430 Szczecin, phone: 791 041 061, Instagram: @kawiarniamiedzywierszami).

## Requirements
- Beautiful homepage with location map (OpenStreetMap)
- Menu page with photos (coffee, tea, desserts, food)
- Bookstore - e-commerce with book details, descriptions, prices, purchasing
- User authentication (traditional login/password + Google OAuth)
- Shopping cart
- Admin panel: work schedule, employee chat, announcements
- Contact information with Instagram integration
- Stripe payment integration (PLN currency)

## Architecture
- Backend: FastAPI + MongoDB (motor async driver)
- Frontend: React + Tailwind + Shadcn UI components
- Maps: Leaflet + OpenStreetMap
- Auth: Traditional bcrypt + Emergent-managed Google OAuth
- Payments: Stripe Checkout (emergentintegrations)
- Real-time chat: Polling-based (5s interval)

## User Personas
1. **Customer** - browses menu, buys books, manages own orders
2. **Employee** - views own schedule, participates in chat, reads announcements
3. **Admin** - manages books, schedule, sends announcements, manages user roles

## Implemented (Feb 2026)
- ✅ Beautiful homepage with hero, about, map, Instagram feed
- ✅ Menu page with tabbed categories (coffee, tea, desserts, food)
- ✅ Bookstore with detail modal, add-to-cart
- ✅ Authentication (register, login, logout, Google OAuth via Emergent)
- ✅ Shopping cart with quantity management
- ✅ Stripe payment with polling-based status check
- ✅ Admin Dashboard with 5 tabs (Announcements, Schedule, Chat, Books, Users)
- ✅ Role-based access control (customer/employee/admin)
- ✅ OpenStreetMap with cafe location
- ✅ Contact page with hours, map, all contact methods
- ✅ Responsive design with mobile menu

## Backlog (P1)
- [ ] Instagram API integration (requires Meta App credentials)
- [ ] Przelewy24/PayU additional payment methods
- [ ] Order history page for customers
- [ ] Email notifications for orders
- [ ] Image upload for books (currently URL only)
- [ ] Multi-language support (English, German)

## Next Steps
1. Initial QA testing
2. Add Instagram API once credentials provided
3. Consider Przelewy24 for Polish market preference
