# Raport: przegląd projektu (2026-11-16)

Projekt jest w dobrym stanie: podział na interfejsy i zależności w jedną stronę jest czysty, martwego kodu prawie nie ma. Do decyzji: sprzątanie MD, kilka powtórzeń w kodzie i ustalenia garderób.

## 1. Pliki MD

| # | Problem | Propozycja |
|---|---|---|
| 1 | house/rules.md opisuje głównie, co robi strona (menu, warstwy, spacer, 2D, Test). Dom jest gotowy, wykonawcy nic z tego nie potrzeba. | Usunąć plik. |
| 2 | core/rules.md to opis programu, nie zasady wykonania (i jest po angielsku). | Usunąć; kilka zasad (dokładne bryły, bez łatania błędów, krawędzie jako warstwa) krótko do core/project.md. |
| 3 | kitchen/rules.md jest dobry dla stolarza, ale ma wstawki o aplikacji: układanie elementów w edytorze, kolory otworów w 3D, Test, ustawienia kosztorysu. | Przenieść te części do kitchen/project.md. |
| 4 | test.md odsyła do „4 kolizji w kuchni” w To do, a w To do ich nie ma. | Dopisać kolizje do To do (to realna robota). |
| 5 | Garderoby są wymienione z nazwy w house/project.md; po zrobieniu podprojektu to się zestarzeje. | Zaktualizować razem z garderobami. |

Łazienki nie mają rules.md: zostaje tak.

## 2. Kod

| # | Problem | Propozycja |
|---|---|---|
| 1 | Animacja drzwi i szuflad (otwieranie, wygładzanie ruchu, szukanie klikniętej części) napisana trzy razy: dom, kuchnia, łazienka. | Jeden ogólny mechanizm „ruchomej części” (obrót albo wysuw) w core. Core nie wie nic o domu ani o drzwiach: dom, kuchnia i łazienka mówią mu tylko, co się obraca albo wysuwa. Albo zostawić trzy kopie. |
| 2 | Wygląd materiałów (kolory, połysk) wpisany w kod kuchni i łazienki; część dubluje bibliotekę materiałów (stal, szkło). Kuchnia trzyma metale uchwytów w danych, łazienka w kodzie. | Do danych: wspólne do biblioteki, metale łazienki do bathroom.dat.js. |
| 3 | ROUNDUP w dwóch wersjach (arkusz w core i kuchnia); dla liczb ujemnych liczą inaczej. | Kuchnia używa wersji z core. |
| 4 | Rzut 2D pomieszczenia: prawie ten sam kod w kuchni i w łazience. | Jedna ogólna funkcja w core (rzut z brył), albo zostawić. |
| 5 | Sprawdzanie interfejsów: prawie ten sam kod w room.js i shell.js. | Jedna funkcja w core, albo zostawić. |
| 6 | Martwy kod: jeden nieużywany eksport w łazience (ROOM_CELLS). | Usunąć. |

Każda zmiana w kodzie sprawdzana testami przed i po: wygląd i działanie bez zmian.

## 3. Garderoby

Przyjęte ustalenia: korpusy 800, 400 mm głębokości z dala od wejścia i 300 przy wejściu, bez frontów, nóżki, cokół 50 mm, plecy HDF.

Z pomiarów: skos opada wzdłuż ciągów szafek, ok. 720 mm na każdy korpus 800, więc nad każdym korpusem pod skosem zostaje pusty trójkąt. Na razie robione jak ustalono; poprawimy później.

Założenia pierwszej wersji:
- płyta biała 18 mm (16 mm ugnie się na 800);
- wnętrze: półki; w każdej garderobie 2 szuflady na dole w jednym korpusie; na razie bez drążków;
- posadzka zostaje domu (jak w kuchni); garderoby 3 i 4 dalej mają płytki z sypialnią;
- biała płyta i biały HDF: nie ma ich w bibliotece, cena „do sprawdzenia”;
- interfejsy room.js i shell.js mówią „jedno pomieszczenie na kondygnację”, a garderoby to trzy na poddaszu: zmiana na „jedno lub więcej”.
