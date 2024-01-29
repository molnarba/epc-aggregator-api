
## Einrichtung des Suchmoduls

Je nachdem, welchen Suchanbieter wir verwenden möchten, müssen wir das Flag in der env Datei ändern:
SEARCH_PROVIDER_TO_USE=algolia (oder commercetools)

app.module.ts enthält den entsprechenden Eintrag, der dies ermöglicht:
```
const searchProvider = process.env.SEARCH_PROVIDER_TO_USE || 'commercetools';
     switch (searchProvider){
       case 'algolia':
         return [ProductsModuleAG];
       case 'commercetools':
         return [ProductsModuleCT];
       default:
         throw new Error(`Ungültiger Wert für SEARCH_PROVIDER_TO_USE : ${searchProvider}. Muss 'algolia' oder 'commercetools' sein.`);
```
Wie wir sehen können, wird der Eintrag standardmäßig auf commercetools gesetzt, wenn kein Parameter angegeben wird.

### Parameterquellen durchsuchen
Die Suchparameter stammen aus drei Hauptquellen im Frontend der Anwendung:

* **Suchleiste:** Die vom Benutzer in die Suchleiste eingegebene Eingabe.
* **Kategoriefilter:** Die ausgewählte Kategorie zum Filtern der Suchergebnisse.
* **Facettenfilter:** Die ausgewählten Facettenfilter zur Eingrenzung der Suchergebnisse.

### Suchobjektformat
Das Suchobjekt folgt einem bestimmten Format, um eine effektive Suche innerhalb der Anwendung zu ermöglichen. Der Aufbau des Suchobjekts ist wie folgt:

```
{
  "attributes": [
    {
      "name": "string",
      "values": "Array"
    }
  ],
  "categoryId": "string",
  "categoryKey": "string",
  "categorySlug": "string",
  "text": "string"
}
```
_Felder vom Objekt für Suchen_
* **attributes** (Array von Objekten): Jedes Objekt in diesem Array stellt einen vom Benutzer ausgewählten Facettenfilter dar.
* **name** (string): Bezieht sich auf den Namen der Facette.
* **values** (Array): Enthält die ausgewählten Facettenfilterwerte als Array.

### Produktliste abrufen:

Das Abrufen der Produktliste erfolgt unter Berücksichtigung der Kategorie. Wenn keine categoryId angegeben wird, kann auch die categorySlug oder der categoryKey verwendet werden. Die Kategorie filtert nicht nur die Produkte entsprechend ihrer Einordnung im Kategoriebaum, sondern bestimmt auch die zugehörigen Facetten, die wir für weitere Filterung anbieten möchten.

Werfen wir einen Blick auf einige Details zu Algolia und später auch zu Commercetools.

### Algolia

_Algolia-Client-Initialisierung:_
```
this.algoliaClient = algoliasearch(configurationService.algoliaId, configurationService.algoliaSearchKey);
```
Algoliasearch ist eine von Algolia bereitgestellte JavaScript-Bibliothek für die Interaktion mit ihrem Dienst.
`configurationService.algoliaId` ist die Algolia-Anwendungs-ID, die Ihre Algolia-Anwendung eindeutig identifiziert.
`configurationService.algoliaSearchKey` ist der Algolia Search-Only API Key, der für den sicheren Lesezugriff auf Ihre Algolia-Anwendung verwendet wird.
Der Code verwendet diese Werte, um eine Algolia-Client-Instanz, `this.algoliaClient`, zu erstellen, die zum Senden von API-Anfragen an Algolia erforderlich ist.

_Initialisierung des Algolia-Index:_
```
this.algoliaIndex = this.algoliaClient.initIndex(configurationService.algoliaIndex);
```
`configurationService.algoliaIndex` ist der Name des Algolia-Index, mit dem Sie interagieren möchten. Ein Index in Algolia stellt eine Sammlung von Daten dar, die Sie durchsuchen und abfragen möchten.
Dieser Code initialisiert einen Algolia-Index mithilfe der vom Algolia-Client bereitgestellten initIndex Methode.
Der initialisierte Index `this.algoliaIndex` kann zum Durchführen von Such- und Indizierungsvorgängen für den angegebenen Algolia-Index verwendet werden.

