# Meeting Agenda Timer

**Il tuo copilota per riunioni produttive. Tieni traccia del tempo, analizza le performance e non andare mai più fuori tempo massimo.**

Questo strumento web, costruito con tecnologie moderne, è progettato per chiunque voglia portare ordine, efficienza e responsabilità nelle proprie riunioni. Dimentica le agende che vengono ignorate e le discussioni che si protraggono all'infinito. Con Meeting Agenda Timer, ogni punto all'ordine del giorno ha un tempo definito, e ogni deviazione viene monitorata in tempo reale.

**Guardalo in azione:**  ➡️➡️➡️ https://menteora.github.io/meeting-agenda-timer/

## ✨ Funzionalità Principali

*   **⏱️ Timer Intelligente e Countdown Visivo**: Un timer centrale e ben visibile mostra il tempo rimanente per l'attività in corso. Il colore del countdown cambia dinamicamente per segnalare quando il tempo sta per scadere o quando si è andati in overtime, mantenendo alta l'attenzione di tutti.

*   **📋 Gestione Dinamica dell'Agenda**:
    *   Aggiungi, modifica, elimina e duplica attività al volo.
    *   Riordina l'agenda con un semplice **drag-and-drop**.
    *   Modifica le durate pianificate direttamente dall'interfaccia.

*   **📊 Analisi delle Performance in Tempo Reale**:
    *   Visualizza la **deviazione parziale** (quanto l'attività corrente è in anticipo o in ritardo) e la **deviazione totale** (l'impatto complessivo sulla fine della riunione).
    *   L'orario di fine previsto viene ricalcolato dinamicamente, offrendo una proiezione realistica basata sull'andamento attuale.

*   **🔄 Import/Export Flessibile (CSV)**:
    *   **Esporta i Dati Completi**: Salva un resoconto dettagliato della riunione (tempi previsti, effettivi, orari di inizio/fine) per la reportistica.
    *   **Importa Dati Storici**: Carica i dati di una riunione passata per analizzarla.
    *   **Esporta come Template**: Salva la struttura di una riunione (solo attività e tempi previsti) per riutilizzarla in futuro.
    *   **Importa da Template**: Avvia una nuova riunione da un modello predefinito.

*   **🎨 Visualizzazione Dati Avanzata**:
    *   Una **tabella riepilogativa** mostra tutti i dettagli di ogni attività. I campi chiave (durata effettiva, inizio, fine) sono modificabili direttamente dalla tabella per correzioni manuali.
    *   Un **grafico a barre** confronta il tempo pianificato con quello effettivo per ogni attività, offrendo un colpo d'occhio immediato sull'efficienza della riunione.
    *   Esporta il grafico come **immagine PNG** da includere in presentazioni o verbali.

*   **🚀 Interfaccia Moderna e Reattiva**:
    *   Costruita con **React e TypeScript** per un'esperienza fluida e type-safe.
    *   Stile moderno e pulito grazie a **Tailwind CSS**, con un tema scuro per non affaticare la vista.
    *   Completamente reattiva, funziona su desktop, tablet e dispositivi mobili.

## 🛠️ Stack Tecnologico

*   **Linguaggio**: TypeScript
*   **Framework**: React 19
*   **Styling**: Tailwind CSS
*   **Drag & Drop**: `@dnd-kit`
*   **Grafici**: `Chart.js` con `react-chartjs-2`
*   **Ambiente**: Nessun build step richiesto. Funziona direttamente nel browser tramite import map ES6.

## 🚀 Come Iniziare

Questo progetto è configurato per funzionare senza un processo di build complesso. È sufficiente servire i file statici con un qualsiasi server web locale.

1.  **Clona il repository:**
    ```bash
    git clone https://github.com/tuo-utente/meeting-agenda-timer.git
    cd meeting-agenda-timer
    ```

2.  **Avvia un server web locale:**
    Dato che il progetto usa i moduli ES6 (`<script type="module">`), non puoi semplicemente aprire il file `index.html` direttamente nel browser. Hai bisogno di un server. Se hai Python installato, puoi usare il suo server integrato:

    ```bash
    # Per Python 3
    python -m http.server

    # Per Python 2
    python -m SimpleHTTPServer
    ```
    In alternativa, puoi usare `npx serve` o qualsiasi altra estensione del tuo editor di codice (come Live Server per VS Code).

3.  **Apri l'applicazione:**
    Apri il tuo browser e naviga all'indirizzo fornito dal server (solitamente `http://localhost:8000` o `http://localhost:3000`).

## ✍️ Utilizzo

1.  **Popola l'Agenda**: Inizia aggiungendo le tue attività manualmente tramite il form "Aggiungi Attività" oppure importa un template CSV.
2.  **Imposta l'Inizio**: Regola l'orario di inizio della riunione nel pannello del timer.
3.  **Avvia la Riunione**: Clicca sul pulsante "Play" della prima attività per avviare il timer.
4.  **Progredisci**: Man mano che completi un'attività, avvia la successiva. Il sistema registrerà automaticamente i tempi.
5.  **Analizza e Esporta**: A fine riunione, analizza i dati nella tabella e nel grafico. Esporta i dati e/o il grafico per i tuoi archivi.
