# Wave Transformer Sandbox

Edukacyjna aplikacja webowa do analizy prostopadłego padania płaskiej fali
elektromagnetycznej na bezstratny układ trzech ośrodków:

```text
ośrodek 1 (z < 0) | warstwa 2 (0 <= z <= d) | ośrodek 3 (z > d)
               fala padająca: k -> +z
```

Warstwa środkowa może mieć grubość `lambda_2/4`, `lambda_2/2` albo wartość
zadaną w milimetrach. Aplikacja pokazuje, jak grubość i impedancja tej warstwy
zmieniają impedancję wejściową, odbicie widziane od strony źródła oraz rozkład
pól wewnątrz całego układu.

## Do czego służy

Projekt pozwala eksperymentalnie sprawdzić trzy podstawowe przypadki:

- transformator ćwierćfalowy dopasowujący ośrodek 1 do ośrodka 3,
- półfalową warstwę impedancyjnie przezroczystą,
- niedopasowaną warstwę o dowolnej grubości.

W przeciwieństwie do projektu `zmiana_osrodka`, model zawiera dwie granice i
uwzględnia falę biegnącą wstecz wewnątrz warstwy. Dzięki temu widoczna jest
interferencja wynikająca z odbić wewnętrznych.

## Uruchomienie

### Docker: skrypt automatyczny

Wymagane są Docker i Docker Compose:

```bash
cd wave-transformer-sandbox
./run.sh
```

Skrypt:

1. buduje obraz, wykonując testy i produkcyjny build,
2. zatrzymuje poprzedni kontener projektu,
3. wybiera pierwszy wolny port z zakresu `5173-5199`,
4. uruchamia aplikację i wypisuje jej adres.

Zatrzymanie:

```bash
docker compose down
```

### Docker: wybrany port

```bash
cd wave-transformer-sandbox
APP_PORT=5180 docker compose up --build -d
```

Bez zmiennej `APP_PORT` domyślny adres to <http://localhost:5173>.

Stan i logi:

```bash
docker compose ps
docker compose logs -f
```

### Tryb deweloperski

Wymagany jest Node.js. Dockerfile używa Node.js 22; lokalnie zalecana jest ta
sama główna wersja.

```bash
cd wave-transformer-sandbox
npm install
npm run dev
```

Vite wypisze adres serwera, domyślnie <http://localhost:5173>.

Pozostałe polecenia:

```bash
npm test          # testy jednostkowe Vitest
npm run build     # kontrola TypeScript i build produkcyjny
npm run preview   # lokalny podgląd katalogu dist
```

## Obsługa aplikacji

### Parametry wejściowe

- częstotliwość `f` w GHz,
- amplituda padającego pola elektrycznego `E0` w V/m,
- `epsilon_r` i `mu_r` każdego z trzech ośrodków,
- grubość warstwy 2: `lambda_2/4`, `lambda_2/2` lub wartość własna.

Przycisk „Dopasuj lambda/4” zachowuje aktualne `mu_r2`, oblicza wymagane
`epsilon_r2` i przełącza grubość na ćwierć długości fali w warstwie.

Domyślny przypadek:

```text
f = 10 GHz, E0 = 1 V/m
ośrodek 1: epsilon_r = 1, mu_r = 1
warstwa 2: epsilon_r = 2, mu_r = 1
ośrodek 3: epsilon_r = 4, mu_r = 1
d = lambda_2 / 4
```

Jest to przypadek dopasowany, ponieważ impedancja warstwy spełnia warunek
średniej geometrycznej.

### Wykres

Można wybrać pole E, H, D lub B oraz niezależnie pokazać:

- falę padającą,
- falę odbitą,
- falę transmitowaną,
- pole całkowite,
- obwiednię amplitudy pola całkowitego.

Określenie „fala transmitowana” na wykresie obejmuje falę biegnącą do przodu
w warstwie 2 oraz falę wychodzącą do ośrodka 3. Krzywa „odbita” obejmuje
odbicie w ośrodku 1 i falę biegnącą wstecz wewnątrz warstwy.

Wykres obejmuje po `1.25` długości fali w ośrodkach 1 i 3 oraz całą warstwę.
Po najechaniu kursorem wyświetlana jest lokalna wartość pola całkowitego.

