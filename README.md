Repozytorium zawiera trzy niezależne aplikacje edukacyjne związane z
propagacją fal elektromagnetycznych. Projekty pokazują kolejno:

1. odbicie i transmisję na pojedynczej granicy dwóch ośrodków,
2. działanie warstwy ćwierćfalowej, półfalowej i warstwy o dowolnej grubości,
3. propagację modów TE i TM w falowodzie prostokątnym.

Każda aplikacja działa w przeglądarce i ma własny plik Docker Compose. Projekty
nie komunikują się ze sobą i można uruchamiać je niezależnie.

## Projekty

| Folder | Symulowane zjawisko | Najważniejsze możliwości | Domyślny adres |
| --- | --- | --- | --- |
| [`zmiana_osrodka`](./zmiana_osrodka/) | Prostopadłe padanie fali na granicę dwóch bezstratnych ośrodków | Fale padająca, odbita i transmitowana; pola E, H, D i B; współczynniki amplitudowe i energetyczne | <http://localhost:4173> |
| [`wave-transformer-sandbox`](./wave-transformer-sandbox/) | Bezstratna warstwa między dwoma półprzestrzeniami | Transformator `lambda/4`, warstwa `lambda/2`, dowolna grubość, impedancja wejściowa, odbicia wewnętrzne | <http://localhost:5173> |
| [`falowody_sim`](./falowody_sim/) | Pojedynczy mod TE lub TM w jednorodnym falowodzie prostokątnym PEC | Odcięcie, pola i prądy, przekroje 2D, widok 3D, parametry falowodowe | <http://localhost:8091> |

Szczegółowy opis modelu, obsługi i ograniczeń znajduje się w README każdego
projektu.

## Szybkie uruchomienie

Wymagane są Docker oraz Docker Compose w wersji obsługującej polecenie
`docker compose`.

Każdy projekt uruchamia się z jego własnego katalogu:

```bash
cd zmiana_osrodka
docker compose up --build -d
```

```bash
cd wave-transformer-sandbox
./run.sh
```

```bash
cd falowody_sim
docker compose up --build -d
```

Po zbudowaniu obrazów aplikacje mogą działać równocześnie, ponieważ używają
różnych portów. Stan kontenerów można sprawdzić poleceniem:

```bash
docker compose ps
```

Projekt uruchomiony w bieżącym katalogu zatrzymuje się poleceniem:

```bash
docker compose down
```

## Jak dobrać projekt do zagadnienia

### Pojedyncza granica ośrodków

`zmiana_osrodka` jest najprostszym punktem wejścia. Pokazuje, jak impedancje
falowe dwóch materiałów wyznaczają odbicie i transmisję oraz dlaczego styczne
składowe E i H są ciągłe, a D i B mogą zmieniać wartość na granicy.

### Warstwa dopasowująca

`wave-transformer-sandbox` rozszerza przypadek pojedynczej granicy o skończoną
warstwę środkową. Pozwala obserwować wielokrotne odbicia w warstwie i sprawdzić:

- dopasowanie ćwierćfalowe `Zw2 = sqrt(Zw1 * Zw3)`,
- impedancyjną przezroczystość warstwy półfalowej,
- zależność impedancji wejściowej i WFS od grubości warstwy.

### Falowód prostokątny

`falowody_sim` dotyczy fal prowadzonych zamiast fal płaskich w
nieskończonych ośrodkach. Umożliwia wybór modu `TE_mn` lub `TM_mn`, sprawdza
częstotliwość odcięcia i prezentuje rozkłady pól, prądów oraz wektora Poyntinga.

## Wspólne założenia

Wszystkie trzy aplikacje są modelami dydaktycznymi pracującymi w stanie
harmonicznym. Nie rozwiązują pełnego zagadnienia czasowego metodą FDTD/FEM.
Wartości na ekranie wynikają z analitycznych zależności dla konkretnej
geometrii, a animacja zmienia fazę czasową rozwiązania ustalonego.

Modele przyjmują liniowe, jednorodne i izotropowe materiały. Projekty granicy
ośrodków i transformatora zakładają media bezstratne. Symulator falowodu
zakłada idealnie przewodzące ścianki PEC; podana przewodność wypełnienia służy
do wyznaczenia `J_sigma = sigma E`, ale nie zmienia stałej propagacji.

## Technologie i struktura

- `zmiana_osrodka`: HTML, CSS, JavaScript, Canvas 2D, Nginx,
- `wave-transformer-sandbox`: React, TypeScript, Vite, SVG, Vitest, Nginx,
- `falowody_sim`: React, TypeScript, Vite, Canvas 2D, Three.js,
  React Three Fiber, Vitest, Nginx.

Każdy obraz produkcyjny jest serwowany przez Nginx. W projektach React
wieloetapowy Dockerfile najpierw uruchamia testy i buduje aplikację, a dopiero
potem kopiuje statyczny wynik do obrazu Nginx.

Repozytorium nie ma wspólnego menedżera pakietów ani nadrzędnego skryptu
budującego. Polecenia deweloperskie należy wykonywać we właściwym folderze
projektu.
