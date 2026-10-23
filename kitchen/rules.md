# Zasady projektowania kuchni

Ogólne zasady, wspólne dla każdego projektu kuchni. Wartości liczbowe (głębokości, odstępy, luzy, tabele półek i zawiasów) ustala się w danych projektu. Decyzje konkretnego projektu, jak szczeliny frontów czy produkty, zapisuje się w jego notatkach.

## 1. Układ

- **Grupa** to ciąg szafek przy jednej ścianie albo wyspa. Grupa ma kolumny o szerokości w mm i rolę: blat, zabudowa wysoka albo wyspa.
- **Element** leży w grupie, zaczyna się w danej kolumnie i może zajmować kilka kolumn. Elementy układa się od podłogi w kolejności listy: element staje na najwyższym elemencie w swoich kolumnach. Może też wypełnić lukę pod szerszym elementem dodanym wcześniej.
- **Miejsce** elementu zapisuje się jako grupa i kolumny: G1[4] to grupa 1, kolumna 4; G1[1-11] to kolumny 1 do 11.

## 2. Typy i tagi

Każdy element ma dokładnie jeden **typ**, który decyduje, co powstaje. **Tagi** dodają cechy do typu i każdy tag pasuje tylko do wymienionych typów.

| Typ | Co powstaje |
|---|---|
| wypełnienie | nic, to pusta przestrzeń; na końcu korpusu: panel wpuszczany |
| zabudowa GK | zabudowa z płyt gipsowych |
| cokół | cokół |
| blat | blat; jego grubość = wysokość elementu |
| panel ścienny | płyta na ścianie |
| panel | płyta na płasko w płaszczyźnie frontów |
| listwa | listwa na sztorc w płaszczyźnie frontów |
| szafka | miejsce w korpusie z drzwiami |
| szuflada | miejsce w korpusie z szufladą |
| piekarnik, mikrofalówka | urządzenie do zabudowy w korpusie, bez frontu |

| Tag | Dla | Co zmienia |
|---|---|---|
| atrapa | szuflada | stały front, bez szuflady |
| zlew | szafka, szuflada | trawersy na sztorc, bez półek ruchomych, wycięcie w blacie |
| płyta grzewcza | szafka, szuflada | przedni trawers niski, przegroda pod płytą |
| kosze | szuflada | kosze na odpady w szufladzie |
| szuflada wewnętrzna | szuflada | szuflada M nad szufladą, za tym samym frontem |
| ekspres | szafka | półka wysuwana na dole, nad nią półki ruchome |
| lodówka, zamrażarka | szafka | front na drzwiach urządzenia, bez zawiasów, półek i pleców |
| zmywarka | szafka | front na drzwiach urządzenia, bez korpusu |
| bok blatu | blat | blat opuszczony do podłogi |

Element może mieć najwyżej jeden z tagów lodówka, zamrażarka, zmywarka.

## 3. Korpus

- **Korpus** tworzą wszystkie elementy tej samej grupy z tą samą nazwą korpusu. Wszystkie korpusy mają jedną głębokość i stoją w jednym odstępie od ściany.
- **Rodzaje korpusu:**
  - dolna: stoi na cokole i ma nad sobą blat;
  - słupek: stoi na cokole i nie ma blatu;
  - górna: nie stoi na cokole.
- Korpus stojący na cokole ma nóżki.
- **Kratka w cokole** (wlot powietrza) jest pod korpusem na cokole, w którym stoi piekarnik albo lodówka lub zamrażarka.
- **Góra korpusu:** dolna ma dwa trawersy płaskie, a pozostałe rodzaje mają wieniec górny.
- **Plecy** są tylko za drzwiami szafek, z jednego kawałka na ciąg drzwi. Nie ma ich za szufladami ani urządzeniami.
- **Półka stała** jest na styku dwóch elementów i ma pełną głębokość. Nie ma jej w korpusie dolnej szafki ani przy lodówce. Przy piekarniku i mikrofalówce ustawia się ją na miejscu na wnękę podaną przez producenta (patrz notatka urządzenia).
- **Półki ruchome** są tylko za drzwiami szafki:
  - liczba zależy od wysokości frontu;
  - półka jest płytsza od korpusu i ma luz z obu stron;
  - to jedna płyta przez cały korpus.
- **Zawiasy** mają tylko drzwi:
  - liczba zależy od wysokości frontu;
  - strona zawiasów nie może być stroną uchwytu.
- **Słupek zawiasowy:** gdy drzwi nie sięgają boku korpusu po stronie zawiasów, staje tam słupek zawiasowy.
- **Panel wpuszczany:** wypełnienie na końcu korpusu (np. ukryty narożnik L) zamyka panel wpuszczany.
- **Szuflada** jest wysoka (D), gdy front przekracza ustaloną wysokość, a inaczej niska (M).

## 4. Fronty, listwy, panele, blat

- **Front** = moduł minus 4 szczeliny (lewa, prawa, góra, dół). Front shaker ma ramę o stałej szerokości.
- **Listwa** stoi na sztorc. Gdy nie należy do korpusu, dostaje listwę tylną przy ścianie.
- **Panel** leży na płasko w płaszczyźnie frontów.
- **Blat:**
  - głębokość zależy od roli grupy;
  - wystaje przed fronty o nawis;
  - z tyłu zostaje głębokość minus korpus, front i nawis.
- **Wyspa** ma panel tylny między skrajnymi kolumnami, od podłogi do góry korpusów.
- **Cokół** jest cofnięty za fronty.

## 5. Krawędzie

- **Lakier:**
  - fronty: obie strony i wszystkie krawędzie;
  - listwy: obie strony i krawędź przednia;
  - cokół i panele: tylko obie strony.
- **ABS na płytach korpusu** jest tylko na krawędzi widocznej z przodu:
  - boki, wieńce, półki, trawersy płaskie i słupek zawiasowy mają ABS na krawędzi przedniej;
  - trawers na sztorc ma ABS na krawędzi dolnej.
- **Bez ABS:** trawersy tylne, listwy tylne, plecy, panele wpuszczane, przegroda i części szuflad.
- **ABS na panelu** jest na każdej krawędzi przy froncie, który się otwiera.
- **Lista cięć** podaje przy każdym wymiarze liczbę wykończonych krawędzi wzdłuż niego (0, 1 lub 2), jak formularz hurtowni. Opis montażu mówi, gdzie jest każda krawędź z ABS.

## 6. Kontrole

- Błędy w danych są zgłaszane, np. brak typu, tag do złego typu, nakładanie się elementów, brak szczelin albo strony zawiasów, element poza kolumnami.
- Element bez jednego typu, poza kolumnami albo nachodzący na inny jest pomijany.
- Widok 3D pokazuje kolizje, szczeliny do 3 mm przy listwach i panelach, części wystające oraz fronty, które o kilka mm nie trzymają linii.

## 7. Kosztorys (szacunek, nie zasady)

Odpad płyt, naddatek na oklejanie, rezerwa, rozmiary arkuszy i ceny są ustawieniami kosztorysu. Każda cena ma link do sklepu i obowiązuje na dzień podany w nagłówku, do czasu oferty.
