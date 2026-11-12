# Dom 3D: zasady

Co strona ma robić. Jak robią to pliki: [project.md](project.md). Skąd są wymiary: [archon/analysis.md](archon/analysis.md).

## 1. Trzy drzewa

house.js zawiera trzy drzewa:

- **Geometria**: z czego dom jest zbudowany.
- **Warstwy**: co można włączyć i wyłączyć.
- **Widoki**: jak się na dom patrzy (3D, 2D, Analiza).

Menu decyduje, co widać i skąd. Panel zawiera tylko ustawienia tego wyboru; nigdy nie powtarza menu.

- **Otwarta kondygnacja**: najwyższa pokazana kondygnacja, gdy dach jest wyłączony. Jej przekrój i pomieszczenia są w panelu.
- **Pomieszczenia**: kliknięcie pomieszczenia (w 3D albo na liście) wybiera je. Dostaje wiersz w górnym menu (nazwa, link do podprojektu), a panel pokazuje jego posadzkę. Płytki ustawia się dla pomieszczenia, nigdy dla całej kondygnacji.
- **Warstwy** przełącza się w panelu Warstwy, nie w panelu pomieszczenia.

## 2. Geometria

- **Jednostki**: mm, liczby całkowite, wszędzie: w danych, w kodzie, na stronie i w dokumentach. Projekty kuchni i łazienek też są w mm.
- **Źródło**: archon/analysis.md ze zmianami wykonawczymi (§ 14). Model przepisuje bryły z analizy i nigdy nie mierzy na nowo.
- **Bryły**: jedyną bryłą jest prostopadłościan równoległy do osi. Jedna ściana to jedna bryła, w całości, przez drzwi i okna. Otwory wycina się z każdej ściany i każdego styropianu, przez które przechodzą. Na skrzyżowaniu ścian przechodzi grubsza (nośna). Bryłę sięgającą dachu przycinają obie połacie; okna w szczytach przycinają linie równoległe do dachu.
- **Wycięcia**: element może odejmować inne elementy albo otwory (strop bez otworu schodów i komina).
- **Kondygnacje**: jedna płaszczyzna dzieli dom na wysokości górnej krawędzi ścian parteru (2720). Pod nią jest parter, nad nią poddasze ze stropem. Bryła przecięta tą płaszczyzną dzieli się na dwie części.
- **Bez nakładania**: żadne dwie bryły nie mają wspólnej objętości (sprawdza Analiza).
- **Styropian** otula pustaki od zewnątrz, nigdy nie leży między dwoma pustakami: każdy pustak jest ocieplony ze wszystkich stron, bez mostków termicznych. Każdy odsłonięty koniec muru dostaje czapę ze styropianu. Rama portalu ma wszędzie jedną szerokość: 640 (styropian 200 + pustak 240 + styropian 200; dach mierzony prostopadle do połaci).
- **Elewacja**: wykończenie (tynk, grafit, drewno, cokół) pokrywa tylko te części styropianu, które stykają się z powietrzem. Gdzie styropian dotyka innej bryły, zostaje goły. Wykończenie wybierają reguły (strona, obszar, wysokość); późniejsza reguła wygrywa.
- **Okna i drzwi** stoją w murze, licem do jego zewnętrznej powierzchni. Ich wymiary to etykiety archon (szerokość/wysokość), pokazane na rzucie 2D. Rodzaj otworu mówi, co w nim jest (rama przeszklona z parapetem albo bez, pełne skrzydło, albo jedno i drugie) i czy posadzka przechodzi przez otwór.
- **Fundamenty**: każda ściana parteru z pustaka 240 stoi na ścianie fundamentowej i ławie. Komin stoi na płycie na gruncie, na własnym fundamencie. Ławy w jednej linii mają wspólną krawędź.
- **Schody**: wspornikowe, same stopnie i spocznik; bez policzków i bez ścianki pod biegiem.
- **Poza modelem**: meble, kuchnia, wyposażenie łazienek, kominek.
- **Rysowanie** według core: wspólne wierzchołki, bez T-połączeń, nic nie jest ukryte, żeby zasłonić błąd. Ściany między częściami jednego elementu nie są rysowane. Płytki i fuga leżą tuż nad stropem, nigdy w jego płaszczyźnie.

