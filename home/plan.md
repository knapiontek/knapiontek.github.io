# Plan: jeden dom, wnętrza z danych

> Plan przebudowy, uzgodniony 2026-11-16. Robimy go krok po kroku. Każdy krok kończy się testami i zatwierdzeniem właściciela, dopiero wtedy następny.

## 1. Co chcemy osiągnąć

### Zasada

Wszystko zaczyna się od domu. Jest jedna strona, **home**. Pokazuje albo cały dom ze wszystkim, albo wybraną część: jedno pomieszczenie albo grupę pomieszczeń, np. kuchnię czy garderoby. Home buduje dom, wycina wybraną część i **przekazuje jej dane w dół**. Nic niżej nie woła domu z powrotem, więc zależności idą tylko w jedną stronę, jak drzewo.

### Jak to ma wyglądać

```
house/        home: strona, dane domu, model domu; wybiera część domu i przekazuje ją w dół
  │
  ▼
interior/     cały kod wnętrz: składa pomieszczenie z tego, co dostał (pomieszczenie + dane projektu)
  ├─ cabinets.js   szafki: korpusy, fronty, szuflady, cokoły, blaty, panele (dawny model.js kuchni)
  ├─ products.js   produkty z biblioteki w pomieszczeniu: AGD, zlew, armatura, kabina, lustro, lampy
  ├─ tiles.js      płytki na ścianach i podłodze
  ├─ room.js       składa szafki, produkty i płytki w jedno pomieszczenie
  ├─ info.js       kosztorys, lista cięć, karty montażu
  └─ index.html    edytor projektu (dawny design.html): tabele, widoki ścian z szafkami
  │
  ▼
core/, library/   rysowanie, geometria, interfejs; produkty, materiały, tekstury

rooms/kitchen/    tylko dane i opisy: kitchen.dat.js, scene.dat.js, estimate.dat.js, project.md, rules.md
rooms/bathroom/   tylko dane i opisy
rooms/wardrobe/   tylko dane i opisy
```

### Co z tego wynika

- **Jedna strona** zamiast czterech: kuchnia, łazienki i garderoby to home z wybraną częścią. Tryby 3D, 2D, Info i Test działają tak samo dla całego domu i dla części.
- **Foldery pomieszczeń trzymają tylko dane i opisy.** Kodu w nich nie ma. Nowe pomieszczenie to nowe pliki .dat.js, a nie nowy kod.
- **interior/ nie zna żadnego konkretnego pomieszczenia.** Żadna nazwa, liczba ani ścieżka kuchni czy garderoby nie siedzi w kodzie. Wszystko przychodzi w danych.
- **cabinets.js robi tylko szafki.** Korpus budowany na podstawie frontów, bez lamp, produktów i płytek.
- **Lampy i produkty:** co to jest (wymiary, wygląd, światło, cena) mówi biblioteka. Gdzie stoi mówią dane pomieszczenia. Jak to narysować i policzyć robi products.js.
- **Edytor** zostaje osobną stroną. Pracuje tylko na danych szafek, więc dom mu niepotrzebny: edytor → cabinets.js → core.
- **Interfejsy room.js i shell.js przestają być potrzebne** jako wtyczki: nie ma rejestracji ani sprawdzania implementacji. Zostaje tylko opis danych, które home przekazuje w dół (pomieszczenie: ściany, sufit, skos, drzwi, okna), zapisany w interior/project.md.
- **Duplikaty z raportu znikają same:** drzwi i szuflady, chowanie ścian, rzut pomieszczenia i sprawdzanie interfejsów będą w jednym miejscu.

### Zasady przebudowy

- Każdy krok najpierw przenosi, potem upraszcza. To, co już działa, ma po kroku wyglądać i liczyć się tak samo: ten sam rzut, Info i Test, sprawdzone testami z test.md przed i po.
- Pliki przenosimy przez `git mv` (polecenia daje LLM, wykonuje właściciel), żeby została historia.
- Opisy (project.md w każdym folderze, root project.md, test.md) są aktualizowane w tym samym kroku co kod.
- Home rośnie, więc dzielimy go na moduły w house/, żeby nie powstał jeden ogromny plik.

## 2. Lista do zrobienia

