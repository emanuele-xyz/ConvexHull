---
pagetitle: Manuale utente
header-includes: |
  \newcommand{\hquad}{\hspace{0.5em}}
  \newcommand{\hhquad}{\hspace{0.25em}}
---

L'[applicazione JavaScript](/applicazione.html) permette di visualizzare l'esecuzione degli algoritmi trattati, passo dopo passo.

È possibile cliccare sulla canvas per aggiungere un punto all'insieme di punti di input. Sopra a ciascun punto vengono visualizzate le sue coordinate. È importante notare che l'origine della canvas si trova in alto a sinistra, il che significa che l'asse delle ordinate cresce verso il basso.

L'esecuzione di un algoritmo può essere controllata tramite i seguenti pulsanti:

- **Step**: esegue un passo dell'algoritmo.
- **Continue**: esegue l'algoritmo fino alla fine.
- **Reset**: rimuove tutti i punti.
- **Undo**: rimuove l'ultimo punto inserito.

Per poter eseguire un algoritmo è necessario inserire almeno 3 punti. Inoltre, se si prova ad aggiungere un punto troppo vicino a uno esistente, viene mostrato un avviso.

È possibile selezionare l'algoritmo da eseguire tramite un menù a tendina che offre le seguenti opzioni:

- **Naive**, l'algoritmo presentato durante il corso, di complessità $O(n^3)$. Vengono visualizzati gli half-plane test eseguiti per ogni coppia di punti.

- **Divide and Conquer**, di complessità $O(n \hhquad log \hhquad n)$. Vengono visualizzate le chiamate ricorsive, la costruzione dei "sottoinvolucri" e la loro fusione.

  - **Divide and Conquer: Upper Tangent**, viene visualizzata la ricerca della tangente superiore durante il processo di fusione di due sottoinvolucri.

- **Akl-Toussaint**, di complessità $O(n \hhquad log \hhquad n)$. Vengono visualizzate la costruzione del quadrilatero (detto anche "kill zone") e l'eliminazione dei punti al suo interno.

  - **Akl-Toussaint: Convex Path**, viene isolata una regione del quadrilatero e visualizzata la ricerca del percorso convesso.

- **TORCH**, di complessità $O(n \hhquad log \hhquad n)$. Vengono visualizzati i punti $W, E, S, N$, la ricerca degli involucri laterali e la convessificazione.

  - **TORCH: South West Hull**, viene visualizzata la costruzione dell'involucro $SW$.

- **Bentley-Faust-Preparata Approximation**, di complessità $O(n)$. Vengono visualizzate le $k$ strisce verticali (con $k$ selezionabile tramite uno slider); per ogni striscia, i punti di $y$ minima e $y$ massima, l'involucro approssimato, e infine l'involucro reale calcolato con uno degli algoritmi sopracitati.

![](./diagramma_manuale.png){ style="height: 500px; display: block; margin: 50px auto;" }
