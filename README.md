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

De plek is overgenomen uit een op Google Maps aangetekende rechthoek. Die is op de luchtfoto vastgepind door de
OpenStreetMap-omtrek van het Poortgebouw over de schermafbeelding te leggen (schaalbalk 112 px = 10 m); midden van
de rechthoek op 5,4 m oost / 23,8 m noord van de ingang van Tolhuisweg 2, wat overeenkomt met
`siteE 0.2 · siteN 19.9 · siteRot 37` (positie van de voorgevel).

Omgeving uit open data:

- luchtfoto: PDOK Luchtfoto Actueel Ortho 25 cm (`ground.jpg`, 200 × 200 m) en 8 cm (`ground-hr.jpg`, 100 × 100 m), CC BY 4.0 Beeldmateriaal Nederland;
- gebouwomtrekken en hoogtes: OpenStreetMap (ODbL), `site.json`;
- bomen: gemeente Amsterdam, dataset Bomen (stamgegevens, soort en hoogteklasse) aangevuld met OpenStreetMap.

Coördinaten in `site.json` zijn meters oost/noord vanaf de ingang van Tolhuisweg 2 (OSM-node 2627538185, 52.38411 N 4.90573 E).

De vier moeraseiken staan in geen enkel bestand: het bomenbestand van de gemeente kent binnen 400 m geen enkele
Quercus palustris, dus ze staan op particulier terrein. Hun plaats in het model is van de winterluchtfoto afgelezen
(bladerloos, kronen apart zichtbaar) en dus een benadering; ze zijn versleepbaar, het handigst in het bovenaanzicht.
