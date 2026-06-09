# Symulator falowodu prostokątnego

Interaktywna aplikacja edukacyjna do analizy pojedynczego modu `TE_mn` lub
`TM_mn` w jednorodnie wypełnionym falowodzie prostokątnym o idealnie
przewodzących ściankach PEC.

Falowód ma przekrój:

```text
0 <= x <= a
0 <= y <= b
```

i jest wizualizowany na odcinku `0 <= z <= L`. Dodatni kierunek propagacji to
`+z`, a rozwiązanie używa konwencji fazorowej:

```text
exp(j omega t - j beta z)
```

## Co symuluje aplikacja

Model wyznacza parametry dyspersyjne i pełne wektorowe rozkłady pól dla
wybranego modu. Aplikacja oblicza:

- częstotliwość odcięcia `fc`,
- liczby falowe `k`, `kc` i `beta`,
- tłumienie zanikającego pola `alpha` poniżej odcięcia,
- długość fali w ośrodku `lambda` i długość prowadzoną `lambda_g`,
- prędkość fazową i grupową,
- impedancje modowe `Z_TE` i `Z_TM`,
- chwilowe pola E i H,
- powierzchniową gęstość prądu ścianek `Js`,
- prąd przesunięcia `Jd` i prąd przewodzenia `J_sigma` w wypełnieniu,
- chwilowy i średni wektor Poyntinga,
- numeryczne naruszenie warunku brzegowego `E_t = 0` na PEC.

Wizualizacja zawiera trzy przekroje 2D (`xy`, `xz`, `yz`) oraz obracany widok
3D falowodu.

## Uruchomienie

### Docker

Wymagane są Docker i Docker Compose:

```bash
cd falowody_sim
docker compose up --build -d
```

Podczas budowania obrazu automatycznie wykonywane są testy jednostkowe i build
produkcyjny. Aplikacja będzie dostępna pod adresem:

<http://localhost:8091>

Inny port można wybrać zmienną `APP_PORT`:

```bash
APP_PORT=8092 docker compose up --build -d
```

Stan, logi i zatrzymanie:

```bash
docker compose ps
docker compose logs -f
docker compose down
```

### Tryb deweloperski

Dockerfile używa Node.js 22; lokalnie zalecana jest ta sama główna wersja.

```bash
cd falowody_sim
npm install
npm run dev
```

Vite domyślnie uruchamia serwer pod adresem <http://localhost:5173>.

Pozostałe polecenia:

```bash
npm test          # testy jednostkowe Vitest
npm run build     # kontrola TypeScript i build produkcyjny
npm run preview   # podgląd katalogu dist
```

## Domyślny przypadek

Aplikacja startuje z podstawowym modem falowodu WR-90:

```text
a = 22.86 mm
b = 10.16 mm
L = 80 mm
epsilon_r = 1
mu_r = 1
sigma = 0 S/m
f = 10 GHz
mod TE10
amplituda H0 = 1 A/m
```

Dla tych danych częstotliwość odcięcia wynosi około `6.557 GHz`, więc mod
`TE10` propaguje się.

## Obsługa

### Mod i geometria

Można wybrać rodzinę TE lub TM oraz indeksy `m`, `n` od 0 do 3. Indeksy
opisują zmienność pola poprzecznego:

```text
kx = m pi / a
ky = n pi / b
```

Walidacja odrzuca:

- `TE00`, ponieważ co najmniej jeden indeks musi być niezerowy,
- wszystkie mody TM, dla których `m = 0` lub `n = 0`.

Klasyczny mod TEM nie istnieje w pustym, jednoprzewodowym falowodzie
prostokątnym.

Pozostałe parametry to wymiary `a`, `b`, długość wizualizowanego odcinka `L`,
`epsilon_r`, `mu_r`, przewodność `sigma`, częstotliwość i amplituda bazowej
składowej wzdłużnej:

- `H0` dla TE, gdzie `E_z = 0`,
- `E0` dla TM, gdzie `H_z = 0`.

### Czas i siatka

Suwak fazy ustawia `omega t` od 0 do `2 pi`. Animacja przesuwa tę fazę w
czasie; nie wykonuje numerycznej symulacji przejściowej.

Parametr „Próbki siatki” zmienia gęstość map 2D w zakresie od 7 do 31.
Większa wartość daje gładszy obraz kosztem renderowania. Widok 3D używa
osobnej, stałej i rzadszej siatki wektorów.

### Warstwy wektorowe

Można niezależnie włączać:

- `E`: natężenie pola elektrycznego,
- `H`: natężenie pola magnetycznego,
- `Js = n x H`: powierzchniowy prąd na ściankach PEC,
- `Jd = j omega epsilon E`: objętościowy prąd przesunięcia,
- `J_sigma = sigma E`: objętościowy prąd przewodzenia,
- `S = E x H`: chwilowy wektor Poyntinga.

Każda warstwa jest normalizowana osobno. Długości strzałek pokazują rozkład i
kierunek w obrębie jednej wielkości, ale nie pozwalają porównywać wartości E,
H, prądów i mocy między sobą.

### Przekroje i mapy

Wyświetlane są równocześnie:

- `xy`: przekrój poprzeczny dla wybranego `z`,
- `xz`: przekrój wzdłużny dla wybranego `y`,
- `yz`: przekrój wzdłużny dla wybranego `x`.

