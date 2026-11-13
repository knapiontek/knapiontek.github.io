# Zasady projektowania kuchni

> Plik pisany i zmieniany ręcznie przez człowieka. LLM go nie zmienia. Bez szczegółów kodu.

Ogólne zasady dla każdej kuchni. Wartości liczbowe (głębokości, odstępy, luzy, tabele półek i zawiasów) są w danych projektu, a decyzje konkretnego projektu (np. szczeliny frontów, produkty) w jego notatkach.

## 1. Układ

- **Grupa** to ciąg szafek przy jednej ścianie albo wyspa. Grupa ma kolumny o szerokości w mm.
- **Element** leży w grupie, zaczyna się w danej kolumnie i może zajmować kilka kolumn. Elementy układa się od podłogi w kolejności listy: element staje na najwyższym elemencie w swoich kolumnach albo wypełnia lukę pod szerszym elementem dodanym wcześniej.
- **Miejsce** elementu to grupa i kolumny: G1[4] to grupa 1, kolumna 4; G1[1-11] to kolumny 1 do 11.

## 2. Typy i tagi

Każdy element ma dokładnie jeden **typ**, który decyduje, co powstaje. **Tagi** dodają cechy do typu; każdy tag pasuje tylko do wymienionych typów.

| Typ | Co powstaje |
|---|---|
| wypełnienie | nic, to pusta przestrzeń; na końcu korpusu (np. ukryty narożnik L): panel wpuszczany; korpus z samych wypełnień (np. podporowy pod korpusem na blacie): panel wpuszczany na całą szerokość |
| zabudowa GK | zabudowa z płyt gipsowych |
| cokół | cokół |
| blat | blat; jego grubość = wysokość elementu |
| panel końcowy | pionowa płyta pod końcem blatu, do podłogi; jego grubość = szerokość elementu |
| panel ścienny | płyta na ścianie |
| panel przedni | płyta na płasko |
| listwa przednia | na sztorc w płaszczyźnie frontów pomiędzy korpusami |
| szafka | miejsce w korpusie z drzwiami |
| szuflada | miejsce w korpusie z szufladą |
| piekarnik, mikrofalówka | urządzenie do zabudowy w korpusie, bez frontu |

| Tag | Dla | Co zmienia |
|---|---|---|
| atrapa | szuflada | stały front, bez szuflady |
| zlew | szafka, szuflada | trawersy na sztorc, bez półek ruchomych, wycięcie w blacie |
| płyta grzewcza | szafka, szuflada | przedni trawers niski na sztorc, tylny na sztorc, przegroda pod płytą |
| kosze | szuflada | kosze na odpady w szufladzie |
| szuflada wewnętrzna | szuflada | szuflada M nad szufladą, za tym samym frontem |
| ekspres | szafka | półka wysuwana na dole (po stronie zawiasów płyta dystansowa), nad nią półki ruchome |
| szuflady za drzwiami | szafka | skrzynki z płyty na prowadnicach kulkowych za drzwiami, bez półek ruchomych; po stronie zawiasów płyta dystansowa, żeby szuflady mijały zawiasy i otwarte drzwi |
| lodówka, zamrażarka | szafka | front na drzwiach urządzenia, bez zawiasów, półek ruchomych i pleców |
| zmywarka | szafka | front na drzwiach urządzenia, bez korpusu |
| wyspa | blat | blat z materiału wyspy, panel tylny wyspy, wyspa stoi wolno (bez ściany) |

Element może mieć najwyżej jeden z tagów lodówka, zamrażarka, zmywarka. Wykluczają się też: atrapa z koszami, atrapa ze szufladą wewnętrzną, ekspres z szufladami za drzwiami, a w jednym korpusie zlew z płytą grzewczą.

## 3. Korpus

- **Korpus** tworzą wszystkie elementy tej samej grupy z tą samą nazwą korpusu. Wszystkie korpusy mają jedną głębokość. Odstęp tyłu korpusów od ściany ustala się dla każdej grupy (wyspa: do tylnej krawędzi blatu).
- **Rodzaje korpusu:**
  - dolny: stoi na cokole i ma nad sobą blat;
  - słupek: stoi na cokole i nie ma blatu;
  - górny: stoi na korpusie dolnym.

  Korpus na cokole ma nóżki.
