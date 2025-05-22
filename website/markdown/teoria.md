---
pagetitle: Teoria
header-includes: |
  \newcommand{\hquad}{\hspace{0.5em}}
  \newcommand{\hhquad}{\hspace{0.25em}}
---

# Indice <!-- omit in toc -->

- [Involucro convesso](#involucro-convesso)
  - [Rappresentare H](#rappresentare-h)
  - [Assunzioni sull'insieme di punti](#assunzioni-sullinsieme-di-punti)
  - [Lower bound della complessità del problema](#lower-bound-della-complessità-del-problema)
    - [Dimostrazione](#dimostrazione)
- [Involucri clockwise e counterclockwise](#involucri-clockwise-e-counterclockwise)
- [Algoritmo Naive](#algoritmo-naive)
  - [Idea](#idea)
  - [Half-plane test](#half-plane-test)
  - [Come trovare un vettore perpendicolare ad un altro?](#come-trovare-un-vettore-perpendicolare-ad-un-altro)
  - [Complessità temporale](#complessità-temporale)
- [Algoritmo Divide and Conquer](#algoritmo-divide-and-conquer)
  - [Idea](#idea-1)
  - [Fusione](#fusione)
  - [Ricerca tangente superiore](#ricerca-tangente-superiore)
  - [Ricerca tangente inferiore](#ricerca-tangente-inferiore)
  - [Costruzione di H](#costruzione-di-h)
  - [Complessità temporale](#complessità-temporale-1)
    - [Ricerca delle tangenti](#ricerca-delle-tangenti)
    - [Fusione](#fusione-1)
    - [Divide et Impera](#divide-et-impera)
    - [Complessità complessiva](#complessità-complessiva)
- [Algoritmo di Akl-Toussaint](#algoritmo-di-akl-toussaint)
  - [Idea](#idea-2)
    - [Euristica](#euristica)
    - [Ricerca dei percorsi convessi per ogni lato del quadrilatero](#ricerca-dei-percorsi-convessi-per-ogni-lato-del-quadrilatero)
    - [Costruzione dell'involucro convesso H](#costruzione-dellinvolucro-convesso-h)
  - [Ricerca di un percorso convesso di una data regione](#ricerca-di-un-percorso-convesso-di-una-data-regione)
  - [Complessità temporale](#complessità-temporale-2)
    - [Euristica](#euristica-1)
    - [Ricerca del percorso convesso](#ricerca-del-percorso-convesso)
    - [Costruzione di H](#costruzione-di-h-1)
    - [Complessità complessiva](#complessità-complessiva-1)
- [TORCH: Total Order Heuristic Based Convex Hull](#torch-total-order-heuristic-based-convex-hull)
  - [Idea](#idea-3)
  - [Ordinamento di S](#ordinamento-di-s)
  - [Costruzione di H'](#costruzione-di-h-2)
    - [Costruzione dell'involucro laterale NW](#costruzione-dellinvolucro-laterale-nw)
- [Benchmark degli algoritmi per il calcolo dell'involucro convesso](#benchmark-degli-algoritmi-per-il-calcolo-dellinvolucro-convesso)
- [Algoritmo di approssimazione di Bentley, Faust e Preparata](#algoritmo-di-approssimazione-di-bentley-faust-e-preparata)
  - [Idea](#idea-4)
    - [Complessità temporale](#complessità-temporale-3)
  - [Calcolo di S'](#calcolo-di-s)
    - [Proprietà](#proprietà)
      - [Dimostrazione](#dimostrazione-1)
    - [Proprietà](#proprietà-1)
      - [Dimostrazione](#dimostrazione-2)
    - [Corollario](#corollario)
      - [Dimostrazione](#dimostrazione-3)
    - [Complessità temporale](#complessità-temporale-4)

# Involucro convesso

![](./convex_hull_io.svg){ style="height: 190px; display: block; margin: auto;" }

**Input**: Insieme finito $S \subseteq \mathbb{R}^2$.

**Output**: Poligono convesso $H$ di area minima che contiene tutti i punti di $S$.

Denotiamo con:

- $P(H)$ l'insieme di vertici di $H$.
- $d$ la cardinalità di $P(H)$.
- $n$ la cardinalità di $S$.

**Proprietà**: $P(H) \subseteq S$.

**Corollario**: $d \le n$

## Rappresentare H

Rappresentiamo $H$ usando una lista ordinata di punti di $P(H)$:

$$P_1, P_2, P_3, ..., P_d \qquad P_i \in P(H), i = 1, ..., d$$

Tale che:

- $\forall i = 1, ..., d - 1$ il segmento di estremi $P_i$ e $P_{i+1}$ è un lato di $H$.
- Il segmento di estremi $P_d$ e $P_1$ è un lato di $H$.

## Assunzioni sull'insieme di punti

Nella nostra trattazione assumiamo che l'insieme di punti $S$ soddisfi le seguenti condizioni:

1. **Non collinearità.** Non esistono tre punti di $S$ che giacciono sulla stessa retta.

2. **Distanza minima.** Per ogni coppia di punti $a,b\in S$, imponiamo
   $$\Delta X \ge 1 \quad \textrm{e} \quad \Delta Y \ge 1$$
   Dove
   $$\Delta X = |a_x - b_x| \quad \textrm{e} \quad \Delta Y = |a_y - b_y|$$
   In tal modo due punti non possono trovarsi "troppo" vicini tra loro.

## Lower bound della complessità del problema

Il lower bound del problema è $\Omega(n \hhquad log \hhquad n)$.

### Dimostrazione

![](./lower_bound.svg){ style="height: 300px; display: block; margin: auto;" }

Supponiamo di avere il seguente insieme finito di numeri

$$I = \{ x_1, x_2, x_3, ..., x_n \} \subseteq \mathbb{R} \quad \textrm{dove} \quad x_1 < x_2 < x_3 < ... < x_n$$

Definiamo il seguente insieme

$$S = \{ (x_i, x_i^2) \mid x_i \in I \} \subseteq \mathbb{R}^2$$

Notiamo come i punti di $S$ giacciono su una parabola. Proprio per questo, è facile vedere che un possibile involucro convesso di $S$ è dato dalla lista $(x_1, x_1^2), (x_2, x_2^2), ..., (x_n, x_n^2)$.

Se ottenessimo una qualsiasi altra lista, potremmo ottenere quella mostrata sopra in tempo $O(d)$ e dunque $O(n)$.

Supponiamo ora, per assurdo, di essere in grado di trovare l'involucro convesso di $S$ in tempo inferiore a $O(n \hhquad log \hhquad n)$.

Se questo fosse il caso, prendendo la prima proiezione della lista $(x_1, x_1^2), (x_2, x_2^2), ..., (x_n, x_n^2)$. otterremo la lista $x_1, x_2, ..., x_n$. Dunque saremmo in grado di ordinare l'insieme $I$ in tempo inferiore a $O(n \hhquad log \hhquad n)$.

Questo è assurdo. $\square$

# Involucri clockwise e counterclockwise

Come abbiamo già detto, rappresentiamo l'involucro convesso $H$ usando una lista dei punti di $P(H)$.

Consideriamo il seguente involucro convesso $H$:

![](./involucro_triangolare.svg){ style="height: 170px; display: block; margin: auto;" }

Possiamo rappresentare $H$ usando entrambe queste liste:

$$\vec{u}, \vec{v}, \vec{w} \quad \textrm{e} \quad \vec{u}, \vec{w}, \vec{v}$$

Osserviamo come la prima lista elencai punti di $H$ in senso antiorario. La seconda lista invece elenca i punti in senso orario [^1].

[^1]: Non vi sono altre orientazioni possibili.

Nella nostra trattazione, per convenzione e per facilitare l'implementazione degli algoritmi, useremo e ritorneremo sempre liste che elencano i punti dell'involucro convesso in senso orario.

Di rado può accadere di dover controllare se un involucro convesso è espresso in senso orario o antiorario. Per fare questo:

- Prendiamo tre punti qualsiasi $\vec{u}, \vec{v}, \vec{w}$ **consecutivi**.

- Consideriamo i due vettori $\vec{v} - \vec{u} \hquad \textrm{e} \hquad \vec{w} - \vec{v}$.

  - Se $det \begin{pmatrix} \vec{v}_x - \vec{u}_x & \vec{w}_x - \vec{v}_x \\ \vec{v_y} - \vec{u_y} & \vec{w_y} - \vec{v_y} \end{pmatrix} > 0$, allora siamo in senso antiorario.

  - Se $det\begin{pmatrix} \vec{v}_x - \vec{u}_x & \vec{w}_x - \vec{v}_x \\ \vec{v_y} - \vec{u_y} & \vec{w_y} - \vec{v_y} \end{pmatrix} < 0$, allora siamo in senso orario.

  - Se il determinante è uguale a zero allora i tre punti hanno la stessa direzione e dunque sono collineari. Ricordiamo che non consideriamo punti collineari.

Se l'involucro è espresso in un senso, per esprimerlo nell'altro bisogna semplicemente invertire l'ordine della lista.

# Algoritmo Naive

## Idea

Per ogni coppia di punti $\vec{u}, \vec{v} \in S$, con $\vec{u} \neq \vec{v}$:

Consideriamo la retta $r$ passante per $\vec{u}$ e $\vec{v}$.

Questa divide il piano $\Pi$ in due semipiani, $\Pi^+ \hquad \textrm{e} \hquad \Pi^-$.

Per ogni punto $\vec{p} \in S$ con $\vec{p} \neq \vec{u} \hquad \textrm{e} \hquad \vec{p} \neq \vec{v}$ controlliamo se $\vec{p}$ cade in $\Pi^+ \hquad \textrm{o} \hquad \textrm{in} \hquad \Pi^-$.

Se tutti i punti sono caduti esclusivamente in uno dei due semipiani, allora il segmento con estremi $\vec{u} \hquad \textrm{e} \hquad \vec{v}$ è un lato dell'involucro convesso.

## Half-plane test

![](./half_plane_test.svg){ style="height: 300px; display: block; margin: auto;" }

Come possiamo controllare se un punto $\vec{p}$ cade in $\Pi^+ \hquad \textrm{o} \hquad \Pi^-$?

Supponiamo che il vettore $\vec{v} - \vec{u}$ è un possibile vettore direzione della retta $r$.

Dato il vettore $\vec{v} - \vec{u}$ troviamo un vettore $\vec{n}$ perpendicolare ad esso.

$\vec{n}$ è una possibile normale della retta $r$.

Dato un qualsiasi punto $\vec{p}$:

1. Prendiamo il vettore $\vec{p} - \vec{u}$.
2. Se $\vec{n} \cdot (\vec{p} - \vec{u}) > 0$, allora siamo in $\Pi^+$. <br />
   Se $\vec{n} \cdot (\vec{p} - \vec{u}) < 0$, allora siamo in $\Pi^-$.

## Come trovare un vettore perpendicolare ad un altro?

![](./vettori_perpendicolari.svg){ style="height: 250px; display: block; margin: auto;" }

Consideriamo il vettore $\vec{v} \leftrightarrow \begin{bmatrix} v_x \\ v_y \end{bmatrix}$.

Un vettore $\vec{u} \leftrightarrow \begin{bmatrix} u_x \\ u_y \end{bmatrix}$ è perpendicolare a $\vec{v}$ se e solo se $\vec{u} \cdot \vec{v} = 0$.

Vogliamo determinare $u_x \hquad \textrm{e} \hquad u_y$, essendo a conoscenza di $v_x \hquad \textrm{e} \hquad v_y$.

Sappiamo che $\vec{u} \cdot \vec{v} = 0$ se e solo se $u_x v_x + u_y v_y = 0$.

Dunque $u_x = - \dfrac{u_y v_y}{v_x}$

Fissando $u_y = v_x$, abbiamo che $u_x = - \dfrac{v_x v_y}{v_x} = -v_y$

## Complessità temporale

- Iterare per ogni coppia di punti $\rightarrow O(n^2)$.
  - Iterare per ogni punto $\rightarrow O(n)$.
- Combinando le due iterazioni, vediamo come la complessità temporale dell'algoritmo è $O(n^3)$.

# Algoritmo Divide and Conquer

## Idea

Sia $P$ la lista dei punti di $S$, ordinata in ordine decrescente della loro componente $x$.

Dividiamo $P$ a metà, ottenendo così le liste $A$ e $B$.

Applichiamo ricorsivamente l'algoritmo "Divide et Impera" su $A$ e su $B$, ottenendo così gli involucri convessi $H_a$ e $H_b$ rispettivamente, degli insieme di punti dati dalle liste $A$ e $B$.

Fondiamo $H_a$ e $H_b$, ottenendo così l'involucro $H$.

## Fusione

Dati due involucri convessi $H_a$ e $H_b$, vogliamo trovare l'involucro convesso $H$ dell'uniione dei vertici di $H_a$ e $H_b$.

Possiamo fare questo sfruttando il fatto che:

- $H_a$ e $H_b$ sono involucri convessi.
- $H_a$ è alla sinistra di $H_b$.

Per quanto detto sopra, è facile vedere che l'involucro convesso $H$ risultato dalla fusione di $H_a$ e $H_b$ è composto da:

- Una porzione dell'involucro di $H_a$.
- Una porzione dell'involucro di $H_b$.
- Due segmenti, dette tangenti, ognuna con estremi sia un vertice di $H_a$ che un vertice di $H_b$.

La procedura di fusione si riduce dunque alla ricerca di queste due tangenti, una detta tangente superiore, e l'altra detta tangente inferiore. Per trovarle utilizzeremo il cosiddetto "two fingers method".

## Ricerca tangente superiore

Sia $r_a$ il punto più a destra di $H_a$.

Sia $l_b$ il punto più a sinistra di $H_b$.

Consideriamo la retta $r: x = m, \hquad \textrm{dove} \hquad m = \dfrac{(r_a)_x + (l_b)_x}{2}$

Percorriamo simultaneamente:

- $H_a$ in senso **antiorario**, partendo da $r_a$.
- $H_b$ in senso **orario**, partendo da $l_b$.

Cercando il segmento il segmento di estremi $p$ e $q$, con $p$ vertice di $H_a$ e $q$ vertice di $H_b$, tale per cui la sua intersezione con $r$ abbia componente $y$ massima.

Il segmento $pq$ è la tangente superiore.

## Ricerca tangente inferiore

Sia $r_a$ il punto più a destra di $H_a$.

Sia $l_b$ il punto più a sinistra di $H_b$.

Consideriamo la retta $r: x = m, \hquad \textrm{dove} \hquad m = \dfrac{(r_a)_x + (l_b)_x}{2}$

Percorriamo simultaneamente, in modo alternato:

- $H_a$ in senso **orario**, partendo da $r_a$.
- $H_b$ in senso **antiorario**, partendo da $l_b$.

Cercando il segmento il segmento di estremi $p$ e $q$, con $p$ vertice di $H_a$ e $q$ vertice di $H_b$, tale per cui la sua intersezione con $r$ abbia componente $y$ minima.

Il segmento $pq$ è la tangente inferiore.

## Costruzione di H

Per costruire $H$, percorriamo:

- $H_a$, partendo dal vertice appartenente alla tangente inferiore fino al vertice appartenente alla tangente superiore, procedendo in senso orario.

- $H_b$, partendo dal vertice appartenente alla tangente superiore fino al vertice appartenente alla tangente inferiore, procedendo in senso orario.

## Complessità temporale

### Ricerca delle tangenti

Usando un approccio naive, possiamo cercare una tangente andando ad esaminare tutte le coppie di punti $(p, q) \in P(H_a) \times P(H_b)$ ed usare il "two fingers method" per trovare la tangente cercata.

Siccome $\left| P(H_a) \right| \hquad \textrm{e} \hquad \left| P(H_b) \right|$ sono $O(n)$, questo metodo naive richiederebbe un tempo $O(n^2)$.

<!-- TODO: forse sarebbe meglio utilizzare la spiegazione del two fingers method del blog post? -->

Tuttavia possiamo fare di meglio se sfruttiamo il fatto che sia $H_a$ che $H_b$ sono poligoni convessi.

Percorriamo simultaneamente, in modo alternato, $H_a$ e $H_b$. Ad ogni iterazione, confrontiamo tre segmenti:

1. Il segmento tra il vertice corrente di $H_a$ e il vertice corrente di $H_b$.
2. Il segmento tra il vertice corrente di $H_a$ e il vertice successivo di $H_b$.
3. Il segmento tra il vertice successivo di $H_a$ e il vertice corrente di $H_b$.

Se 2. è "migliore" di 1., allora avanziamo il vertice corrente di $H_b$. Se 3. migliore di 1., allora avanziamo il vertice corrente di $H_a$. Altrimenti terminiamo la visita.

Guardando come visitiamo i vertici di $H_a$ e $H_b$, vediamo che:

- Ad ogni iterazione, consideriamo sempre un nuovo vertice.
- Possiamo all'iterazione successiva solo se abbiamo trovato un miglior candidato come tangente.

Dunque, per trovare la tangente, ogni vertice di $H_a$ e $H_b$ sarà visitato al più un volta.

Dunque, la complessità temporale della ricerca di una tangente è $O(n)$.

### Fusione

Il processo di fusione consiste in:

1. Cercare la tangente superiore $\rightarrow O(n)$
2. Cercare la tangente inferiore $\rightarrow O(n)$
3. Costruire H $\rightarrow O(n)$

Perciò, il processo di fusione ha complessità temporale $O(n)$.

### Divide et Impera

Possiamo vedere che:

- Ordinamento dei punti in input $\rightarrow O(n \hhquad log \hhquad n)$.
  - È necessario fare questo ordinamento una volta sola.
- Applichiamo Divide et Impera ricorsivamente sulle due metà dell'input $\rightarrow 2T(\dfrac{n}{2})$.
- Fusione $\rightarrow O(n)$.

La complessità temporale dell'applicazione ricorsiva dell'algoritmo è espressa dalla seguente relazione di ricorrenza:

$$T(n) = 2T(\dfrac{n}{2}) + n$$

È facile vedere che $T(n) = O(n \hhquad log \hhquad n)$.

### Complessità complessiva

Dunque, per quanto detto sopra la complessità temporale complessiva è $O(n \hhquad log \hhquad n)$.

# Algoritmo di Akl-Toussaint

## Idea

### Euristica

Determiniamo i seguenti punti di $S$:

- $\textrm{XMIN}$, di minima $x$.
- $\textrm{YMAX}$, di massima $y$.
- $\textrm{XMAX}$, di massima $x$.
- $\textrm{YMIN}$, di minima $y$.

Questi quattro punti appartengono certamente a $P(H)$. Oltretutto, osserviamo che tutti i punti di $S$ che cadono all'interno del quadrilatero di vertici $\textrm{XMIN}$, $\textrm{YMAX}$, $\textrm{XMAX}$, $\textrm{YMIN}$, **sicuramente** non fanno parte di $P(H)$.

Dunque possiamo eliminare tali punti da $S$.

### Ricerca dei percorsi convessi per ogni lato del quadrilatero

![](./akl_toussaint_quadrilatero.svg){ style="height: 400px; display: block; margin: auto;" }

Osserviamo come su ogni lato del quadrilatero soggiace una regione. Quello che facciamo è percorrere il quadrilatero in senso orario e, per ogni regione, cercare il percorso convesso che ci porta da un estremo all'altro del lato su cui soggiace la suddetta regione.

### Costruzione dell'involucro convesso H

Una volta che abbiamo determinato i vari percorsi convessi per le relative regioni, andiamo a fonderli seguendo il senso orario di percorrenza dei lati del quadrilatero. La loro fusione risulta in $H$.

## Ricerca di un percorso convesso di una data regione

Sia $R$ l'insieme di punti che cadono nella regione (compresi gli estremi del lato su cui soggiace la regione).

Se siamo nella regione 1, o nella regione 2, ordiniamo i punti di $R$ in ordine crescente di $x$, risultando nella lista di punti $P$.

Se siamo nella regione 3, o nella regione 4, ordiniamo i punti di $R$ in ordine decrescente di $x$, risultando nella lista di punti $P$.

1. Per ogni tripla di punti consecutivi $(P_k, P_{k+1}, P_{k+2})$ in $P$:

   - Calcoliamo $det \begin{pmatrix} (P_{k+2} - P_{k+1})_x & (P_{k+1} - P_{k})_x \\ (P_{k+2} - P_{k+1})_y & (P_{k+1} - P_{k})_y \end{pmatrix}$

   - Se tale determinante è:

     - Maggiore o uguale a 0, passiamo alla successiva tripla $(P_{k+1}, P_{k+2}, P_{k+3})$ di punti consecutivi in $P$.

     - Minore di 0, eliminiamo il punto $P_{k+1}$ dalla lista $P$ e passiamo alla tripla $(P_{k-1}, P_k, P_{k+2})$ di punti consecutivi in $P$.

2. Se abbiamo completato (1) senza avere rimosso nessun punto di $P$, allora ci fermiamo, altrimenti ripetiamo (1).

Quando ci fermeremo, la lista $P$ sarà proprio la lista di punti, in senso orario, del percorso convesso che stavamo cercando.

![](./akl_toussaint_determinante.svg){ style="height: 300px; display: block; margin: auto;" }

## Complessità temporale

### Euristica

1. Cercare $\textrm{XMIN}$, $\textrm{YMAX}$, $\textrm{XMAX}$, $\textrm{YMIN}$ richiede una semplice scansione di $S$ $\rightarrow O(n)$
2. Eliminare i punti di $S$ che cadono all'interno del quadrilatero richiede, per ciascun punto, fino a quattro half-plane test (uno per ogni lato del quadrilatero) $\rightarrow O(n)$

### Ricerca del percorso convesso

L'articolo di riferimento afferma che tale ricerca impieghi tempo $O(n \hhquad log \hhquad n)$, dovuto all'ordinamento dei punti appartenenti alle varie regioni.

### Costruzione di H

Per costruire $H$ è sufficiente scandire i percorsi convessi trovati $\rightarrow O(n)$

### Complessità complessiva

Di conseguenza, la complessità temporale complessiva è $O(n \hhquad log \hhquad n)$.

# TORCH: Total Order Heuristic Based Convex Hull

## Idea

A grandi linee TORCH:

1. Ordina $S$.
2. Costruisce un involucro approssimate **non** convesso $H'$.
3. Costruisce $H$ a partire da $H'$ usando un processo di **convessificazione**.

## Ordinamento di S

Ordiniamo i punti di $S$ in ordine crescente di $x$, risultando nella lista di punti $P$.

## Costruzione di H'

Siano:

- $W$, il punto di $P$ con $x$ minima.
- $E$, il punto di $P$ con $x$ massima.
- $S$, il punto di $P$ con $y$ minima.
- $N$, il punto di $P$ con $y$ massima.

Troviamo i quattro percorsi seguenti, detti "involucri laterali":

- $\Pi_{nw}$, da $W$ a $N$
- $\Pi_{ne}$, da $E$ a $N$
- $\Pi_{sw}$, da $W$ a $S$
- $\Pi_{se}$, da $E$ a $S$

Costruiamo $H'$ concatenando $\Pi_{nw}, \Pi_{ne}, \Pi_{sw} \hquad \textrm{e} \hquad \Pi_{se}$ in modo appropriato.

### Costruzione dell'involucro laterale NW

Costruiamo $\Pi_{nw}$ nel modo seguente:

- All'inizio $\Pi_{nw} = W$.
- Scandiamo $P$, andando da $W$ a $N$, e ogni volta che incontriamo un punto $p$, con coordinata $y$ maggiore della massima $y$ incontrata durante la scansione di $P$, da $W$ fino a $p$, aggiungiamo $p$ in coda a $\Pi_{nw}$.

Possiamo osservare che, alla fine della sua costruzione, $\Pi_{nw}$ avrà la struttura seguente:

$$\Pi_{nw} : W = p_0, p_1, p_2, ..., p_{k_{nw}} = N$$

Dove

- $\forall i = 1, ..., k_{nw} \quad (p_{i-1})_x < (p_i)_x$
- $\forall i = 1, ..., k_{nw} \quad (p_{i-1})_y < (p_i)_y$

# Benchmark degli algoritmi per il calcolo dell'involucro convesso

<canvas id="canvas" width="600" height="400"></canvas>

# Algoritmo di approssimazione di Bentley, Faust e Preparata

Un algoritmo di approssimazione, al contrario dei classici algoritmi che più comunemente si studiano, non da garanzie di trovare la soluzione corretta, bensì ne trova una che, in generale, sarà "abbastanza buona".

Con "abbastanza buona" si intende che la distanza tra la soluzione e quella corretta è minore di un dato valore di soglia. La funzione distanza tra le due soluzioni, di norma, emerge naturalmente dalla natura del problema trattato, e dalle sue soluzioni.

Usiamo un algoritmo di approssimazione quando per noi non è strettamente necessario trovare la soluzione esatta.

Ha senso pratico usare un algoritmo di approssimazione solo nel caso in cui il suo tempo di esecuzione sia inferiore al tempo di esecuzione di un qualsiasi algoritmo esatto per il problema. Se questo non fosse il caso, potremmo direttamente trovare la soluzione esatta in un tempo inferiore rispetto a quella approssimata.

## Idea

Presentiamo ora uno schema generale per la definizione di algoritmi di approssimazione per il problema dell'involucro convesso:

1. Sia $S'$ un insieme di punti calcolato a partire da $S$.
2. Determiniamo $H'$, l'involucro convesso di $S'$, eseguendo un algoritmo per la ricerca dell'involucro convesso su $S'$.
3. Usiamo $H'$ come soluzione approssimata per $H$.

### Complessità temporale

Sia:

- $T_{s'}$ la funzione che caratterizza la complessità temporale del calcolo di $S'$.
- $m = | S' |$
- $T$ la funzione che caratterizza la complessità temporale dell'algoritmo usato per trovare $H'$.

Dunque, è chiaro che la complessità temporale di un qualsiasi algoritmo di approssimazione che usa lo schema presentato sopra è:

$$T_{s'}(n) + T(m)$$

## Calcolo di S'

L'aspetto più interessante dello schema generale per la definizione di algoritmi di approssimazione dell'involucro convesso è il calcolo di $S'$. Vi sono innumerevoli strategie che possiamo usare per calcolare $S'$. Quella che presenteremo è stata proposta da Bentley, Faust e Preparata nel 1988.

Consideriamo i quattro punti seguenti di $S$:

- $\textrm{XMAX}$, di massima $x$.
- $\textrm{XMIN}$, di minima $x$.
- $\textrm{YMAX}$, di massima $y$.
- $\textrm{YMIN}$, di minima $y$.

Poniamo $S' = \{ \textrm{XMIN}, \textrm{XMAX}, \textrm{YMIN}, \textrm{YMAX} \}$. È chiaro che $H'$ è il quadrilatero convesso $Q$ di vertici $\textrm{XMIN}, \textrm{XMAX}, \textrm{YMIN}, \textrm{YMAX}$.

### Proprietà

Per ogni punto $p \in S$, se $p$ cade al di fuori del quadrilatero $Q$ allora la distanza tra $p$ e $Q$ è al più $\Delta X$, dove $\Delta X = \textrm{XMAX}_x - \textrm{XMIN}_x$.

#### Dimostrazione

Sia $R$ il rettangolo con diagonale il segmento di estremi $(\textrm{XMIN}_x, \textrm{YMIN}_y)$ e $(\textrm{XMAX}_x, \textrm{YMAX}_y)$.

È facile vedere che tutti i punti $p \in S$ cadono all'interno di $R$.

Un qualsiasi punto $p \in S$ che cade al di fuori del quadrilatero deve essere in una delle quattro regioni $A, B, C \hhquad o \hhquad D$ sotto riportate.

![](./q_and_r.svg){ style="height: 350px; display: block; margin: auto;" }

Prendiamo, senza perdita di generalità, un generico punto $p \in S$ che cade nella regione $A$. Naturalmente, la distanza $\delta$ tra $p$ e $Q$ è data dalla distanza tra $p$ e il segmento $\textrm{XMIN}, \textrm{YMAX}$.

Denotiamo con $\delta x$, la lunghezza del segmento con estremi:

- $p$, e
- il punto di intersezione tra il segmento $\textrm{XMIN}, \textrm{YMAX}$ e la retta parallela all'asse delle $x$ passante per $p$.

![](./distance_and_dx_quad.svg){ style="height: 350px; display: block; margin: auto;" }

È facile osservare come $\delta \le \delta x \le \Delta X$. $\square$

Possiamo immaginare di aver calcolato $S'$ nel modo seguente:

- Aggiungiamo a $S'$ il punto $\textrm{XMIN}$.

- Aggiungiamo a $S'$ il punto $\textrm{XMAX}$.

- Consideriamo l'intervallo $[\textrm{XMIN}_x, \textrm{XMAX}_x]$. Questo può essere visto come una striscia verticale sul piano. Tutti i punti di $S$ cadono all'interno di questa striscia. Cerchiamo i due punti della striscia con $y$ minima e $y$ massima e li aggiungiamo a $S'$.

Possiamo estendere la costruzione esposta sopra ad un generico numero $k$ di strisce di larghezza uniforme:

- Aggiungiamo a $S'$ il punto $\textrm{XMIN}$.

- Aggiungiamo a $S'$ il punto $\textrm{XMAX}$.

- Consideriamo l'intervallo $[\textrm{XMIN}_x, \textrm{XMAX}_x]$ e lo partizioniamo in $k$ sotto intervalli (strisce), ognuno di ampiezza $\dfrac{\Delta X}{k}$.

- Per ogni sotto intervallo (striscia), cerchiamo, tra i punti di $S$ che cadono nella striscia, i due che hanno $y$ minima e $y$ massima, e li aggiungiamo a $S'$.

**Osservazione:** Possiamo osservare che, per costruzione di $S'$ si ha che $P(H') \subseteq P(H)$.

### Proprietà

Per ogni punto $p \in S$, se $p$ cade al di fuori di $H'$ [^2] allora la distanza tra $p$ e $H'$ è al più $\dfrac{\Delta X}{k}$.

[^2]: Questo significa che $p$ non è stato preso dal campionamento.

#### Dimostrazione

Consideriamo un qualsiasi punto $p \in S$ che cade al di fuori di $H'$. Per costruzione, $p$ deve cadere all'interno di una data striscia.

Siccome $p$ cade al di fuori di $H'$, $p$ non può né avere $y$ minima né $y$ massima nella striscia. Dunque, $p_y$ deve essere compreso tra questi due valori, esclusi. Perciò, nella striscia in cui cade $p$, devono cadere almeno altri due punti. Oltretutto, almeno un punto $h$ tra questi due deve appartenere a $P(H')$. Dunque, la distanza $\delta$ tra $p$ e $H'$ è data dalla distanza tra uno dei due lati di $H'$ che ha $h$ come uno dei due estremi.

Denotiamo con $\delta x$ la lunghezza del segmento che ha come estremi:

- $p$, e
- l'intersezione tra il suddetto lato di $H'$ e la retta parallela all'asse $x$ passante per $p$.

![](./distance_and_dx_strip.svg){ style="height: 350px; display: block; margin: auto;" }

Possiamo vedere che $\delta \le \delta x \le \dfrac{\Delta X}{k}$. $\square$

### Corollario

Per ogni punto $p \in S$, se $p$ cade al di fuori di $H'$ allora la distanza tra $p$ e $H'$ è al più $\dfrac{D}{k}$, dove $D$ è il diametro di $S$. Il diametro è definito come la massima distanza tra due generici punti di $S$.

#### Dimostrazione

Per definizione di $D$, $\Delta X \le D$. Questo assieme a quanto dimostrato precedentemente è sufficiente a provare il corollario. $\square$

### Complessità temporale

1. Ricerca di $\textrm{XMIN}$ e $\textrm{XMAX}$ $\rightarrow O(n)$
2. Partizionamento dell'intervallo $[\textrm{XMIN}_x, \textrm{XMAX}_x]$ in $k$ sotto intervalli $\rightarrow O(n)$
3. Ricerca dei punti di $y$ minima e $y$ massima per ogni sotto intervallo $\rightarrow O(n)$

Dunque, la complessità dell'algoritmo è $O(n)$.
