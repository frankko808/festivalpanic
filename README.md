# Festival Panic

Festival Panic ist ein humorvolles Top-down-Pixel-RPG für den Browser.

**[Jetzt im Browser spielen](https://frankko808.github.io/festivalpanic/)**

## Aktueller Vertical Slice

Der aktuelle Vertical Slice enthält:

- Boot- und Preload-Szene
- animiertes, verspieltes Titelbild und erweiterte Charakterauswahl
- 44.100 kombinierbare Looks aus Hauttönen, Frisuren, Haarfarben, Oberteilen, Beinkleidern und Accessoires
- animierte Titelszene mit Wolken, Konfetti, Ballons, Bühnenlichtern und tanzender Menge
- tile-basierte Testwelt mit Vier-Richtungs-Bewegung
- belebter Marktplatz mit Bäckerei, Blumenladen, Marktstand und zahlreichen Kleingegenständen
- Kamera, Weltgrenzen und Kollisionen
- Rudi als sichtbaren NPC mit Nähe-Interaktion und anschließender Begleiterfunktion
- Y-basierte Tiefensortierung und Hindernis-Ausweichziel für Rudi
- datengetriebene Dialogbox mit Maus- und Tastatursteuerung
- die vollständige erste Begegnung mit Rudi samt drei Antwortpfaden
- das anschließende Auftreten und vollständige Erstgespräch der Bürgermeisterin
- Sitzverteilungs-Overlay und Start der Hauptquest
- Mia, Herr Brömmel, Nora und Herr Centner mit allen Erstgesprächen aus dem GDD
- Noras sichtbare Dialogwahl zwischen Becher, Pizzakarton und Mülleimer
- Questfortschritt, Punkte und vier freischaltbare Argumentkarten
- Rudis Zusammenfassung und Freischaltung des Mehrheitsblicks aus Szene 8
- Planungspult mit fünf Festivalmodulen, Live-Kosten und Zustimmungsprognose
- echter Startkonflikt aus Kosten und Bedingungen: Kein Erstentwurf erreicht vor einer Verhandlung sieben Stimmen
- Speichern des ersten Entwurfs, Rudis Ergebnis-Kommentar und drei Gesprächsmarken
- Ausbau-Slice mit 2x Renderauflösung, vergrößertem Marktplatz und östlichem Stadtbezirk
- betretbare Außenkarten: Stadtpark, Kulturkai und Rathaus-Erdgeschoss
- zwei erzählerisch passende Gruppenaufträge mit Punkten: Park aufräumen für Nora und Marktbelege für Centner
- räumlich verteilte Gruppen: Mia am Kulturkai, Nora im Stadtpark, Centner im Rathaus und Brömmel im Wohnviertel
- mehrstufige Gesprächseinstiege mit konkreten Alltagssituationen vor Forderungen und Aufgaben
- zusätzliche Stadt-NPCs, Stadtbrunnen, Wegportale und bewachter Zugang zum Abstimmungssaal
- vollständig illustriertes Pixelstadt-Titelbild mit echten Häuserfassaden, Rathaus und Marktplatz
- optionale Nebenmissionen: Picknickkorb, vermisste Katze und drei Glücksmünzen
- spielbares Drei-Akkorde-Rhythmus-Minispiel am Kulturkai
- vorbereiteter, betretbarer Abstimmungssaal nach vier gesammelten Argumenten
- laufende Highscore-Aktualisierung in `localStorage`
- vollständige Drei-Verhandlungen-Phase mit vier Argumentkarten und allen 16 Gruppenkombinationen
- regelwirksame Kompromisse, neue Newcomer-Bühne und zwei Kostenvergünstigungen
- finales Planungspult mit Mehrheitswarnung und bewusster Trotzdem-Abstimmung
- gruppenweise Ratsabstimmung, letzter Änderungsantrag und Demokratie-Rettungsring
- begehbares Nachtfestival mit planabhängiger Bühnenzahl, großer animierter Menge und zustandsabhängigen Gruppendialogen
- Festival-Minispiele Pommes-Rush, Dosenwerfen und Finde Rudi mit Bestwert- und Punktewertung
- Spielzeit neben dem Punktestand; eigene Zeitlimits in allen Festival-Minispielen und im Drei-Akkorde-Rhythmusspiel
- freischaltbare Erfolge, darunter „Peter Zwegert“, Einstimmigkeit und „Waschbär-Radar“, mit Eintrag im Journal
- sachliches, mehrstufiges Abschlussgespräch mit der Bürgermeisterin über Beteiligung, Budget und Kompromisse
- bebilderter Rückblick auf vier Schlüsselmomente vor der Ergebnistafel
- Festival-Ergebnisbildschirm mit Punktestand, Rang, Planübersicht, Minigame-Punkten und lokalem Highscore
- Ingame-Journal mit Gegenständen, Aufgaben und politischen Erkenntnissen
- automatischer Fortsetzen-Spielstand für einen laufenden Durchgang; letzter sicherer Kartenort und Fortschritt bleiben nach einem Neuladen erhalten
- zurückhaltende, eigens erzeugte Musik und Bedienklänge mit dauerhafter Stummschaltung

Der Hauptpfad ist jetzt bis zum beschlossenen oder per Rettungsring geretteten Sommerfest einschließlich freiem Festivalabschnitt und Auswertung spielbar.

## Lokaler Start

Voraussetzungen: Node.js, npm und Git.

```bash
npm install
npm run dev
```

Danach die von Vite ausgegebene lokale Adresse öffnen, standardmäßig `http://127.0.0.1:5173`.

Ein vorhandener Durchgang erscheint auf dem Titelbildschirm als „Spiel fortsetzen“. „Neues Spiel“ fragt vor dem Ersetzen dieses Durchgangs nach; Highscore und Erfolge bleiben erhalten. Gespeichert wird lokal im jeweiligen Browser und nur für dessen Webadresse, nicht geräteübergreifend.

## Direkte Test-Speicherstände

Für lokale Entwicklungstests ohne vollständigen Durchlauf gibt es URL-basierte Checkpoints, zum Beispiel `http://127.0.0.1:5173/?checkpoint=festival-large`. Sie verändern den regulären Highscore nicht.

## Steuerung

- Bewegung: Pfeiltasten oder WASD
- Turbo-Slide: Q; etwa zwei Schritte. Dieselbe Achse hat 950 ms Cooldown, ein Wechsel zwischen waagerecht und senkrecht erlaubt sofort den nächsten Sprint.
- Interaktion und Dialog weiter: E, Leertaste oder Enter
- Antwort wählen: 1, 2, 3 oder per Mausklick
- Noras Antworten: 1, 2, 3 oder per Mausklick wie bei allen Dialogwahlen
- Planungspult: Pfeiltasten oder Pfeilflächen; E/Enter beziehungsweise Button zum Speichern
- Charakterauswahl: Pfeilflächen oder „Überrasch mich“ für einen Zufalls-Look
- Journal öffnen/schließen: M
- Journal-Register: 1 Gegenstände, 2 Aufgaben, 3 Erkenntnisse; Seiten mit Pfeil hoch/runter
- Ton an/aus: V (wird lokal gespeichert)
- Finde Rudi: eine von 15 Figuren anklicken oder mit Pfeilen/WASD auswählen und mit E/Enter bestätigen

## Qualitätssicherung

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

`npm run preview` zeigt den fertigen Produktionsbuild lokal an. Debug-Direktlinks und die optionale FPS-Anzeige funktionieren nur im Entwicklungsserver, nicht im Produktionsbuild.

## Struktur

- `src/scenes`: Phaser-Szenen und Ablauf
- `src/characters`: Spielfigur und NPCs
- `src/dialogue`: allgemeines, datengetriebenes Dialogmodell
- `src/systems`: Interaktions- und weitere Spiellogik
- `src/state`: zentraler Laufzeit-State und localStorage-Zugriff
- `src/ui`: Dialogbox und HUD
- `src/data`: GDD-basierte Inhalte und zentrale Festivalregeln
- `src/minigames`: reservierter Modulbereich für spätere GDD-Phasen
- `src/utils`: generierte Pixel-Art und Hilfen
