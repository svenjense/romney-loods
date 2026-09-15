# Romneyloods 6 × 13 m – 3D indeling

Interactief 3D-model (Three.js, één pagina, geen build) om indelingen van een romneyloods uit te proberen:
panelen aan de wanden hangen (mycelium, bamboe, CLT), meubels op de vloer schuiven, de takelplaat aan de voorkant
open en dicht, en een verwarmd kantoortje aan de voorkant.

Open `index.html` via een webserver (of de GitHub Pages-versie). Indelingen worden in de browser bewaard;
"Deel-link" zet de hele indeling in de URL.

## Locatie

De loods staat op het terrein **noordwest van het Poortgebouw** (Tolhuisweg 2, Amsterdam-Noord), met de lange as
in lijn met het gebouw (53,5°, dezelfde richting als de gevel). Voorgevel met takelplaat naar het zuidwesten,
richting het Poortgebouw en de oprit.

De plek komt uit een op Google Maps aangetekende rechthoek, daarna met de hand bijgeschoven. Die aantekening is op
de luchtfoto vastgepind door de OpenStreetMap-omtrek van het Poortgebouw over de schermafbeelding te leggen
(schaalbalk 112 px = 10 m). Huidige stand: `siteE -3.5 · siteN 23.5 · siteRot 34`, dat is de voorgevel; het midden
van de loods ligt daarmee op 1,9 m oost / 27,1 m noord van de ingang van Tolhuisweg 2.

De camera blijft op de loods gericht: verschuif of draai je hem met de sliders, dan schuift het draaipunt van de
camera mee, zodat hij niet uit beeld loopt.

Omgeving uit open data:

- luchtfoto: PDOK Luchtfoto Actueel Ortho 25 cm (`ground.jpg`, 200 × 200 m) en 8 cm (`ground-hr.jpg`, 100 × 100 m), CC BY 4.0 Beeldmateriaal Nederland;
- gebouwomtrekken en hoogtes: OpenStreetMap (ODbL), `site.json`;
- bomen: gemeente Amsterdam, dataset Bomen (stamgegevens, soort en hoogteklasse) aangevuld met OpenStreetMap.

Coördinaten in `site.json` zijn meters oost/noord vanaf de ingang van Tolhuisweg 2 (OSM-node 2627538185, 52.38411 N 4.90573 E).

De vier moeraseiken staan in geen enkel bestand: het bomenbestand van de gemeente kent binnen 400 m geen enkele
Quercus palustris, dus ze staan op particulier terrein. Ze staan op de rij bomen langs het water: vier
posities uit het bomenbestand zelf, op 25,3 / 30,4 / 35,4 / 40,4 m noord, hart op hart 8,0 tot 9,1 m, en alle vier
op ongeveer 23 m van de hartlijn van het Buiksloterkanaal, dus evenwijdig aan de oever. Een geregistreerde boom die
binnen 4,5 m van een moeraseik valt wordt niet dubbel getekend. Ze blijven versleepbaar.

De eerdere poging plaatste ze dichter bij de loods, uit een schermafbeelding waarop de kruinen met witte stippen
waren aangewezen: de camera van dat beeld is teruggerekend uit zes bekende punten (twee gebouwlabels, vier
boomlabels, restfout 0,7 px) en de stippen zijn teruggeprojecteerd op de hoogte van het kruinmidden. Dat leverde
dezelfde rijrichting op, maar 7 tot 8 m te dicht bij de loods.

`params.v` in de opgeslagen indeling merkt opslag uit een oudere versie: staat die op een ouder nummer, dan nemen
de plaats van de loods en de vier eiken de nieuwe waarden over. Zonder dat blijft een browser de oude posities
tonen, want opgeslagen waarden gaan voor op de standaardwaarden.