### Krok 1: home pokazuje część domu

- [ ] `?room=…` (numer albo kilka numerów) rysuje tylko wybrane pomieszczenia: ich ściany, podłogę, sufit, dach, okna i drzwi.
- [ ] Ściana albo sufit, za którymi stoi kamera, chowa się, jak dziś na stronach łazienek i garderób.
- [ ] Kamery i rzut 2D dopasowują się do wybranej części; Info i Test liczą tylko ją.
- [ ] Na razie bez mebli; cały dom (bez `?room`) bez zmian.
- [ ] Menu u góry (Dom, Kuchnia, Łazienki, Garderoby) prowadzi do home z wybraną częścią.

Gotowe, gdy: dom wygląda i liczy się jak dziś, a `?room=` pokazuje pomieszczenie jak strony podprojektów, tylko jeszcze puste.

### Krok 2: kuchnia przechodzi do interior/

- [ ] `git mv` kodu kuchni do interior/: design.html → index.html, model.js → cabinets.js, room.js, info.js; strona kuchni (index.html) zostaje rozebrana na części dla home.
- [ ] Home woła interior/room.js dla pomieszczeń, które mają dane wnętrza, i podaje mu pomieszczenie oraz dane projektu.
- [ ] Z kodu znikają ścieżki i nazwy kuchni (tytuły, nazwa pliku XLSX, kamery przychodzą z danych).
- [ ] Edytor otwiera projekt z adresu: `interior/index.html?project=kitchen`.
- [ ] W rooms/kitchen zostają tylko kitchen.dat.js, scene.dat.js, estimate.dat.js, project.md i rules.md.

Gotowe, gdy: kuchnia w home (3D, 2D, Info, Test) i w edytorze jest taka sama jak dziś; dom bez zmian.

### Krok 3: łazienki przechodzą do interior/

- [ ] Płytki łazienek do tiles.js, produkty (WC, umywalka, kabina, baterie, lustro, lampy) do products.js, szafka pod umywalkę do cabinets.js jako zwykła szafka z danych.
- [ ] Produkty i lampy kuchni (AGD, zlew, okap, oświetlenie) też trafiają do products.js, a płytki kuchni do tiles.js.
- [ ] Strona łazienek znika; w rooms/bathroom zostają tylko dane i opisy.

Gotowe, gdy: łazienki i kuchnia w home wyglądają i liczą się jak dziś (płytki, kosztorys, Test).

### Krok 4: garderoby przechodzą do interior/

- [ ] cabinets.js uczy się tego, czego garderobom brakuje:
  - półek otwartych (bez frontu, na siatce wysokości wspólnej dla sąsiednich korpusów);
  - szuflad bez frontu na prowadnicach kulkowych;
  - głębokości korpusu dla każdego ciągu osobno.
- [ ] wardrobe.dat.js w formacie szafek kuchni (ciągi, korpusy, szuflady, półki; w pokoju 6 fronty z dębu); obok scene.dat.js (który ciąg przy której ścianie) i estimate.dat.js.
- [ ] Edytor otwiera garderoby: `interior/index.html?project=wardrobe`.
- [ ] Strona i kod garderób znikają; zostają dane i opisy.

Gotowe, gdy: garderoby wyglądają jak dziś (te same korpusy, szuflady, półki, fronty), Test bez błędów, kuchnia bez zmian.

### Krok 5: sprzątanie

- [ ] Usunąć interfejsy room.js i shell.js oraz ich sprawdzanie; opis danych pomieszczenia w interior/project.md.
- [ ] apps.dat.js: zamiast stron podprojektów lista części domu do menu.
- [ ] Root project.md (foldery, zależności, nazwy plików, To do), test.md, project.svg.
- [ ] Usunąć report.md i plan.md, gdy wszystko z nich jest zrobione albo przeniesione do To do.

### Na później (poza tym planem)

- Płytki domu i płytki łazienek jednym mechanizmem (tiles.js) zamiast dwóch.
- Porządki MD z raportu (house/rules.md, core/rules.md, wstawki o aplikacji w kitchen/rules.md), o ile nie zrobią się po drodze.
- Pozostałe punkty To do z project.md (kolizje kuchni, szerszy widok na spacerze, produkty drzwi).
