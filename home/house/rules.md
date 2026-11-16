# Dom 3D: zasady

> **Zmiany w tym pliku: LLM zawsze najpierw pyta.** Ustalamy, co robimy; LLM zapisuje to tutaj; właściciel to zatwierdza; dopiero wtedy robota jest robiona. Bez tej zgody LLM tego pliku nie zmienia.

Co strona ma robić.

## 1. Trzy drzewa

building.dat.js zawiera trzy drzewa:

- **Geometria**: z czego dom jest zbudowany.
- **Warstwy**: co można włączyć i wyłączyć.
- **Widoki**: jak się na dom patrzy (3D, 2D, Info, Test).

Menu decyduje, co widać i skąd. Panel zawiera tylko ustawienia tego wyboru; nigdy nie powtarza menu.

- **Otwarta kondygnacja**: najwyższa pokazana kondygnacja, gdy dach jest wyłączony. Jej przekrój i pomieszczenia są w panelu.
- **Pomieszczenia**: kliknięcie pomieszczenia (w 3D albo na liście) wybiera je. Dostaje wiersz w górnym menu (nazwa, link do podprojektu), a panel pokazuje jego posadzkę. Płytki ustawia się dla pomieszczenia, nigdy dla całej kondygnacji.
- **Warstwy** przełącza się w panelu Warstwy, nie w panelu pomieszczenia.

## 2. Geometria

- **Źródło**: archon/analysis.md ze zmianami wykonawczymi. Model przepisuje bryły z analizy i nigdy nie mierzy na nowo.
- **Bryły**: jedyną bryłą jest prostopadłościan równoległy do osi. Jedna ściana to jedna bryła, w całości, przez drzwi i okna. Otwory wycina się z każdej ściany i każdego styropianu, przez które przechodzą. Na skrzyżowaniu ścian przechodzi grubsza (nośna). Bryłę sięgającą dachu przycinają obie połacie; okna w szczytach przycinają linie równoległe do dachu.
- **Wycięcia**: element może odejmować inne elementy albo otwory (strop bez otworu schodów i komina).
- **Kondygnacje**: jedna płaszczyzna dzieli dom na wysokości górnej krawędzi ścian parteru (2720). Pod nią jest parter, nad nią poddasze ze stropem. Bryła przecięta tą płaszczyzną dzieli się na dwie części.
- **Styropian** otula pustaki od zewnątrz, nigdy nie leży między dwoma pustakami: każdy pustak jest ocieplony ze wszystkich stron, bez mostków termicznych. Każdy odsłonięty koniec muru dostaje czapę ze styropianu. Rama portalu ma wszędzie jedną szerokość: 640 (styropian 200 + pustak 240 + styropian 200; dach mierzony prostopadle do połaci).
- **Elewacja**: wykończenie (tynk, grafit, drewno, cokół) pokrywa tylko te części styropianu, które stykają się z powietrzem. Gdzie styropian dotyka innej bryły, zostaje goły. Wykończenie wybierają reguły (strona, obszar, wysokość); późniejsza reguła wygrywa.
- **Okna i drzwi** stoją w murze, licem do jego zewnętrznej powierzchni. Ich wymiary to etykiety archon (szerokość/wysokość), pokazane na rzucie 2D. Rodzaj otworu mówi, co w nim jest (rama przeszklona z parapetem albo bez, pełne skrzydło, albo jedno i drugie) i czy posadzka przechodzi przez otwór.
- **Fundamenty**: każda ściana parteru z pustaka 240 stoi na ścianie fundamentowej i ławie. Komin stoi na płycie na gruncie, na własnym fundamencie. Ławy w jednej linii mają wspólną krawędź.
- **Schody**: wspornikowe, same stopnie i spocznik; bez policzków i bez ścianki pod biegiem.
- **Poza modelem**: meble, kuchnia, wyposażenie łazienek, kominek (to podprojekty).
- **Rysowanie** według core. Ściany między częściami jednego elementu nie są rysowane. Płytki i fuga leżą tuż nad stropem, nigdy w jego płaszczyźnie.