- **Mocowanie:** listwa tylna jest przymocowana do ściany kątownikiem, poza najwyższą w stosie. Listwę przednią i listwy tylne przykręca się do pierwszego korpusu zwykłym wkrętem, a drugi korpus do nich wkrętem od środka.
- **Kratka w cokole** (wlot powietrza) jest pod korpusem na cokole z piekarnikiem, lodówką lub zamrażarką, bo producent wymaga wentylacji.
- **Góra korpusu:** dolny ma dwa trawersy płaskie, pozostałe rodzaje mają wieniec górny.
- **Plecy** są tylko za drzwiami szafek, z jednego kawałka na ciąg drzwi. Nie ma ich za szufladami ani urządzeniami.
- **Półka stała** leży na środku styku dwóch elementów i ma pełną głębokość. Nie ma jej w korpusie dolnej szafki.
  - nad piekarnikiem: płytsza z tyłu (gorące powietrze); pod piekarnikiem: niżej, poza jego frontem;
  - w korpusie lodówki: tylko jedna, na górze urządzenia, które jest do niej przykręcone; płytsza z tyłu (wylot powietrza).
- **Półki ruchome** są tylko za drzwiami szafki:
  - liczba zależy od wysokości frontu;
  - półka jest płytsza od korpusu i ma luz z obu stron;
  - to jedna płyta przez cały korpus.
- **Zawiasy** mają tylko drzwi:
  - liczba zależy od wysokości frontu;
  - strona zawiasów nie może być stroną uchwytu;
  - naprzeciw każdego zawiasu jest odbojnik.
- **Słupek zawiasowy** staje po stronie zawiasów, gdy drzwi nie sięgają boku korpusu.
- **Szuflada** jest wysoka (D), gdy front przekracza ustaloną wysokość, a inaczej niska (M).

## 4. Fronty, listwy, panele przednie, blat

- **Front** = moduł minus 4 szczeliny (lewa, prawa, góra, dół). Front jest odsunięty od korpusu o ustaloną szczelinę, której wymagają zawiasy. Front shaker ma ramę o stałej szerokości.
- **Listwa przednia** stoi na sztorc w płaszczyźnie frontów i jest z jednego kawałka.
- **Listwy tylne**: z płyty wiórowej, za listwą przednią, przy tyle korpusów, pocięte jak przyległe korpusy.
- **Panel przedni** leży na płasko. W korpusie jest przykręcony do korpusu, bez szczeliny; poza korpusem stoi w płaszczyźnie frontów i jest przykręcony do sąsiedniego panelu.
- **Blat:**
  - materiał blatu podaje głębokość płyty, którą się kupuje; wyspa ma osobny materiał;
  - wystaje przed fronty o nawis;
  - sięga do ściany (wyspa: do odstępu grupy), nadmiar płyty odcina się z tyłu.
- **Panel końcowy** stoi pod końcem blatu, od podłogi do spodu blatu, a blat leży na nim:
  - jest z osobnego materiału, dwustronnego, bo widać obie jego strony; wyspa ma osobny materiał;
  - blat wystaje poza niego o nawis panelu końcowego: z boku (wypełnienie), z przodu, w wyspie także z tyłu.
- **Wyspa** (blat z tagiem wyspa) ma panel tylny między panelami końcowymi, od podłogi do góry korpusów.
- **Cokół** jest cofnięty za fronty.

## 5. Otwory i wycięcia

Średnice, głębokości i odległości otworów oraz wymiary wycięć są w danych projektu.

