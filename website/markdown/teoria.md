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
  - [Lower bound della complessità del problema (in dipendenza da n)](#lower-bound-della-complessità-del-problema-in-dipendenza-da-n)
    - [Dimostrazione](#dimostrazione)
- [Involucri clockwise e counterclockwise](#involucri-clockwise-e-counterclockwise)
  - [Spiegazione](#spiegazione)
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
    - [Divide and Conquer](#divide-and-conquer)
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
    - [Costruzione dell'involucro laterale NE](#costruzione-dellinvolucro-laterale-ne)
    - [Costruzione dell'involucro laterale SW](#costruzione-dellinvolucro-laterale-sw)
    - [Costruzione dell'involucro laterale SE](#costruzione-dellinvolucro-laterale-se)
    - [Concatenazione degli involucri laterali](#concatenazione-degli-involucri-laterali)
    - [Convessificazione di H'](#convessificazione-di-h)
    - [Complessità temporale](#complessità-temporale-3)
- [Benchmark degli algoritmi per il calcolo dell'involucro convesso](#benchmark-degli-algoritmi-per-il-calcolo-dellinvolucro-convesso)
- [Algoritmo di approssimazione di Bentley, Faust e Preparata](#algoritmo-di-approssimazione-di-bentley-faust-e-preparata)
  - [Idea](#idea-4)
    - [Complessità temporale](#complessità-temporale-4)
  - [Determinazione di S'](#determinazione-di-s)
    - [Proprietà](#proprietà)
      - [Dimostrazione](#dimostrazione-1)
    - [Proprietà](#proprietà-1)
      - [Dimostrazione](#dimostrazione-2)
    - [Corollario](#corollario)
      - [Dimostrazione](#dimostrazione-3)
    - [Complessità temporale](#complessità-temporale-5)

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
   dove
   $$\Delta X = |a_x - b_x| \quad \textrm{e} \quad \Delta Y = |a_y - b_y|$$
   In tal modo due punti non possono trovarsi "troppo" vicini tra loro.

## Lower bound della complessità del problema (in dipendenza da n)

Il lower bound del problema è $O(n \hhquad log \hhquad n)$.

### Dimostrazione

![](./lower_bound.svg){ style="height: 300px; display: block; margin: auto;" }

Supponiamo di avere il seguente insieme finito di numeri

$$I = \{ x_1, x_2, x_3, ..., x_n \} \subseteq \mathbb{R} \quad \textrm{dove} \quad 0 = x_1 < x_2 < x_3 < ... < x_n$$

Definiamo il seguente insieme

$$S = \{ (x_i, x_i^2) \mid x_i \in I \} \subseteq \mathbb{R}^2$$

Notiamo come i punti di $S$ giacciono su una parabola. Proprio per questo, è facile vedere che un possibile involucro convesso di $S$ è dato dalla lista $(x_1, x_1^2), (x_2, x_2^2), ..., (x_n, x_n^2)$.

Se ottenessimo una qualsiasi altra lista, potremmo ottenere quella mostrata sopra in tempo $O(d)$ e dunque $O(n)$, trattandosi di una ricerca dell'elemento minimo.

Supponiamo ora, per assurdo, di essere in grado di trovare l'involucro convesso di $S$ in tempo inferiore a $O(n \hhquad log \hhquad n)$.

Se questo fosse il caso, prendendo la prima proiezione della lista $(x_1, x_1^2), (x_2, x_2^2), ..., (x_n, x_n^2)$. otterremo la lista $x_1, x_2, ..., x_n$. Dunque saremmo in grado di ordinare l'insieme $I$ in tempo inferiore a $O(n \hhquad log \hhquad n)$.

Questo è assurdo perché il lower bound del problema dell'ordinamento è $O(n \hhquad log \hhquad n)$. $\square$

# Involucri clockwise e counterclockwise

Come abbiamo già detto, rappresentiamo l'involucro convesso $H$ usando una lista dei punti di $P(H)$.

Consideriamo il seguente involucro convesso $H$:

![](./involucro_triangolare.svg){ style="height: 170px; display: block; margin: auto;" }

Possiamo rappresentare $H$ usando entrambe queste liste:

$$A, B, C \quad \textrm{e} \quad A, C, B$$

Osserviamo come la prima lista elenca i punti di $H$ in senso antiorario. La seconda lista invece elenca i punti in senso orario [^1].

[^1]: Non vi sono altre orientazioni possibili.

Nella nostra trattazione, per convenzione e per facilitare l'implementazione degli algoritmi, useremo e otterremo sempre liste che elencano i punti dell'involucro convesso in senso orario.

Può accadere di dover controllare se un involucro convesso è espresso in senso orario o antiorario. Per fare questo:

- Prendiamo tre punti qualsiasi di $H$ $\vec{u}, \vec{v}, \vec{w}$ **consecutivi**.

- Consideriamo i due vettori $\vec{v} - \vec{u} \hquad \textrm{e} \hquad \vec{w} - \vec{v}$.

  - Se $det \begin{pmatrix} \vec{v}_x - \vec{u}_x & \vec{w}_x - \vec{v}_x \\ \vec{v_y} - \vec{u_y} & \vec{w_y} - \vec{v_y} \end{pmatrix} > 0$, allora siamo in senso antiorario.

  - Se $det\begin{pmatrix} \vec{v}_x - \vec{u}_x & \vec{w}_x - \vec{v}_x \\ \vec{v_y} - \vec{u_y} & \vec{w_y} - \vec{v_y} \end{pmatrix} < 0$, allora siamo in senso orario.

  - Se il determinante è uguale a zero allora i tre punti sono collineari. Ricordiamo che, per costruzione, $S$ non contiene terne di punti collineari.

Se l'involucro è espresso in un senso, per esprimerlo nell'altro bisogna semplicemente invertire l'ordine della lista.

## Spiegazione

Possiamo osservare che

$$
\begin{aligned}
\det\begin{pmatrix}
\vec{v}_x - \vec{u}_x & \vec{w}_x - \vec{v}_x \\
\vec{v}_y - \vec{u}_y & \vec{w}_y - \vec{v}_y
\end{pmatrix}
&= (\vec{v}_x - \vec{u}_x)(\vec{w}_y - \vec{v}_y) - (\vec{v}_y - \vec{u}_y)(\vec{w}_x - \vec{v}_x) && \textrm{Definizione di determinante} \\[8pt]
&= (\vec{v}_x - \vec{u}_x)(\vec{w}_y - \vec{v}_y) + (-(\vec{v}_y - \vec{u}_y))(\vec{w}_x - \vec{v}_x) && \textrm{Portiamo dentro il "-"} \\[8pt]
&=
\begin{bmatrix}
-(\vec{v}_y - \vec{u}_y) \\
\vec{v}_x - \vec{u}_x
\end{bmatrix}
\cdot
\begin{bmatrix}
\vec{w}_x - \vec{v}_x \\
\vec{w}_y - \vec{v}_y
\end{bmatrix} && \textrm{Definizione del dot product} \\[8pt]
&=
\left\lVert
\begin{bmatrix}
-(\vec{v}_y - \vec{u}_y) \\
\vec{v}_x - \vec{u}_x
\end{bmatrix}
\right\rVert
\hquad
\left\lVert
\begin{bmatrix}
\vec{w}_x - \vec{v}_x \\
\vec{w}_y - \vec{v}_y
\end{bmatrix}
\right\rVert
\hquad
\cos\theta
&& \textrm{Definizione del dot product}
\end{aligned}
$$

con $\theta$ angolo tra $\begin{bmatrix} -(\vec{v}_y - \vec{u}_y) \\ \vec{v}_x - \vec{u}_x \end{bmatrix} \quad \text{e} \quad \begin{bmatrix} \vec{w}_x - \vec{v}_x \\ \vec{w}_y - \vec{v}_y \end{bmatrix}$.

Notiamo come $\begin{bmatrix} -(\vec{v}_y - \vec{u}_y) \\ \vec{v}_x - \vec{u}_x \end{bmatrix}$ è perpendicolare a $\begin{bmatrix} \vec{v}_x - \vec{u}_x \\ \vec{v}_y - \vec{u}_y \end{bmatrix}$ e lo denotiamo con $(\vec{v} - \vec{u})_\perp$.

Vediamo "in azione" il test sull'involucro mostrato sopra, sia per il caso orario che antiorario.

![](./ccw_test.svg){ style="height: 200px; display: block; margin: auto;" }

![](./cw_test.svg){ style="height: 300px; display: block; margin: auto;" }

# Algoritmo Naive

## Idea

Per ogni coppia di punti $\vec{u}, \vec{v} \in S$, con $\vec{u} \neq \vec{v}$:

Consideriamo la retta $r$ passante per $\vec{u}$ e $\vec{v}$.

Questa divide il piano $\Pi$ in due semipiani, $\Pi^+ \hquad \textrm{e} \hquad \Pi^-$.

Per ogni punto $\vec{p} \in S$ con $\vec{p} \neq \vec{u} \hquad \textrm{e} \hquad \vec{p} \neq \vec{v}$ controlliamo se $\vec{p}$ cade in $\Pi^+ \hquad \textrm{o} \hquad \textrm{in} \hquad \Pi^-$.

Se tutti i punti sono caduti esclusivamente in uno dei due semipiani, allora il segmento con estremi $\vec{u} \hquad \textrm{e} \hquad \vec{v} \hhquad$ è un lato dell'involucro convesso.

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

Nell'immagine d'esempio $\vec{n} \cdot (\vec{p} - \vec{u})$ è positivo perché $0 < \theta < \dfrac{\pi}{2} \hquad \textrm{invece} \hquad \vec{n} \cdot (\vec{q} - \vec{u})$ è negativo perché $\dfrac{\pi}{2} < \phi < \pi$.

## Come trovare un vettore perpendicolare ad un altro?

![](./vettori_perpendicolari.svg){ style="height: 250px; display: block; margin: auto;" }

Consideriamo il vettore $\vec{v} \leftrightarrow \begin{bmatrix} v_x \\ v_y \end{bmatrix}$.

Un vettore $\vec{u} \leftrightarrow \begin{bmatrix} u_x \\ u_y \end{bmatrix}$ è perpendicolare a $\vec{v}$ se e solo se $\vec{u} \cdot \vec{v} = 0$.

Vogliamo determinare $u_x \hquad \textrm{e} \hquad u_y$, essendo a conoscenza di $v_x \hquad \textrm{e} \hquad v_y$.

Sappiamo che $\vec{u} \cdot \vec{v} = 0$ se e solo se $u_x v_x + u_y v_y = 0$.

Dunque $u_x = - \dfrac{u_y v_y}{v_x}$

Fissando $u_y = v_x$, abbiamo che $u_x = - \dfrac{v_x v_y}{v_x} = -v_y$.

## Complessità temporale

- Iterare per ogni coppia di punti $\rightarrow O(n^2)$.
  - Iterare per ogni punto $\rightarrow O(n)$.
- Combinando le due iterazioni, vediamo come la complessità temporale dell'algoritmo è $O(n^3)$.

# Algoritmo Divide and Conquer

## Idea

![](./dc_tangents.svg){ style="height: 250px; display: block; margin: auto;" }

Sia $P$ la lista dei punti di $S$, ordinata in ordine crescente rispetto alla loro componente $x$.

Dividiamo $P$ a metà, ottenendo così le liste $A$ e $B$.

Applichiamo ricorsivamente l'algoritmo Divide and Conquer su $A$ e su $B$, ottenendo così gli involucri convessi $H_a$ e $H_b$ rispettivamente, degli insiemi di punti dati dalle liste $A$ e $B$.

Fondiamo $H_a$ e $H_b$, ottenendo così l'involucro $H$.

## Fusione

Dati due involucri convessi $H_a$ e $H_b$, vogliamo trovare l'involucro convesso $H$ dell'unione dei vertici di $H_a$ e $H_b$.

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

Percorriamo simultaneamente, in modo alternato:

- $H_a$ in senso **antiorario**, partendo da $r_a$.
- $H_b$ in senso **orario**, partendo da $l_b$.

Cercando il segmento di estremi $p$ e $q$, con $p$ vertice di $H_a$ e $q$ vertice di $H_b$, tale per cui la sua intersezione con $r$ abbia componente $y$ massima.

Il segmento $pq$ è la tangente superiore.

## Ricerca tangente inferiore

Sia $r_a$ il punto più a destra di $H_a$.

Sia $l_b$ il punto più a sinistra di $H_b$.

Consideriamo la retta $r: x = m, \hquad \textrm{dove} \hquad m = \dfrac{(r_a)_x + (l_b)_x}{2}$

Percorriamo simultaneamente, in modo alternato:

- $H_a$ in senso **orario**, partendo da $r_a$.
- $H_b$ in senso **antiorario**, partendo da $l_b$.

Cercando il segmento di estremi $p$ e $q$, con $p$ vertice di $H_a$ e $q$ vertice di $H_b$, tale per cui la sua intersezione con $r$ abbia componente $y$ minima.

Il segmento $pq$ è la tangente inferiore.

## Costruzione di H

Per costruire $H$, percorriamo:

- $H_a$, partendo dal vertice appartenente alla tangente inferiore fino al vertice appartenente alla tangente superiore, procedendo in senso orario.

- $H_b$, partendo dal vertice appartenente alla tangente superiore fino al vertice appartenente alla tangente inferiore, procedendo in senso orario.

## Complessità temporale

### Ricerca delle tangenti

Usando un approccio naive, possiamo cercare una tangente andando ad esaminare tutte le coppie di punti $(p, q) \in P(H_a) \times P(H_b)$ ed usare il two fingers method per trovare la tangente cercata.

Siccome $\left| P(H_a) \right| \hquad \textrm{e} \hquad \left| P(H_b) \right|$ sono di complessità $O(n)$, questo metodo naive richiederebbe un tempo $O(n^2)$.

Tuttavia possiamo fare di meglio se sfruttiamo il fatto che sia $H_a$ che $H_b$ sono poligoni convessi.

Percorriamo simultaneamente, in modo alternato, $H_a$ e $H_b$. Ad ogni iterazione, confrontiamo tre segmenti:

1. Il segmento tra il vertice corrente di $H_a$ e il vertice corrente di $H_b$.
2. Il segmento tra il vertice corrente di $H_a$ e il vertice successivo di $H_b$.
3. Il segmento tra il vertice successivo di $H_a$ e il vertice corrente di $H_b$.

Se 2. è "migliore" di 1., allora avanziamo il vertice corrente di $H_b$. Se 3. è migliore di 1., allora avanziamo il vertice corrente di $H_a$. Altrimenti terminiamo la visita.

Guardando come visitiamo i vertici di $H_a$ e $H_b$, vediamo che:

- Ad ogni iterazione, consideriamo sempre un nuovo vertice.
- Passiamo all'iterazione successiva solo se abbiamo trovato un miglior candidato come tangente.

Dunque, per trovare la tangente, ogni vertice di $H_a$ e $H_b$ sarà visitato al più un volta.

Dunque, la complessità temporale della ricerca di una tangente è $O(n)$.

### Fusione

Il processo di fusione consiste in:

1. Cercare la tangente superiore $\rightarrow O(n)$
2. Cercare la tangente inferiore $\rightarrow O(n)$
3. Costruire H $\rightarrow O(n)$

Perciò, il processo di fusione ha complessità temporale $O(n)$.

### Divide and Conquer

Possiamo vedere che:

- Ordinamento dei punti in input $\rightarrow O(n \hhquad log \hhquad n)$.
  - È necessario fare questo ordinamento una volta sola.
- Applichiamo Divide and Conquer ricorsivamente sulle due metà dell'input $\rightarrow 2T(\dfrac{n}{2})$.
  - $T(n)$ è la funzione che caratterizza la complessità temporale della parte ricorsiva dell'algoritmo.
- Fusione $\rightarrow O(n)$.

La complessità temporale dell'applicazione ricorsiva dell'algoritmo è espressa dalla seguente relazione di ricorrenza:

<!-- prettier-ignore -->
\begin{align*}
T(n) &= 2T\left(\dfrac{n}{2}\right) + n && \textrm{1 espansione} \\[8pt]
     &= 2\left(2T\left(\dfrac{n}{4}\right) + \dfrac{n}{2}\right) + n \\[8pt]
     &= 4T\left(\dfrac{n}{4}\right) + 2n && \textrm{2 espansioni} \\[8pt]
     &= 4\left(2T\left(\dfrac{n}{8}\right) + \dfrac{n}{4}\right) + 2n \\[8pt]
     &= 8T\left(\dfrac{n}{8}\right) + 3n && \textrm{3 espansioni} \\[8pt]
     &\quad \vdots \\[8pt]
     &= 2^k T\left(\dfrac{n}{2^k}\right) + kn && \textrm{k espansioni}
\end{align*}

Cerchiamo $k$ tale che $\dfrac{n}{2^k} = 1$. Dunque $k = \log_2 n$.

<!-- prettier-ignore -->
\begin{align*}
T(n) &= 2^{\log_2 n} T\left(\dfrac{n}{2^{\log_2 n}}\right) + (\log_2 n) n \\[8pt]
     &= n T\left(\dfrac{n}{n}\right) + n \log_2 n \\[8pt]
     &= n T(1) + n \log_2 n
\end{align*}

Per input di taglia 1, Divide and Conquer non esegue operazioni, e dunque possiamo dire che $T(1) = 1$.

<!-- prettier-ignore -->
\begin{align*}
T(n) &= n + n \log_2 n \\[5pt]
     &= O(n \hhquad log \hhquad n)
\end{align*}

### Complessità complessiva

Dunque, per quanto detto sopra la complessità temporale complessiva è $O(n \hhquad log \hhquad n)$ a causa dell'ordinamento.

# Algoritmo di Akl-Toussaint

## Idea

L'idea dell'algoritmo di Akl-Toussaint è la seguente:

- Determiniamo il quadrilatero definito dai quattro punti estremi di $S$.
- Tutti i punti che cadono all'interno di questo quadrilatero non possono essere vertici dell'involucro convesso, quindi possono essere scartati.
- Per ciascun lato del quadrilatero, cerchiamo un percorso convesso tra i punti della regione sottesa da quel lato.
- L'unione di questi percorsi convessi costituisce l'involucro convesso.

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

Osserviamo, sul disegno qui sopra, come ad ogni lato del quadrilatero corrisponde una regione. Quello che facciamo è percorrere il quadrilatero in senso orario e, per ogni regione, cercare il percorso convesso che ci porta da un estremo all'altro del lato corrispondente alla suddetta regione.

### Costruzione dell'involucro convesso H

Una volta che abbiamo determinato i vari percorsi convessi per le relative regioni, andiamo a unirli seguendo il senso orario di percorrenza dei lati del quadrilatero. Dalla loro unione risulta $H$.

## Ricerca di un percorso convesso di una data regione

Sia $R$ l'insieme di punti che cadono nella regione (compresi gli estremi del lato corrispondente alla regione).

Se siamo nella regione 1, o nella regione 2, ordiniamo i punti di $R$ in ordine crescente di $x$, ottenendo così una lista di punti $P$.

Se siamo nella regione 3, o nella regione 4, ordiniamo i punti di $R$ in ordine decrescente di $x$, ottenendo così una lista di punti $P$.

1. Per ogni tripla di punti consecutivi $(P_k, P_{k+1}, P_{k+2})$ in $P$:

   - Calcoliamo $det \begin{pmatrix} (P_{k+2} - P_{k+1})_x & (P_{k+1} - P_{k})_x \\ (P_{k+2} - P_{k+1})_y & (P_{k+1} - P_{k})_y \end{pmatrix}$

   - Se tale determinante è:

     - Maggiore o uguale a 0, passiamo alla successiva tripla $(P_{k+1}, P_{k+2}, P_{k+3})$ di punti consecutivi in $P$.

     - Minore di 0, eliminiamo il punto $P_{k+1}$ dalla lista $P$ e passiamo alla tripla $(P_{k-1}, P_k, P_{k+2})$ di punti consecutivi in $P$.

2. Se abbiamo completato (1) senza avere rimosso nessun punto di $P$, allora ci fermiamo, altrimenti ripetiamo (1).

Quando ci fermeremo, la lista $P$ sarà proprio la lista di punti, in senso orario, del lato del poligono convesso che stavamo cercando.

![](./akl_toussaint_determinante.svg){ style="height: 300px; display: block; margin: auto;" }

## Complessità temporale

### Euristica

1. Cercare $\textrm{XMIN}$, $\textrm{YMAX}$, $\textrm{XMAX}$, $\textrm{YMIN}$ richiede una semplice scansione di $S$ quindi la complessità è $O(n)$
2. Eliminare i punti di $S$ che cadono all'interno del quadrilatero richiede, per ciascun punto, fino a quattro half-plane test (uno per ogni lato del quadrilatero) quindi la complessità è $O(n)$

### Ricerca del percorso convesso

- Ordinamento dei punti della regione $\rightarrow O(n \hhquad log \hhquad n)$

- Convessificazione $\rightarrow O(n)$

  Il processo di convessificazione di $P$ è una scansione di $P$, nella quale possiamo procedere effettuando sia passi in avanti (andando alla tripla di punti successiva) che passi indietro (andando alla tripla di punti precedente).

  Un modo per determinare la complessità temporale della scansione è quello di contare il numero di passi da essa effettuati.

  - Siccome in $P$ vi sono al più $n$ punti, il numero di passi in avanti che possiamo fare è $\le n$.

  - Ogniqualvolta esaminiamo una tripla di punti consecutivi in $P$, c'è la possibilità di effettuare un passo indietro. Osserviamo come, quando effettuiamo un passo indietro, andiamo anche a rimuovere un punto da $P$. Siccome in $P$ vi sono al più $n$ punti, il numero totale di passi indietro che possiamo fare è $\le n$.

In conclusione, il numero totale di passi che possiamo fare è $\le n + n$, ovvero $\le 2n$.

Dunque, la complessità della ricerca del percorso convesso è $O(n \hhquad log \hhquad n)$.

### Costruzione di H

Per costruire $H$ è sufficiente unire i percorsi convessi trovati $\rightarrow O(n)$

### Complessità complessiva

Di conseguenza, la complessità temporale complessiva è $O(n \hhquad log \hhquad n)$.

# TORCH: Total Order Heuristic Based Convex Hull

## Idea

A grandi linee TORCH:

1. Ordina $S$.
2. Costruisce un involucro approssimato **non** convesso $H'$.
3. Costruisce $H$ a partire da $H'$ usando un processo di **convessificazione**.

## Ordinamento di S

Ordiniamo i punti di $S$ in ordine crescente di $x$, ottenendo così una lista di punti $P$.

## Costruzione di H'

![](./torch_lateral_hulls.svg){ style="height: 300px; display: block; margin: auto;" }

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
- Effettuiamo una scansione di $P$, andando da $W$ a $N$, e ogni volta che incontriamo un punto $p$, con coordinata $y$ maggiore della massima $y$ incontrata durante la scansione di $P$, da $W$ fino a $p$, aggiungiamo $p$ in coda a $\Pi_{nw}$.

Possiamo osservare che, alla fine della sua costruzione, $\Pi_{nw}$ avrà la struttura seguente:

$$\Pi_{nw} : W = p_0, p_1, p_2, ..., p_{k_{nw}} = N$$

dove

- $\forall i = 1, ..., k_{nw} \quad (p_{i-1})_x < (p_i)_x$
- $\forall i = 1, ..., k_{nw} \quad (p_{i-1})_y < (p_i)_y$

### Costruzione dell'involucro laterale NE

Costruiamo $\Pi_{ne}$ in modo molto simile a come abbiamo costruito $\Pi_{nw}$. L'unica differenza è che partiamo da $E$, invece che da $W$, e che facciamo la scansione di $P$ da $E$ a $N$, invece che da $W$ a $N$.

Possiamo osservare che alla fine della sua costruzione, $\Pi_{ne}$ avrà la struttura seguente:

$$\Pi_{ne} : E = p_0, p_1, p_2, ..., p_{k_{ne}} = N$$

dove

- $\forall i = 1, ..., k_{ne} \quad (p_{i-1})_x > (p_i)_x$
- $\forall i = 1, ..., k_{ne} \quad (p_{i-1})_y < (p_i)_y$

### Costruzione dell'involucro laterale SW

Costruiamo $\Pi_{sw}$ nel modo seguente:

- All'inizio $\Pi_{sw} = W$.
- Effettuiamo una scansione di $P$, andando da $W$ a $S$, e ogni volta che incontriamo un punto $p$, con coordinata $y$ minore della minima $y$ incontrata durante la scansione di $P$, da $W$ fino a $p$, aggiungiamo $p$ in coda a $\Pi_{sw}$.

Possiamo osservare che, alla fine della sua costruzione, $\Pi_{sw}$ avrà la struttura seguente:

$$\Pi_{sw} : W = p_0, p_1, p_2, ..., p_{k_{sw}} = S$$

dove

- $\forall i = 1, ..., k_{sw} \quad (p_{i-1})_x < (p_i)_x$
- $\forall i = 1, ..., k_{sw} \quad (p_{i-1})_y > (p_i)_y$

### Costruzione dell'involucro laterale SE

Costruiamo $\Pi_{se}$ in modo molto simile a come abbiamo costruito $\Pi_{sw}$. L'unica differenza è che partiamo da $E$, invece che da $W$, e che facciamo la scansione di $P$ da $E$ a $S$, invece che da $W$ a $S$.

Possiamo osservare che alla fine della sua costruzione, $\Pi_{se}$ avrà la struttura seguente:

$$\Pi_{se} : E = p_0, p_1, p_2, ..., p_{k_{se}} = S$$

dove

- $\forall i = 1, ..., k_{se} \quad (p_{i-1})_x > (p_i)_x$
- $\forall i = 1, ..., k_{se} \quad (p_{i-1})_y > (p_i)_y$

### Concatenazione degli involucri laterali

Costruiamo $H'$ nel modo seguente:

- Percorriamo $\Pi_{nw}$ da $W$ a $N$ e aggiungiamo in coda ad $H'$ ogni punto che incontriamo (tranne $N$).
- Percorriamo $\Pi_{ne}$ da $N$ a $E$ e aggiungiamo in coda ad $H'$ ogni punto che incontriamo (tranne $E$).
- Percorriamo $\Pi_{se}$ da $E$ a $S$ e aggiungiamo in coda ad $H'$ ogni punto che incontriamo (tranne $S$).
- Percorriamo $\Pi_{sw}$ da $S$ a $W$ e aggiungiamo in coda ad $H'$ ogni punto che incontriamo (tranne $W$).

### Convessificazione di H'

Possiamo notare come, per costruzione di $H'$ si ha che $P(H) \subseteq P(H')$. In particolare, $H'$ contiene già tutti i punti di $H$, possibilmente assieme ad alcuni punti aggiuntivi che rendono $H'$ concavo. Convessificare $H'$ significa dunque rimuovere quei punti di $H'$ che lo rendono concavo.

Per convessificare $H'$ possiamo usare lo stesso procedimento che abbiamo presentato durante la trattazione di Akl-Toussaint, in merito alla ricerca di un percorso convesso.

Facciamo notare come in questo caso non è necessario ordinare $H'$, siccome, per costruzione questo è già nell'ordine desiderato.

### Complessità temporale

- Ordinamento di S $\rightarrow O(n \hhquad log \hhquad n)$

- Costruzione di $H'$ $\rightarrow O(n)$

  - Ricerca di $W$ e $E$ $\rightarrow O(1)$

  - Ricerca di $N$ e $S$ $\rightarrow O(n)$

  - Costruzione di $\Pi_{nw}$ $\rightarrow O(n)$

  - Costruzione di $\Pi_{ne}$ $\rightarrow O(n)$

  - Costruzione di $\Pi_{sw}$ $\rightarrow O(n)$

  - Costruzione di $\Pi_{se}$ $\rightarrow O(n)$

  - Concatenazione di $\Pi_{nw}, \Pi_{ne}, \Pi_{sw}, \Pi_{se} \rightarrow O(n)$

- Convessificazione $\rightarrow O(n)$

Dunque, la complessità temporale dell'algoritmo è $O(n \hhquad log \hhquad n)$.

# Benchmark degli algoritmi per il calcolo dell'involucro convesso

<canvas id="canvas" width="600" height="400"></canvas>

# Algoritmo di approssimazione di Bentley, Faust e Preparata

Un algoritmo di approssimazione, al contrario dei classici algoritmi che più comunemente si studiano, non da garanzie di trovare la soluzione corretta, bensì ne trova una che, in generale, sarà "abbastanza buona".

Con "abbastanza buona" si intende che la distanza tra la soluzione approssimata e quella corretta è minore di un dato valore di soglia. La funzione distanza tra le due soluzioni, di norma, emerge naturalmente dalla natura del problema trattato, e dalle sue soluzioni.

Usiamo un algoritmo di approssimazione quando per noi non è strettamente necessario trovare la soluzione esatta.

Ha senso pratico usare un algoritmo di approssimazione solo nel caso in cui il suo tempo di esecuzione sia inferiore al tempo di esecuzione di un qualsiasi algoritmo esatto per il problema. Se questo non fosse il caso, potremmo direttamente trovare la soluzione esatta in un tempo inferiore rispetto a quella approssimata.

## Idea

Presentiamo ora uno schema generale per la definizione di algoritmi di approssimazione per il problema dell'involucro convesso:

1. Sia $S'$ un insieme di punti determinato a partire da $S$.
2. Determiniamo $H'$, l'involucro convesso di $S'$, eseguendo un algoritmo per la ricerca dell'involucro convesso su $S'$.
3. Usiamo $H'$ come soluzione approssimata per $H$.

### Complessità temporale

Sia:

- $T_{s'}$ la funzione che caratterizza la complessità temporale della determinazione di $S'$.
- $m = | S' |$
- $T$ la funzione che caratterizza la complessità temporale dell'algoritmo usato per trovare $H'$.

Dunque, è chiaro che la complessità temporale di un qualsiasi algoritmo di approssimazione che usa lo schema presentato sopra è:

$$T_{s'}(n) + T(m)$$

## Determinazione di S'

L'aspetto più interessante dello schema generale per la definizione di algoritmi di approssimazione per l'involucro convesso è la determinazione di $S'$. Vi sono innumerevoli strategie che possiamo usare per determinare $S'$. Quella che presenteremo è stata proposta da Bentley, Faust e Preparata nel 1988.

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

Possiamo immaginare di aver determinato $S'$ nel modo seguente:

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

![](./bfp_example.svg){ style="height: 350px; display: block; margin: auto;" }

Consideriamo un qualsiasi punto $p \in S$ che cade al di fuori di $H'$. Per costruzione, $p$ deve cadere all'interno di una data striscia.

Siccome $p$ cade al di fuori di $H'$, $p$ non è stato preso dal campionamento, e dunque $p$ non può né avere $y$ minima né $y$ massima nella striscia in cui cade. Dunque, $p_y$ deve essere compreso tra questi due valori, esclusi. Perciò, nella striscia in cui cade $p$, devono cadere almeno altri due punti. Oltretutto, almeno un punto $h$ tra questi due deve appartenere a $P(H')$. Dunque, la distanza $\delta$ tra $p$ e $H'$ è data dalla distanza di $p$ da uno dei due lati di $H' \cap \{ \textrm{striscia} \}$, quella che ha $h$ come uno dei due estremi.

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
