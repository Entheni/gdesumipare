# GdeSuMiPare

**GdeSuMiPare** je web aplikacija na srpskom jeziku za pracenje racuna, pretplata i mesecnih troskova, sa jasnim pregledom toga gde novac odlazi.

## Vizija projekta

Korisnici u Srbiji svakog meseca placaju vise ponavljajucih obaveza kao sto su Infostan, EPS, A1, SBB, Yettel, Netflix i parking, bez jednog centralnog pregleda. Aplikacija treba da pruzi jednostavan i privatnosti orijentisan dashboard za upravljanje tim troskovima.

Bankarske integracije nisu deo trenutnog plana. Korisnik unosi ili kasnije uvozi obaveze rucno.

## MVP ciljevi - Faza 1

Glavne funkcionalnosti:
- Korisnicki nalozi sa email + password autentikacijom i JWT tokenima
- Dodavanje racuna i pretplata sa nazivom, iznosom, ucestaloscu i datumom dospeca
- Dashboard sa ukupnim mesecnim troskovima i pregledom narednih placanja
- Email notifikacije nekoliko dana pre dospeca
- Kategorije troskova
- Dark / light mode

Van opsega za sada:
- Bank API integracije
- AI funkcionalnosti
- Vise valuta
- Mobilna aplikacija

## Tehnologije

- Backend: Node.js + Express
- Baza: PostgreSQL preko Knex-a
- Frontend: Vue 3 + Vite + TailwindCSS
- Auth: JWT + bcrypt
- Mail: Nodemailer
- Hosting: Render + Vercel

## Struktura projekta

```text
gdesumipare/
|-- backend/
|   |-- src/
|   |   |-- routes/
|   |   |-- db/
|   |   |-- utils/
|   |   `-- server.js
|   |-- knexfile.cjs
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- pages/
|   |   |-- router/
|   |   |-- App.vue
|   |   `-- main.js
|   |-- index.html
|   `-- package.json
`-- GdeSuMiPare_README.md
```

## Pocetna baza podataka

### users
- `id` serial primary key
- `email` varchar(255) unique not null
- `password_hash` text not null
- `created_at` timestamp default now()

### bills
- `id` serial primary key
- `user_id` int foreign key -> users.id
- `name` varchar(255) not null
- `category` varchar(100)
- `amount_rsd` numeric(10,2) not null
- `recurrence` varchar(20) not null
- `due_day` int
- `next_due_date` date
- `notes` text
- `created_at` timestamp default now()

### notifications
- `id` serial primary key
- `user_id` int foreign key -> users.id
- `bill_id` int foreign key -> bills.id
- `sent_at` timestamp

## API pregled

- `POST /api/auth/register` - registracija korisnika
- `POST /api/auth/login` - prijava i JWT token
- `GET /api/bills` - svi racuni prijavljenog korisnika
- `POST /api/bills` - dodavanje racuna
- `PUT /api/bills/:id` - izmena racuna
- `DELETE /api/bills/:id` - brisanje racuna
- `GET /api/stats/monthly` - agregacija po kategoriji

## Frontend stranice

- `/login` - prijava
- `/register` - registracija
- `/dashboard` - pregled troskova
- `/add-bill` - unos nove obaveze
- `/settings` - podesavanja i notifikacije, planirano

## Notifikacije

Plan je da dnevni scheduler proverava racune koji dospevaju uskoro, salje email podsetnike i belezi poslate notifikacije u tabeli `notifications`.

## Roadmap

- Faza 1: Auth, bills CRUD, dashboard, email reminders
- Faza 2: UX dorade, kategorije i grafikoni
- Faza 3: CSV import
- Faza 4: Mobilni klijent

## Lokalno pokretanje

Zahtevi:
- Node.js 18+
- PostgreSQL

Instalacija:

```bash
cd backend
npm install
npm run migrate
npm run dev

cd ../frontend
npm install
npm run dev
```

Primer environment promenljivih:

```env
PORT=5000
DATABASE_URL=postgres://user:pass@localhost:5432/gdesumipare
JWT_SECRET=replace-with-a-long-random-secret
EMAIL_SERVICE=gmail
EMAIL_USER=you@example.com
EMAIL_PASS=app_password
```

## Bezbednost

- Lozinke se cuvaju kao bcrypt hash
- JWT token istice nakon jednog dana
- Produkcija treba da koristi HTTPS
- Svi osetljivi podaci moraju doci iz environment promenljivih

## License

MIT
