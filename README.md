# Pispala Bingo

Mobiili-first bingopeli Tampere/Pispala-pubikierros-teemalla. SNES-pikselityyli, tila säilyy localStoragessa ja Firebase-tulostaulussa.

## Kehitys

```bash
npm install
cp .env.example .env   # täytä Firebase-asetukset
npm run dev
```

## Firebase

1. [Firebase Console](https://console.firebase.google.com/) → luo tai valitse projekti
2. **Build → Firestore Database** → luo tietokanta (test mode ok alkuun)
3. **Project settings → Your apps → Web** → kopioi konfiguraatio
4. Täytä arvot tiedostoon `.env` (katso `.env.example`)
5. Julkaise säännöt: `firebase deploy --only firestore:rules` (tai kopioi `firestore.rules` konsoliin)

Firestore-kokoelma: `players` – jokainen pelaaja omana dokumenttinaan.

| Kenttä | Kuvaus |
|--------|--------|
| `username` | Pelaajan nimi |
| `foundWords` | Löydetyt sanat (lista) |
| `wins` | Bingo-voitot (`timeMs`, `time`, `at`) |

### GitHub Pages

Lisää samat `VITE_FIREBASE_*` -arvot repoon **Settings → Secrets and variables → Actions**.

## Peli

1. Syötä käyttäjätunnus
2. Salasana: `hervantaralli` (`src/data/bingoWords.js`)
3. **Bingo** – pelaa, sekoita ruudukko, voita
4. **Tulostaulu** – eniten sanoja löytäneet + paras voittoaika
5. **Löydetyt sanat** – omat löydetyt sanat

## GitHub Pages

1. Työnnä repo GitHubiin
2. **Settings → Pages → Source:** GitHub Actions
3. Push `main`-haaraan → automaattinen deploy

## Rakenne

- `src/composables/useBingo.js` – pelilogiikka, localStorage
- `src/composables/usePlayerStats.js` – Firebase-synkronointi
- `src/firebase/config.js` – Firebase-alustus
- `src/components/` – Vue-komponentit
- `firestore.rules` – Firestore-tietoturvasäännöt
