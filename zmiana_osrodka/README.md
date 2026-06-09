# Fala elektromagnetyczna na granicy dwóch ośrodków

Interaktywna aplikacja edukacyjna pokazująca prostopadłe padanie płaskiej fali
elektromagnetycznej na granicę dwóch jednorodnych, izotropowych i bezstratnych
ośrodków. Granica znajduje się w `z = 0`, fala padająca biegnie z ośrodka 1
(`z < 0`) w kierunku `+z`, a pola mają orientację:

- `E = E_x`,
- `H = H_y`,
- `E x H` skierowane wzdłuż osi propagacji.

Projekt odpowiada wizualizacji „CW4, zadanie 1” i jest najprostszym z trzech
modeli w repozytorium: zawiera jedną granicę, bez warstwy o skończonej
grubości.

## Co symuluje aplikacja

Dla zadanych `epsilon_r`, `mu_r`, częstotliwości i średniej gęstości mocy fali
padającej aplikacja oblicza:

- impedancje falowe `Zw1` i `Zw2`,
- prędkości fazowe, długości fal i stałe fazowe w obu ośrodkach,
- współczynniki odbicia `Gamma_E`, `Gamma_H`,
- współczynniki transmisji amplitudy `T_E`, `T_H`,
- współczynniki mocy odbitej i transmitowanej,
- amplitudy E, H, D i B,
- współczynnik fali stojącej WFS w ośrodku 1.

Wykres przedstawia chwilowe wartości fali padającej, odbitej, transmitowanej
oraz ich fizycznej sumy. Po lewej stronie granicy pole całkowite jest sumą fali
padającej i odbitej; po prawej występuje fala transmitowana.

## Uruchomienie

### Docker

Wymagane są Docker i Docker Compose:

```bash
cd zmiana_osrodka
docker compose up --build -d
```

Aplikacja będzie dostępna pod adresem:

<http://localhost:4173>

Podgląd stanu i logów:

```bash
docker compose ps
docker compose logs -f
```

Zatrzymanie:

```bash
docker compose down
```

Port `4173` jest wpisany na stałe w `compose.yml`. Jeżeli jest zajęty, należy
zmienić lewą stronę mapowania portu, na przykład z `4173:80` na `4174:80`.

### Bez Dockera

Projekt nie wymaga kompilacji ani instalowania pakietów. Są to statyczne pliki
HTML, CSS i JavaScript, ale należy podać je przez lokalny serwer HTTP:

```bash
cd zmiana_osrodka
python3 -m http.server 4173
```

Następnie należy otworzyć <http://localhost:4173>. Bezpośrednie otwieranie
`index.html` może działać, ale serwer HTTP lepiej odpowiada środowisku
produkcyjnemu.

## Obsługa

### Dane wejściowe

- `epsilon_r1`, `mu_r1`: właściwości ośrodka, z którego pada fala,
- `epsilon_r2`, `mu_r2`: właściwości ośrodka po drugiej stronie granicy,
- `f [GHz]`: częstotliwość fali,
- `S_avg [W/m^2]`: średnia gęstość mocy fali padającej.

Wszystkie wartości muszą być dodatnie. Przycisk „Przywróć zadanie 1” ustawia:

- `epsilon_r1 = 8`, `mu_r1 = 2`,
- `epsilon_r2 = 36`, `mu_r2 = 4`,
- `f = 1 GHz`,
- `S_avg = 1 W/m^2`.

### Widok i animacja

Zakładki E, H, D i B zmieniają prezentowaną wielkość. Można niezależnie
włączać krzywe fali padającej, odbitej, transmitowanej, pola całkowitego i
obwiedni. Sterowanie czasem pozwala:

- odtwarzać lub zatrzymać animację,
- przesuwać fazę o `1/16` okresu,
- ustawić dowolną fazę suwakiem,
- zmienić umowne tempo animacji.

Opcja „wspólna skala względna” dopasowuje zakres osi pionowej do największej
amplitudy aktualnie wybranego pola. Osobny suwak skali powiększa wykres
pionowo.

## Model fizyczny

Dla ośrodka `i`:

```text
eta_i    = sqrt(mu_i / epsilon_i)
v_i      = 1 / sqrt(mu_i * epsilon_i)
lambda_i = v_i / f
beta_i   = 2 pi / lambda_i
```

Współczynniki amplitudowe pola elektrycznego przy padaniu prostopadłym:

```text
Gamma_E = (eta_2 - eta_1) / (eta_2 + eta_1)
T_E     = 1 + Gamma_E
```

Dla pola magnetycznego zmiana kierunku fali odbitej daje:

```text
Gamma_H = -Gamma_E
T_H     = 1 + Gamma_H
```

Współczynniki mocy dla ośrodków bezstratnych:

```text
R   = |Gamma_E|^2
T_P = 1 - R
```

Amplituda padającego pola elektrycznego jest wyznaczana z zadanej średniej
gęstości mocy:

```text
E0 = sqrt(2 * eta_1 * S_avg)
H0 = E0 / eta_1
```

Aplikacja używa przebiegów cosinusoidalnych. Faza fali padającej i
transmitowanej ma postać `omega t - beta z`, natomiast fali odbitej
`omega t + beta z`.

## Warunki na granicy

Przy braku powierzchniowych źródeł styczne składowe E i H są ciągłe:

```text
E1+ + E1- = E2
H1+ + H1- = H2
```

Wyświetlane D i B są również styczne do granicy. Ponieważ `D = epsilon E` i
`B = mu H`, ich wartości mogą wykonać skok:

```text
D2t / D1t = epsilon_2 / epsilon_1
B2t / B1t = mu_2 / mu_1
```

Nie należy mylić tego z warunkami ciągłości składowych normalnych D i B.

## Jak interpretować wykres

- Oś przestrzenna obejmuje `-2 lambda_1` po lewej i `+3 lambda_2` po prawej.
- Obie części osi są skalowane niezależnie do dostępnej szerokości ekranu.
  Wykres pokazuje liczbę długości fal, a nie wspólną liniową skalę metryczną.
- Obwiednia w ośrodku 1 pokazuje częściową falę stojącą powstałą z
  interferencji fali padającej i odbitej.
- Znak pola E lub D oznacza zwrot w osi `x`, a znak H lub B zwrot w osi `y`.
- Animacja jest zmianą fazy rozwiązania harmonicznego, a nie symulacją
  numeryczną procesu włączania źródła.

## Ograniczenia

1. Ośrodki są bezstratne: `sigma = 0`, a `epsilon_r` i `mu_r` są rzeczywiste
   oraz dodatnie.
2. Uwzględniono wyłącznie padanie prostopadłe.
3. Model opisuje monochromatyczną falę płaską w stanie ustalonym.
4. Brak dyspersji, nieliniowości, źródeł powierzchniowych i przejść
   czasowych.
5. Nie ma polaryzacji TE/TM względem płaszczyzny padania, ponieważ przy
   padaniu prostopadłym są one równoważne.
6. Projekt nie ma automatycznych testów; obliczenia znajdują się bezpośrednio
   w `app.js`.

## Struktura projektu

```text
zmiana_osrodka/
├── index.html    # interfejs i opis sekcji
├── styles.css    # układ oraz styl responsywny
├── app.js        # obliczenia fizyczne, stan i rysowanie Canvas 2D
├── Dockerfile    # statyczny obraz Nginx
└── compose.yml   # uruchomienie na porcie 4173
```