### Wyniki

Panel wyników podaje:

- impedancję falową `Zw`, długość fali i `beta` każdego ośrodka,
- rzeczywistą grubość warstwy oraz jej wartość względem `lambda_2`,
- zespoloną impedancję wejściową `Zin`,
- zespolony współczynnik odbicia `Gamma_12`,
- moduł współczynnika odbicia i WFS.

Etykieta „dopasowanie” pojawia się dla `|Gamma| < 0.001`, a etykieta
„przezroczystość półfalowa”, gdy `d/lambda_2` jest numerycznie równe `0.5`.

## Model fizyczny

Model używa fazorów i konwencji czasowej:

```text
Re{F(z) exp(j omega t)}
```

Fala biegnąca w `+z` zawiera czynnik `exp(-j beta z)`, a fala wracająca
`exp(+j beta z)`.

Dla każdego ośrodka:

```text
epsilon = epsilon_0 * epsilon_r
mu      = mu_0 * mu_r
v       = 1 / sqrt(mu * epsilon)
lambda  = v / f
beta    = 2 pi / lambda
Zw      = sqrt(mu / epsilon)
```

Warstwa jest traktowana analogicznie do bezstratnego odcinka linii
transmisyjnej o impedancji `Zw2`, długości `d` i obciążeniu `Zw3`:

```text
Zin = Zw2 * (Zw3 + j Zw2 tan(beta2 d))
            / (Zw2 + j Zw3 tan(beta2 d))

Gamma_12 = (Zin - Zw1) / (Zin + Zw1)
WFS      = (1 + |Gamma_12|) / (1 - |Gamma_12|)
```

Amplitudy fal w warstwie są wyznaczane z ciągłości stycznych składowych E i H
w `z = 0`. Transmisja do ośrodka 3 wynika z sumy obu fal na granicy `z = d`.

### Warstwa ćwierćfalowa

Dla `d = lambda_2/4`:

```text
Zin = Zw2^2 / Zw3
```

Pełne dopasowanie od strony ośrodka 1 zachodzi, gdy:

```text
Zw2 = sqrt(Zw1 * Zw3)
```

Przycisk automatycznego dopasowania rozwiązuje ten warunek względem
`epsilon_r2` przy ustalonym `mu_r2`.

### Warstwa półfalowa

Dla `d = lambda_2/2`:

```text
Zin = Zw3
```

Warstwa odtwarza impedancję ośrodka 3 na swoim wejściu. Nie oznacza to
automatycznie dopasowania do ośrodka 1; dopasowanie wystąpi tylko wtedy, gdy
`Zw1 = Zw3`.

## Ograniczenia

1. Wszystkie ośrodki są liniowe, jednorodne, izotropowe i bezstratne.
2. `epsilon_r` i `mu_r` są rzeczywiste oraz dodatnie.
3. Uwzględniono monochromatyczną falę płaską padającą prostopadle.
4. Brak dyspersji, nieliniowości i stanów przejściowych.
5. Nie są obsługiwane ośrodki stratne, padanie ukośne ani osobne przypadki
   polaryzacji TE/TM.
6. Model prezentuje amplitudy pól, ale nie wyświetla osobnego bilansu mocy.

## Testy

Testy jednostkowe w `src/physics.test.ts` sprawdzają:

- zanik odbicia dla poprawnie dobranego transformatora ćwierćfalowego,
- równość `Zin = Zw3` dla warstwy półfalowej, również gdy właściwości
  warstwy 2 są inne niż właściwości sąsiednich ośrodków.

Testy i build są automatycznie wykonywane podczas budowania obrazu Docker.

## Struktura projektu

```text
wave-transformer-sandbox/
├── src/
│   ├── physics.ts            # model trzech ośrodków i pola
│   ├── physics.test.ts       # testy modelu
│   ├── complex.ts            # podstawowe działania zespolone
│   ├── App.tsx               # stan aplikacji
│   └── components/           # sterowanie, wykres i wyniki
├── package.json
├── run.sh                    # wybór wolnego portu i start kontenera
├── Dockerfile                # test, build Vite i obraz Nginx
├── compose.yaml
└── nginx.conf
```
