# Pispala Bingo

Mobiili-first bingopeli Tampere/Pispala-pubikierros-teemalla. SNES-pikselityyli, tila säilyy localStoragessa.

## Kehitys

```bash
npm install
npm run dev
```

Avaa selaimessa osoite, jonka Vite tulostaa (yleensä http://localhost:5173).

## Peli

1. Syötä käyttäjätunnus
2. Salasana: `hervantaralli` (muokattavissa `src/data/bingoWords.js`)
3. Sekoita ruudukko tarvittaessa
4. Paina ruutuja – ensimmäinen painallus käynnistää ajastimen
5. Voita täyttämällä rivi, pysty tai diagonaali

Sanalista: `src/data/bingoWords.js`

## GitHub Pages

1. Työnnä repo GitHubiin
2. **Settings → Pages → Build and deployment → Source:** valitse **GitHub Actions**
3. Push `main`-haaraan → workflow buildaa ja julkaisee automaattisesti

Vite käyttää `base: './'`, joten peli toimii GitHub Pages -poluissa ilman repo-nimen kovakoodausta.

## Rakenne

- `src/composables/useBingo.js` – tila, localStorage, voittotarkistus
- `src/components/` – Vue-komponentit
- `src/data/bingoWords.js` – sanalista ja salasana
- `src/styles/snes.css` – SNES-tyyli
