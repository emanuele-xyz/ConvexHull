---
pagetitle: Teoria
header-includes: |
  \newcommand{\hquad}{\hspace{0.5em}}
  \newcommand{\hhquad}{\hspace{0.25em}}
---

<!-- TODO: Rimuovere manualmente i doppi escape nell'indice. -->

# Indice <!-- omit in toc -->

- [Involucro convesso](#involucro-convesso)
  - [Lower bound della complessità del problema](#lower-bound-della-complessità-del-problema)
    - [Dimostrazione](#dimostrazione)
- [Involucri clockwise e counterclockwise](#involucri-clockwise-e-counterclockwise)
- [Algoritmo Naive](#algoritmo-naive)
  - [Idea](#idea)
  - [Complessità temporale](#complessità-temporale)
  - [Come controllare se $\\vec{p}$ cade in $\\Pi^+ \\hquad \\textrm{o} \\hquad \\Pi^-$?](#come-controllare-se-vecp-cade-in-pi-hquad-textrmo-hquad-pi-)
  - [Come trovare un vettore perpendicolare ad un altro?](#come-trovare-un-vettore-perpendicolare-ad-un-altro)
- [Algoritmo Divide and Conquer](#algoritmo-divide-and-conquer)
  - [Idea](#idea-1)
  - [Fusione](#fusione)
  - [Ricerca tangente superiore](#ricerca-tangente-superiore)
  - [Ricerca tangente inferiore](#ricerca-tangente-inferiore)
  - [Costruzione di $H$](#costruzione-di-h)
  - [Complessità temporale della ricerca delle tangenti](#complessità-temporale-della-ricerca-delle-tangenti)
  - [Complessità temporale della fusione](#complessità-temporale-della-fusione)

# Involucro convesso

**Input**: Insieme finito $S \subseteq R^2$.

**Output**: Poligono convesso $H$ di area minima che contiene tutti i punti di $S$.

**Notazione**

Denotiamo con:

- $P(H)$ l'insieme di vertici di $H$.
- $d$ la cardinalità di $P(H)$.
- $n$ la cardinalità di $S$.

**Proprietà**: $P(H) \subseteq S$.

**Corollario**: $d \le n$

**Rappresentare $H$**

Rappresentiamo $H$ usando una lista ordinata di punti di $P(H)$:

$$P_1, P_2, P_3, ..., P_d \qquad P_i \in P(H), i = 1, ..., d$$

Tale che:

- $\forall i = 1, ..., d - 1$ il segmento di estremi $P_i$ e $P_{i+1}$ è un lato di $H$.
- Il segmento di estremi $P_d$ e $P_1$ è un lato di $H$.

## Lower bound della complessità del problema

Il lower bound del problema è $\Omega(n \hhquad log \hhquad n)$.

### Dimostrazione

Supponiamo di avere il seguente insieme finito di numeri

$$I = { x_1, x_2, x_3, ..., x_n } \subseteq \mathbb{R} \quad \textrm{dove} \quad x_1 < x_2 < x_3 < ... < x_n$$

È facile vedere che i punti di $S$ giacciono su una parabola. Proprio per questo, è facile che un possibile involucro convesso di $S$ è dato dalla lista $(x_1, x_1^2), (x_2, x_2^2), ..., (x_n, x_n^2)$.

Se ottenessimo una qualsiasi altra lista, potremmo ottenere quella mostrata sopra in tempo $O(d)$ e dunque $O(n)$.

Supponiamo ora, per assurdo, di essere in grado di trovare l'involucro convesso di $S$ in tempo inferiore a $O(n \hhquad log \hhquad n)$.

Se questo fosse il caso, prendendo la prima proiezione della lista $(x_1, x_1^2), (x_2, x_2^2), ..., (x_n, x_n^2)$. otterremo la lista $x_1, x_2, ..., x_n$. Dunque saremmo in grado di ordinare l'insieme $I$ in tempo inferiore a $O(n \hhquad log \hhquad n)$.

Questo è assurdo. $\square$

# Involucri clockwise e counterclockwise

Come abbiamo già detto, rappresentiamo l'involucro convesso $H$ usando una lista dei punti di $P(H)$.

Consideriamo il seguente involucro convesso $H$:

<!-- TODO: Aggiungere disegno involucro triangolare u, v, w. -->

Possiamo rappresentare $H$ usando entrambe queste liste:

$$\vec{u}, \vec{v}, \vec{w} \quad \textrm{e} \quad \vec{u}, \vec{w}, \vec{v}$$

Osserviamo come la prima lista elencai punti di $H$ in senso antiorario. La seconda lista invece elenca i punti in senso orario [^1].

[^1]: Non vi sono altre orientazioni possibili.

Nella nostra trattazione, per convenzione e per facilitare l'implementazione degli algoritmi, useremo e ritorneremo sempre liste che elencano i punti dell'involucro convesso in senso orario.

Di rado può accadere di dover controllare se un involucro convesso è espresso in senso orario o antiorario. Per fare questo:

- Prendiamo tre punti qualsiasi $\vec{u}, \vec{v}, \vec{w}$ **consecutivi**.

- Consideriamo i due vettori $\vec{v} - \vec{u} \hquad \textrm{e} \hquad \vec{w} - \vec{v}$.

  - Se $det \begin{pmatrix} \vec{v} - \vec{u} \\ \vec{w} - \vec{v} \end{pmatrix} > 0$, allora siamo in senso antiorario.

  - Se $det \begin{pmatrix} \vec{v} - \vec{u} \\ \vec{w} - \vec{v} \end{pmatrix} < 0$, allora siamo in senso orario.

Se l'involucro è espresso in un senso, per esprimerlo nell'altro bisogna semplicemente invertire l'ordine della lista.

# Algoritmo Naive

## Idea

Per ogni coppia di punti $\vec{u}, \vec{v} \in S$, con $\vec{u} \neq \vec{v}$:

Consideriamo la retta $r$ passante per $\vec{u}$ e $\vec{v}$.

Questa divide il piano $\Pi$ in due semipiani, $\Pi^+ \hquad \textrm{e} \hquad \Pi^-$.

Per ogni punto $\vec{p} \in S$ con $\vec{p} \neq \vec{u} \hquad \textrm{e} \hquad \vec{p} \neq \vec{v}$ sono caudti esclusivamente in uno dei due semipiani, allora il segmento con estremi $\vec{u} \hquad \textrm{e} \hquad \vec{v}$ è un lato dell'involucro convesso.

## Complessità temporale

- Iterare per ogni coppia di punti richiede tempo $O(n^2)$.
- Iterare per ogni punto richiede tempo $O(n)$.
- Combinando le due iterazione, vediamo come la complessità temporale dell'algoritmo è $O(n^3)$.

## Come controllare se $\vec{p}$ cade in $\Pi^+ \hquad \textrm{o} \hquad \Pi^-$?

<!-- TODO: Aggiungere disegno dei 4 vettori n, p, v, q. -->

Supponiamo che il vettore $\vec{v} - \vec{u}$ è un possibile vettore direzione della retta $r$.

Dato il vettore $\vec{v} - \vec{u}$ troviamo un vettore $\vec{n}$ perpendicolare ad esso.

$\vec{n}$ è una possibile normale della retta $r$.

Dato un qualsiasi punto $\vec{p}$:

1. Prendiamo il vettore $\vec{p} - \vec{u}$.
2. Se $\vec{n} \cdot (\vec{p} - \vec{u}) > 0$, allora siamo in $\Pi^+$. <br />
   Se $\vec{n} \cdot (\vec{p} - \vec{u}) < 0$, allora siamo in $\Pi^-$.

## Come trovare un vettore perpendicolare ad un altro?

Consideriamo il vettore $\vec{v} \leftrightarrow \begin{bmatrix} v_x \\ v_y \end{bmatrix}$.

Un vettore $\vec{u} \leftrightarrow \begin{bmatrix} u_x \\ u_y \end{bmatrix}$ è perpendicolare a $\vec{v}$ se e solo se $\vec{u} \cdot \vec{v} = 0$.

Vogliamo determinare $u_x \hquad \textrm{e} \hquad u_y$, essendo a conoscenza di $v_x \hquad \textrm{e} \hquad v_y$.

Sappiamo che $\vec{u} \cdot \vec{v} = 0$ se e solo se $u_x v_x + u_y v_y = 0$.

Dunque $u_x = - \dfrac{u_y v_y}{v_x}$

Fissando $u_y = v_x$, abbiamo che $u_x = - \dfrac{v_x v_y}{v_x} = -v_y$

# Algoritmo Divide and Conquer

## Idea

Sia $P$ la lista dei punti di $S$, ordinata in ordine non crescente della loro componente $x$.

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

La procedura di fusione si riduce dunque alla ricerca di queste due tangenti, una detta tangente superiore, e l'altra detta tangente inferiore.

## Ricerca tangente superiore

Sia $r_a$ il punto più a destra di $H_a$.

Sia $l_b$ il punto più a sinistra di $H_b$.

Consideriamo la retta $r: x = m, \hquad \textrm{dove} \hquad m = \dfrac{r_a x + l_b x}{2}$

Percorriamo simultaneamente:

- $H_a$ in senso **antiorario**, partendo da $r_a$.
- $H_b$ in senso **orario**, partendo da $l_b$.

Cercando il segmento il segmento di estremi $p$ e $q$, con $p$ vertice di $H_a$ e $q$ vertice di $H_b$, tale per cui la sua intersezione con $r$ abbia componente $y$ massima.

Il segmento $pq$ è la tangente superiore.

## Ricerca tangente inferiore

Sia $r_a$ il punto più a destra di $H_a$.

Sia $l_b$ il punto più a sinistra di $H_b$.

Consideriamo la retta $r: x = m, \hquad \textrm{dove} \hquad m = \dfrac{r_a x + l_b x}{2}$

Percorriamo simultaneamente, in modo alternato:

- $H_a$ in senso **orario**, partendo da $r_a$.
- $H_b$ in senso **antiorario**, partendo da $l_b$.

Cercando il segmento il segmento di estremi $p$ e $q$, con $p$ vertice di $H_a$ e $q$ vertice di $H_b$, tale per cui la sua intersezione con $r$ abbia componente $y$ minima.

Il segmento $pq$ è la tangente inferiore.

## Costruzione di $H$

Per costruire $H$, percorriamo:

- $H_a$, partendo dal vertice appartenente alla tangente inferiore fino al vertice appartenente alla tangente superiore, procedendo in senso orario.

- $H_b$, partendo dal vertice appartenente alla tangente superiore fino al vertice appartenente alla tangente inferiore, procedendo in senso orario.

## Complessità temporale della ricerca delle tangenti

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

## Complessità temporale della fusione

Il processo di fusione ??? in:

1. Cercare la tangente superiore $\rightarrow O(n)$
2. Cercare la tangente inferiore $\rightarrow O(n)$
3. Costruire H $\rightarrow O(n)$

Perciò, il processo di fusione ha complessità temporale $O(n)$.