## 3. Warstwy

- **Parter, Piętro, Dach** to pola wyboru w górnym menu.
- **Warstwy materiałowe** są w panelu: Fundament, Pustaki, Wieniec i strop, Styropian (→ Elewacja), Okna i drzwi, Schody, Posadzki (→ Drobne docinki), Teren, Krawędzie.
- **Elewacja** wyłączona pokazuje goły styropian.
- **Krawędzie**: każdy element pokazuje krawędzie tam, gdzie jest odsłonięty. Styk dwóch elementów w jednej płaszczyźnie widać tylko wtedy, gdy sąsiad jest ukryty. Krawędzie są dokładne, nigdy próbkowane.
- Warstwa podrzędna jest widoczna tylko z nadrzędną; element jest widoczny tylko wtedy, gdy wszystkie jego warstwy są włączone.
- Przełączenie warstwy zmienia tylko to, co widać: nigdy model, liczbę płytek ani kamerę.

## 4. Menu i poruszanie się

- **Lewy górny róg**: jeden przełącznik 3D / 2D / Analiza.
- **3D, góra**: Parter, Piętro, Dach; drugi wiersz, gdy wybrano pomieszczenie.
- **3D, dół**: Spacer i kamery domu oraz otwartej kondygnacji.
- **Poruszanie**: kółko przybliża do miejsca pod kursorem. Z zewnątrz obrót jest wokół środka domu; w środku wokół tego, co jest na środku widoku. Punkt obrotu nigdy nie zostaje za kamerą.
- **Pomoc**: ikona ? w rogu.
- **Panel**: Przekrój i Pomieszczenia tylko przy otwartej kondygnacji; Światło tylko w 3D.
- **Przekrój**: płaszczyzna, która tnie model. Suwak przesuwa się o pełne kroki od 500 mm nad podłogą; ostatni krok to góra kondygnacji, gdzie cięcia nie ma. Przecięte bryły są zamknięte w kolorze przeciętego materiału, także gdy cięcie wypada dokładnie na górze bryły (nadproże okna albo drzwi).
- **2D**: obie kondygnacje obok siebie, ogród u góry. Cięcie 1500 mm nad podłogą parteru i 800 mm nad podłogą poddasza. Schody pod cięciem rysuje się linią ciągłą, nad cięciem przerywaną; z poddasza widać je całe przez otwór w stropie. Powiększenie i pobieranie SVG są w panelu.

## 5. Materiały i płytki

- Materiały to osobna biblioteka (materials.js); element podaje nazwę swojego materiału. Materiał określa też wypełnienie na rzucie 2D.
- Płytka to prawdziwy produkt ze sklepu: tekstura, wymiar, fuga i najmniejszy dopuszczalny docinek tworzą całość, a link prowadzi do tego właśnie produktu. Strona wybiera produkt, nigdy jego części.
- Układ należy do pomieszczenia: wzór, kierunek, kolor fugi, przesunięcia.

## 6. Podprojekty

- Salon prowadzi do kitchen/view.html; obie łazienki do bath/view.html.
- Kuchnia i łazienki dostosowują się do domu: ściany, strop i wysokości są domu.
- Nic z podprojektu nie trafia do house3D, dopóki nie zostanie przyjęte (proposal.md).

## 7. Kontrole (Analiza)

- Grubość elementu zgadza się z jego rodzajem.
- Żadne dwie bryły nie mają wspólnej objętości: elementy, ramy, szkło, skrzydła, dach, schody, teren.
- Każdy fragment podłogi wewnątrz ścian jest pomieszczeniem, ścianą, otworem albo ma nazwę; resztę pokazuje się jako dokładne prostokąty.
- Płytki: docinki mniejsze niż najmniejszy dopuszczalny dla produktu są czerwone i policzone.
