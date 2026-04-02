# Amr Salah Bookings

Customer-facing booking application for Amr Salah Barber Shop.

## Features

- 📅 Calendar date selection
- 💈 Barber selection
- 🕐 Available time slots
- 📝 Customer information form
- 🔗 Connected to same Supabase database as main app
- 🌍 Arabic & English support
- 📱 Responsive design

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase
- React Hook Form + Zod validation
- i18next (Arabic/English)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

These should be the **same credentials** as the main Amr Salah app to access the shared database.

### 3. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Build

```bash
npm run build
```

## Database

This app uses the **same Supabase database** as the main Amr Salah application:

- Queries `barbers` table for available barbers
- Queries `bookings` table to check available slots
- Inserts into `bookings` table when customer confirms booking

No separate database needed!

## Deployment

Deploy on Vercel:

```bash
vercel --prod
```

Connect to GitHub repo and deploy directly from git.

## File Structure

```
src/
├── pages/
│   ├── BookingPage.tsx          # Main booking flow orchestrator
│   ├── CalendarView.tsx         # Date selection
│   ├── BarberSelection.tsx      # Barber selection
│   ├── TimeSelection.tsx        # Time slots
│   ├── BookingForm.tsx          # Customer info form
│   └── BookingConfirmation.tsx  # Final confirmation
├── hooks/
│   ├── useBarbers.ts            # Fetch available barbers
│   └── useBookings.ts           # Create & manage bookings
├── db/
│   └── supabase.ts              # Supabase client setup
├── locales/
│   └── i18n.ts                  # Arabic/English translations
├── App.tsx
└── index.css
```

## License

Proprietary - Amr Salah Barber Shop
