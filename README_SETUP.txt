TECH AFFARI ITALIA — ADMIN v4

NOVITÀ v4
- Le immagini nel negozio vengono mostrate INTERE per impostazione predefinita (object-fit: contain).
- Niente più zoom/tagli automatici delle foto prodotto.
- Nell'Admin ogni prodotto ha:
  • anteprima immagine
  • URL immagine visualizzata modificabile
  • pulsante Anteprima
  • pulsante Ripristina immagine automatica
  • scelta “Mostra intera” / “Riempi il riquadro”
- Il Worker conserva sia l'immagine automatica recuperata da Temu sia l'eventuale immagine personalizzata.
- I prodotti già presenti nel KV vengono compatibilizzati automaticamente: non devi ricrearli.

AGGIORNAMENTO GITHUB
Sostituisci:
- index.html
- styles.css
- app.js

Sostituisci nella cartella admin:
- admin/index.html
- admin/admin.css
- admin/admin.js

Non cancellare la cartella assets.

AGGIORNAMENTO CLOUDFLARE
- Sostituisci il codice del Worker con worker.js
- Mantieni il binding KV:
  CATALOG → tech-affari-catalog
- Mantieni il Secret ADMIN_KEY
- Fai Deploy

AREA ADMIN
https://techaffariitalia.github.io/admin/

COME CAMBIARE UNA FOTO
1. Apri l'Admin.
2. Inserisci ADMIN_KEY.
3. Trova il prodotto.
4. Nel campo “URL immagine visualizzata” incolla l'URL della foto desiderata.
5. Premi “Anteprima”.
6. Lascia “Mostra intera (consigliato)” per evitare tagli.
7. Premi “Salva”.
8. Il negozio si aggiorna automaticamente.

Se vuoi tornare alla foto recuperata durante l'importazione, premi:
“Ripristina immagine automatica” → “Salva”.
