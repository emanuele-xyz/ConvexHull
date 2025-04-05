---
pagetitle: Teoria
header-includes: |
  \newcommand{\hquad}{\hspace{0.5em}}
  \newcommand{\hhquad}{\hspace{0.25em}}
---

# Indice <!-- omit in toc -->

- [Involucro convesso](#involucro-convesso)
  - [Lower bound della complessità del problema](#lower-bound-della-complessità-del-problema)
    - [Dimostrazione](#dimostrazione)
- [Involucro convesso naive](#involucro-convesso-naive)
  - [Idea dell'algoritmo naive](#idea-dellalgoritmo-naive)
  - [Complessità temporale](#complessità-temporale)
  - [Come controllare se $\\vec{p}$ cade in $\\Pi^+ \\hquad \\textrm{o} \\hquad \\Pi^-$?](#come-controllare-se-vecp-cade-in-pi-hquad-textrmo-hquad-pi-)
  - [Come trovare un vettore perpendicolare ad un altro?](#come-trovare-un-vettore-perpendicolare-ad-un-altro)

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

# Involucro convesso naive

## Idea dell'algoritmo naive

Per ogni coppia di punti $\vec{u}, \vec{v} \in S$, con $\vec{u} \neq \vec{v}$:

Consideriamo la retta $r$ passante per $\vec{u}$ e $\vec{v}$.

Questa divide il piano $\Pi$ in due semipiani, $\Pi^+ \hquad \textrm{e} \hquad \Pi^-$.

Per ogni punto $\vec{p} \in S$ con $\vec{p} \neq \vec{u} \hquad \textrm{e} \hquad \vec{p} \neq \vec{v}$ sono caudti esclusivamente in uno dei due semipiani, allora il segmento con estremi $\vec{u} \hquad \textrm{e} \hquad \vec{v}$ è un lato dell'involucro convesso.

## Complessità temporale

- Iterare per ogni coppia di punti richiede tempo $O(n^2)$.
- Iterare per ogni punto richiede tempo $O(n)$.
- Combinando le due iterazione, vediamo come la complessità temporale dell'algoritmo è $O(n^3)$.

## Come controllare se $\vec{p}$ cade in $\Pi^+ \hquad \textrm{o} \hquad \Pi^-$?

Supponiamo che il vettore $\vec{v} - \vec{u}$ è un possibile vettore direzione della retta $r$.

Dato il vettore $\vec{v} - \vec{u}$ troviamo un vettore $\vec{n}$ perpendicolare ad esso.

$\vec{n}$ è una possibile normale della retta $r$.

Dato un qualsiasi punto $\vec{p}$:

1. Prendiamo il vettore $\vec{p} - \vec{u}$.
2. Se $\vec{n} \cdot (\vec{p} - \vec{u}) > 0$, allora siamo in $\Pi^+$. <br/>
   Se $\vec{n} \cdot (\vec{p} - \vec{u}) < 0$, allora siamo in $\Pi^-$.

## Come trovare un vettore perpendicolare ad un altro?

Consideriamo il vettore $\vec{v} \leftrightarrow \begin{bmatrix} v_x \\ v_y \end{bmatrix}$.

Un vettore $\vec{u} \leftrightarrow \begin{bmatrix} u_x \\ u_y \end{bmatrix}$ è perpendicolare a $\vec{v}$ se e solo se $\vec{u} \cdot \vec{v} = 0$.

Vogliamo determinare $u_x \hquad \textrm{e} \hquad u_y$, essendo a conoscenza di $v_x \hquad \textrm{e} \hquad v_y$.

Sappiamo che $\vec{u} \cdot \vec{v} = 0$ se e solo se $u_x v_x + u_y v_y = 0$.

Dunque $u_x = - \dfrac{u_y v_y}{ v_x }$

Fissando $u_y = v_x$, abbiamo che $u_x = - \dfrac{v_x v_y}{ v_x } = -v_y$