_Übersicht über die Algolia API-Suchfunktion_

Mit der Suchfunktion der Algolia API können Sie Ihre indizierten Daten durchsuchen und relevante Ergebnisse abrufen. Sie können die Suche mithilfe verschiedener Optionen wie Abfrage, Filter, Sortierung und Paginierung anpassen.

Hier ist eine grundlegende Übersicht über die Suchfunktion und ihre Optionen:
* **Query:** Die Suchanfrage, die definiert, wonach Sie suchen.
* **Filters:** Kriterien zum Filtern der Ergebnisse basierend auf bestimmten Attributen.
* **Sorting:** Definieren Sie die Reihenfolge, in der Ergebnisse zurückgegeben werden sollen.
* **Attributes** to Retrieve: Geben Sie die Attribute an, die Sie für jedes Ergebnis abrufen möchten.
* **Pagination:** Steuern Sie die Anzahl der Ergebnisse pro Seite und navigieren Sie durch die Ergebnismenge.

Weitere Details finden Sie in den [Algolia-API-Dokumenten](https://www.algolia.com/doc/api-client/getting-started/install/javascript/?client=javascript)

_Suchbeispiel:_
```
const query = 'search_term';
const filters = 'category:electronics';
```
// Geben Sie die Facetten an, die Sie abrufen möchten
```
const facets = ['attributes.color.key', 'attributes.size', 'attributes.designer.key'];
```
// Führen Sie die Suche durch und rufen Sie Facetten ab
```
index.search({
query,
filters,
facets
})
.then(({ hits, facets }) => {
// Handle the search results and facets
console.log('Search results:', hits);
console.log('Facets:', facets);
})
.catch(err => {
// Handle any errors
console.error('Error searching:', err);
});
```
### CommerceTools
_CommerceTools-Client-Initialisierung:_

Der CommerceTools Client wird in der `commercetools.service.ts` initialisiert – er ist nicht nur für die Suchfunktionalität zuständig.
Es wird auch zur Manipulation mit Benutzern verwendet und dies ist einer der Gründe, warum der Commercetools-Client auch dann eingeschleust wird, wenn der Algolia-Suchanbieter verwendet wird.

_CommerceTools-Indexinitialisierung:_

Suchen Sie im CommerceTools-Dashboard nach `Settings` oder `Project Settings` und klicken Sie darauf. Navigieren Sie innerhalb der Einstellungen zum Abschnitt `Search` oder `Indices`.
Konfigurieren Sie die Produktindexeinstellungen entsprechend Ihren Anforderungen. Dies kann die Angabe von zu indizierenden Feldern, Sucheinstellungen, Relevanzeinstellungen und mehr umfassen.
Um Ihre Produkte zu indizieren, gehen Sie im Hauptmenü des Merchant Centers zu `Products > Product list`. Klicken Sie auf `Index my product catalog now`.
Nach der Indizierung werden die Daten automatisch auf dem neuesten Stand gehalten.

_Übersicht über die Suchfunktionen:_

CommerceTools bietet eine robuste Suchfunktion, die es Benutzern ermöglicht, Produkt- und andere wichtige Informationen innerhalb der Plattform effizient zu suchen und abzurufen.
* **Simple search:** Sie können über die Suchleiste durch Eingabe von Schlüsselwörtern oder Produktnamen schnell relevante Produkte finden.
* **Advanced filters:** Filter wie Kategorien, Attribute oder Preisspannen helfen Benutzern, Suchergebnisse zu verfeinern.
* **Sorting:** Ergebnisse werden nach Parametern wie Relevanz, Preis oder Beliebtheit angezeigt, um die relevantesten Informationen anzuzeigen.
* **Pagination:** Benutzer können mit der Hilfe von Paginierung-Steuerelementen durch Suchergebnisse navigieren und eine bestimmte Anzahl von Ergebnissen pro Seite anzeigen.
* **Faceted search:** Es bietet Benutzern Optionen zur Verfeinerung der Ergebnisse basierend auf verschiedenen Attributen.

_Suchbeispiel:_

Die Suchanfrage von CommerceTools kann sehr umfangreich und spezifisch für das Datenmodell, die Attribute und die Konfigurationen des CommerceTools-Projekts sein.
Dies ist ein vereinfachtes Beispiel, um die Struktur einer einfachen Suchanfrage zu veranschaulichen.
```

  "filter": {
    "categories.id": {
      "in": ["category_id_1", "category_id_2"]
    },
    "variants.price.centAmount": {
      "greaterThan": 5000
    }
  },
  "facet": {
    "categories": {},
    "attributes.color": {},
    "variants.size": {}
  },
  "limit": 10,
  "offset": 0
}
```
* **filter** gibt die Filterkriterien für die Suche an.
* **facet** definiert die Facetten, die Sie zusammen mit den Suchergebnissen abrufen möchten. In diesem Fall erfolgt die Facettierung nach Kategorien, Farben und Größen.
* **limit** begrenzt die Anzahl der zurückzugebenden Ergebnisse (z. B. 10 Produkte).
* **offset** gibt die Startposition für die Ergebnisse an und ermöglicht so eine Paginierung.

### Facettenkonfiguration:

Die Facettenkonfiguration erfolgt basierend auf einer Yaml-Datei im Facettenkonfigurationsdienst.

`facet-configuration.yaml`

Hier haben wir zwei Haupteinträge zu Facetten: `facets_by_category` und `facet_settings`. Nachfolgend finden Sie Beispiele:
```
facets_by_category:
   root:
    - color
    - designer
    - size
  # New
  c1:
    - color
    - designer
    - size
  # Women
  c2:
    - color
    - designer
    - size
  # Men
  c3:
    - color
    - designer
    - size
```
Die Beschreibung einer konkreten Facette sieht wie folgt aus:
```
facet_settings:
   color:
    enabled: 'true'
    facet_options:
      filter: 'variants.attributes.color.key'
      value_comparator: 'alphaNumComparator'
      value_comparator_order: 'asc'
    display_options:
      input_element: 'checkbox'
      show_facet_count: 'true'
```

Diese werden aufgrund einiger deutlicher Unterschiede individuell für die Facetten von Algolia und Commercetools konfiguriert. AKA, der Filterschlüssel im Fall von Algolia ist 'attributes.color.key' ohne das Variantenpräfix.
Die Algolia-Suchmethode akzeptiert nur die korrekt vordefinierten Schlüsselsuchwerte, die in ihrer Benutzeroberfläche verfügbar sind. Sehen Sie sich die Einrichtung dieser unten an.

Im FacetConfigurationService lesen wir die Datei:
```
const fileContents: string = readFileSync(this.configurationService.facetConfigurationYamlFile, 'utf8');
```
Danach arbeiten wir programmgesteuert mit den Dateiinhalten.

**Algolia-Facettenkonfiguration:**

Um Algolia-Facetten durchsuchbar zu machen, müssen wir sie wie folgt in der Algolia-Benutzeroberfläche einrichten:
Im Algolia-Dashboard:
1. Gehen Sie zu 'Search' und wählen Sie den Index aus, der für unsere Anwendung definiert ist
2. Wählen Sie neben der Registerkarte 'Browse' die Option 'Configuration'.
3. Scrollen Sie nach unten zu 'FILTERING AND FACETING' und wählen Sie Facetten
4. Klicken Sie auf 'Add an Attribut' und wählen Sie die Facette aus, nach der wir suchen möchten
5. Neben der hinzugefügten Facette wird ein Dropdown-Menü mit Suchbeschränkungen angezeigt. Stellen Sie es auf 'searchable' ein.
6. Klicken Sie unten rechts auf 'Review and Save Settings' und dann auf 'Save'.