Kliknięcie przekroju wybiera go do sterowania suwakiem położenia. Tło może
pokazywać:

- `|E|`,
- `|H|`,
- chwilową składową `E_z`,
- chwilową składową `H_z`,
- chwilową składową `S_z`.

Na przekrojach wzdłużnych zaznaczane są pozycje `lambda_g/2`, `lambda_g` i
`3 lambda_g/2`, jeżeli mieszczą się w wybranej długości `L`. Symbole kropki i
krzyżyka oznaczają wektor odpowiednio wychodzący z płaszczyzny i wchodzący w
płaszczyznę.

Widok 3D można obracać lewym przyciskiem myszy i przybliżać kółkiem.

## Model fizyczny

Dla jednorodnego wypełnienia:

```text
epsilon = epsilon_0 epsilon_r
mu      = mu_0 mu_r
k       = omega sqrt(mu epsilon)
kc      = sqrt((m pi/a)^2 + (n pi/b)^2)
fc      = kc / (2 pi sqrt(mu epsilon))
```

Powyżej odcięcia:

```text
beta     = sqrt(k^2 - kc^2)
lambda_g = 2 pi / beta
v_p      = omega / beta
v_g      = v^2 / v_p
Z_TE     = omega mu / beta
Z_TM     = beta / (omega epsilon)
```

Poniżej odcięcia:

```text
alpha = sqrt(kc^2 - k^2)
```

i zależność wzdłużna jest prezentowana jako `exp(-alpha z)`. Jest to pole
zanikające, a nie fala bieżąca transportująca moc w nieskończonym falowodzie.

### Rozkłady modowe

Dla TE bazową składową jest:

```text
H_z = H0 cos(kx x) cos(ky y)
```

Dla TM:

```text
E_z = E0 sin(kx x) sin(ky y)
```

Składowe poprzeczne są obliczane z pochodnych składowej wzdłużnej zgodnie z
równaniami Maxwella i przyjętą konwencją fazową. Chwilowe pola są częścią
rzeczywistą fazorów.

### Ścianki PEC i prądy

Na idealnym przewodniku styczna składowa pola elektrycznego musi znikać.
Aplikacja próbkuje wszystkie cztery ścianki i raportuje największe względne
naruszenie `E_t = 0`; dla poprawnych modów powinno ono być na poziomie błędu
zmiennoprzecinkowego.

Normalne używane do obliczenia `Js = n x H` są skierowane z wnętrza falowodu
do przewodnika:

```text
x = 0: n = -x
x = a: n = +x
y = 0: n = -y
y = b: n = +y
```

`Js` ma jednostkę A/m i istnieje na powierzchni metalu. `Jd` oraz `J_sigma`
mają jednostkę A/m^2 i istnieją w objętości wypełnienia.

## Ograniczenia

1. Ścianki są idealnymi przewodnikami PEC. Brak strat przewodnikowych,
   skończonej głębokości wnikania i efektu naskórkowego.
2. Rozkłady modowe oraz `fc`, `beta`, impedancje i prędkości są liczone dla
   bezstratnego ośrodka opisanego rzeczywistymi `epsilon_r` i `mu_r`.
3. Dla `sigma > 0` obliczane jest `J_sigma = sigma E`, ale przewodność nie
   wpływa zwrotnie na zespoloną stałą propagacji ani tłumienie dielektryczne.
4. Pokazywany jest pojedynczy monochromatyczny mod własny bez superpozycji.
5. Brak źródła, nieciągłości geometrii, zakończeń, odbić i sprzęgania modów.
6. Mapy i strzałki są wizualizacją próbkowaną, a nie siatką metody
   numerycznej FEM/FDTD.
7. Przy dokładnym `f = fc` aplikacja klasyfikuje mod jako niepropagujący.

## Testy

Testy jednostkowe w `src/physics/waveguide.test.ts` obejmują:

- częstotliwość odcięcia `TE10` dla WR-90,
- wykrycie pracy poniżej odcięcia,
- odrzucenie `TE00`,
- odrzucenie `TM10`, `TM01` i `TM00`,
- numeryczny test warunku `E_t = 0` na PEC.

## Dodatkowe materiały

W katalogu znajdują się:

- `raport_typy_zadan_i_karta_wzorow.pdf` i jego źródło LaTeX,
- `falowód_prostokatny_formatka.jpeg`.

Raport zawiera szersze zestawienie typów zadań i wzorów związanych między
innymi z ośrodkami warstwowymi oraz falowodami.

## Struktura projektu

```text
falowody_sim/
├── src/
│   ├── physics/
│   │   ├── waveguide.ts       # obliczenia parametrów i pól
│   │   ├── waveguide.test.ts  # testy modelu
│   │   ├── complex.ts         # działania na fazorach i wektorach
│   │   └── types.ts
│   ├── components/
│   │   ├── Controls.tsx
│   │   ├── FieldCanvas.tsx    # przekroje Canvas 2D
│   │   ├── Waveguide3D.tsx    # scena Three.js
│   │   ├── ResultsPanel.tsx
│   │   └── Theory.tsx
│   └── App.tsx
├── package.json
├── Dockerfile                 # test, build Vite i obraz Nginx
├── compose.yaml
└── nginx.conf
```
