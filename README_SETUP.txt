TECH AFFARI ITALIA — ADMIN v3

OBIETTIVO
- Sistemare la parte finale del negozio con un blocco informativo compatto.
- Non modificare più app.js a mano per ogni prodotto.
- Aggiungere prodotti da una pagina Admin incollando il link affiliato Temu.
- Catalogo salvato su Cloudflare KV e letto automaticamente dalla WebApp.

FILE GITHUB
Sostituisci nella root:
- index.html
- styles.css
- app.js

Aggiungi la cartella:
- admin/index.html
- admin/admin.css
- admin/admin.js

La cartella assets già esistente resta invariata.

CLOUDFLARE
1) Crea un namespace KV, ad esempio: tech-affari-catalog
2) Nel Worker tech-affari-italia-api aggiungi un binding KV:
   Nome binding: CATALOG
   Namespace: tech-affari-catalog

3) In Settings > Runtime variables and secrets aggiungi un nuovo Secret:
   ADMIN_KEY
   Valore: scegli una password lunga e casuale, almeno 20 caratteri.
   NON inserire questa chiave nei file GitHub.

4) Sostituisci il codice del Worker con worker.js e fai Deploy.

5) Quando hai verificato che il nuovo sistema funziona, puoi eliminare i vecchi Secrets:
   BOT_TOKEN
   ADMIN_CHAT_ID
   perché il modello affiliato non riceve più ordini via bot.

AREA ADMIN
https://techaffariitalia.github.io/admin/

USO
- Inserisci ADMIN_KEY
- Incolla il link affiliato Temu
- Premi "Importa automaticamente"
- Il Worker prova a recuperare titolo, immagine e descrizione dalla pagina Temu
- Il prodotto compare subito nel catalogo pubblico
- Dall'Admin puoi correggere titolo, categoria, descrizione, immagine, link, visibilità o eliminare il prodotto

NOTA
Temu può cambiare il modo in cui espone i metadati. Se un'importazione non recupera titolo o immagine, il prodotto viene comunque creato e puoi correggerlo direttamente dall'Admin senza modificare codice.