## 3. Warstwy

- **Parter, Piętro, Dach** to pola wyboru w górnym menu.
- **Warstwy materiałowe** są w panelu: Fundament, Pustaki, Wieniec i strop, Styropian (→ Elewacja), Okna i drzwi, Schody, Posadzki (→ Drobne docinki), Teren, Krawędzie.
- **Elewacja** wyłączona pokazuje goły styropian.
- Przełączenie warstwy nie zmienia liczby płytek ani kamery.

## 4. Poruszanie się, przekrój, 2D

- **Spacer**: ciało to koło (walk.radius); ściany i stałe elementy domu je odpychają najkrótszą drogą, więc idzie się wzdłuż ściany, a przy ościeżu skręca w przejście. Przez drzwi (przejście) prowadzi posadzka. Krok jest dzielony, żeby nie przejść przez ścianę. Meble też zatrzymują: każdy podprojekt podaje przez interfejs room.js, na co się wpada (jego bryły, drzwiczki i szuflady zamknięte, detale), tylko to, co jest pokazane; drzwi pomieszczenia w przejściu nie zatrzymują, przechodzi się jak przez otwarte.
- **Poruszanie**: punkt obrotu nigdy nie zostaje za kamerą.
- **Przekrój**: płaszczyzna, która tnie model. Suwak przesuwa się o pełne kroki od 500 mm nad podłogą; ostatni krok to góra kondygnacji, gdzie cięcia nie ma.
- **2D**: obie kondygnacje obok siebie, ogród u góry. Cięcie 1500 mm nad podłogą parteru i 800 mm nad podłogą poddasza. Schody pod cięciem rysuje się linią ciągłą, nad cięciem przerywaną; z poddasza widać je całe przez otwór w stropie.

## 5. Materiały i płytki

- Materiały to osobna biblioteka; element podaje nazwę swojego materiału. Materiał określa też wypełnienie na rzucie 2D.
- Płytka to prawdziwy produkt ze sklepu: tekstura, wymiar, fuga i najmniejszy dopuszczalny docinek tworzą całość, a link prowadzi do tego właśnie produktu. Strona wybiera produkt, nigdy jego części.
- Układ należy do pomieszczenia: wzór, kierunek, kolor fugi, przesunięcia.

## 6. Podprojekty

- Salon prowadzi do rooms/kitchen/index.html; obie łazienki do rooms/bathroom/index.html.
- Meble podprojektów są w domu warstwą Meble (Warstwy) na swojej kondygnacji; kliknięcie drzwiczek albo szuflady otwiera je. Dziś: kuchnia i obie łazienki (każda na swojej kondygnacji; podwieszany sufit łazienki nie jest pokazywany w domu).
- Płytki łazienek leżą na ścianach domu: część podaje je jako wykończenia ścian swojego pomieszczenia (dane: pole, kierunek, materiał), dom kładzie je na swoich ścianach i ościeżach i pokazuje z warstwą części. Płytki posadzki łazienek tak samo: z danych łazienki, z warstwą części; dom nie kładzie tam swoich (Wykończenie: „z projektu”). Posadzkę pozostałych pomieszczeń rysuje dom (Wykończenie). Posadzka podprojektu leży na płycie domu, nigdy w jej płaszczyźnie.

## 7. Kontrole (Test)

- Grubość elementu zgadza się z jego rodzajem.
- Żadne dwie bryły nie mają wspólnej objętości: elementy, ramy, szkło, skrzydła, dach, schody, teren.
- Każdy fragment podłogi wewnątrz ścian jest pomieszczeniem, ścianą, otworem albo ma nazwę; resztę pokazuje się jako dokładne prostokąty.
- Płytki: docinki mniejsze niż najmniejszy dopuszczalny dla produktu są czerwone i policzone.