- **Puszka zawiasu:** w tylnej stronie drzwi, przy każdym zawiasie, w stałej odległości od krawędzi zawiasów.
- **Odbojnik:** w przedniej krawędzi boku naprzeciw zawiasu, na jego wysokości.
- **Prowadnik zawiasu:** dwa otwory na wewnętrznej stronie boku albo słupka zawiasowego, w stałej odległości od przodu, symetrycznie wokół wysokości zawiasu.
- **Podpórki półki ruchomej:** pod każdą półką, w obu bokach, przy przodzie i przy tyle.
- **Prowadnice szuflad i półki wysuwanej:** w obu bokach (przy płycie dystansowej: w niej), w stałej odległości pod dnem szuflady (także szuflady wewnętrznej) i pod półką wysuwaną, w pozycjach od przodu podanych w danych.
- **Prowadnice kulkowe szuflad za drzwiami:** w płycie dystansowej i w boku po drugiej stronie, w stałej odległości nad dnem skrzynki, w pozycjach od przodu prowadnicy podanych w danych.
- **Zawias nad półką:** zawias wypadający przy półce przesuwa się nad nią.
- Otwory, które nachodzą na siebie na jednej części albo trafiają w płytę poziomą, są zgłaszane.
- **Wycięcia w blacie:** na zlew i płytę grzewczą, nad korpusem z tagiem zlew lub płyta grzewcza, na środku korpusu, w stałej odległości od tylnej krawędzi blatu; wycięcie musi zmieścić się w jednym blacie i we wnętrzu korpusu.
- Widok 3D pokazuje otwory kolorami (warstwa Otwory): zawiasy i odbojniki pomarańczowe, półki zielone, prowadnice niebieskie.

## 6. Krawędzie

- **Obrzeże** (technologia wg materiału): fronty – wszystkie krawędzie, listwy przednie – przednia, panele przednie – przy froncie. Materiał lakierowany na obu stronach.
- **Obrzeże na płytach korpusu** jest tylko na krawędziach widocznych:
  - boki, wieńce, półki, trawersy poziome, słupek zawiasowy i płyta dystansowa mają obrzeże na krawędzi przedniej;
  - trawers pionowy ma obrzeże na krawędzi dolnej;
  - płyta dystansowa w szafce z ekspresem kończy się tuż nad półką wysuwaną, więc ma obrzeże także na górze; przy szufladach za drzwiami sięga do płyty nad nią i góra jest zakryta.
- **Szuflady za drzwiami:** obrzeże na krawędziach widocznych po wysunięciu.
- **Bez obrzeża:** trawersy tylne, listwy tylne, plecy, panele wpuszczane, przegroda i części szuflad systemowych.
- **Blat i panel końcowy** mają obrzeże na krawędziach widocznych:
  - blat: krawędź boczna nad panelem końcowym, w wyspie także krawędź tylna;
  - panel końcowy: krawędź przednia, w wyspie także krawędź tylna;
  - krawędź wykończona fabrycznie (np. krawędź przednia blatu) nie dostaje obrzeża;
  - wycięcia na zlew i płytę zostają bez obrzeża.

## 7. Lista cięć

- Każdy rozmiar części ma etykietę, tę samą w opisie montażu.
- Przy każdym wymiarze jest liczba wykończonych krawędzi wzdłuż niego (0, 1 lub 2), jak w formularzu hurtowni; opis montażu mówi, gdzie jest każda krawędź z obrzeżem.
- Wycięcia w blacie mają kody z legendy listy; otwory są w opisie montażu.

## 8. Kontrole

- Błędy w danych są zgłaszane, np. brak typu, szczelin albo strony zawiasów, tag do złego typu, materiał blatu za płytki.
- Element bez jednego typu, bez wysokości w całych mm, bez kolumn w swojej grupie, wychodzący poza kolumny albo nachodzący na inny element dostaje uwagę i nie jest rysowany.
- Test pokazuje kolizje, małe szczeliny przy listwach przednich, listwach tylnych i panelach, części wystające oraz fronty, które nieznacznie nie trzymają linii. Duża szczelina albo duża różnica jest zamierzona i nie jest zgłaszana.

## 9. Kosztorys (szacunek, nie zasady)

Odpad płyt, naddatek na oklejanie, rezerwa, rozmiary arkuszy i ceny są ustawieniami kosztorysu. Każda cena powinna mieć link do sklepu.
