## Beschreibung

[siehe Wiki](https://confluence.ecube.de/display/EST/Aggregator+Backend)

## Installation

Die Anwendung setzt Node v14+ und npm v16+ voraus. Zur Installation in den Root-Ordner wechseln und folgende Befehle ausführen:

```bash
// Abhängigkeiten installieren
$ npm install

// GraphQL Types generieren
$ npm run generate:aggregator
```

## Projektstruktur

Im Root-Ordner finden sich einige Dateien, die zum Initialisieren/Bauen des Projekts nötig sind:

```
development.env             -> Konfiguration des Aggregator-Backend bei lokaler Ausführung
docker-compose.yml          -> Docker-Compose um das Aggregator-Backend bei Bedarf (z.B. Fehlersuche) lokal in einem Docker Container zu betreiben
Dockerfile                  -> Docker Konfiguration um in der CI/CD Pipeline das Docker Image für das Aggregator-Backend zu bauen
.gitlab-ci.yml              -> Gitlab Build Pipeline Konfiguration
tsconfig.json               -> Typescript Compiler Konfiguration
tsconfig.build.json         -> Erweiterung der Konfiguration für den build Job
package.json                -> npm Dependencies, Task Definition und Prettier Konfiguration
package-lock.json           -> Beschreibt, welche Versionen der Dependencies tatsächlich geladen werden sollen
```

Im Ordner src/ befinde sich der Quellcode, verteilt auf Module. Jedes Modul besteht mindestens aus den folgenden Dateien:

```
## Konfiguration
*.module.ts                 -> Beschreibt Abhängigkeiten zu anderen Modulen und welche Klassen per DI zur Verfügung stehen / exportiert werden
schema.graphql              -> Enthält GraphQL Typen und Queries/Mutations, die dieses Modul verwaltet (siehe #GraphQL)
./inner
   .../resolver             -> GraphQL Resolver für Queries/Mutations, die dieses Modul unterstützt
   .../ports                -> Interfaces, die den Adapter Richtung Backend beschreiben
./outer
   .../adapter              -> Enthält konkrete Implementierung der Backend-Abfragen
   .../mapper               -> Umwandlung/Übersetzung der Backend-Responses
```

Module müssen im Hauptmodul "app.module.ts" importiert werden, damit sie per DI geladen werden und in der Anwendung verfügbar sind. Mehr dazu siehe: https://docs.nestjs.com/modules

In dieser Anwendung gibt es ein einziges globales Modul - "SharedModule". Dieses muss nur einmal registriert/importiert werden, dann steht es auch für alle anderen Module zur Verfügung.

Im SharedModule finden sich Interceptors, Logger und Basisklassen für die Kommunikation mit externen Services.

## Konfiguration

Dieser Service kann auf zwei Arten konfiguriert werden.
Über Umgebungsvariablen und .env-Dateien.

### Nutzung der development.env Datei

Für die Entwicklung und zu demozwecken muss im Hauptverzeichnis (parallel zu dieser Readme) eine Datei namens development.env angelegt werden.
Der Inhalt kann aus folgendem Code-Snippet kopiert werden.

```
COMMERCETOOLS_PROJECT_KEY='ecube-template-test'
COMMERCETOOLS_CLIENT_ID='5anYTdI38oBNc4_Nm5IrHqSI'
COMMERCETOOLS_CLIENT_SECRET='lj0q8YMw1OcyoiP2L0re8JnZpauct0vg'

CONTENTFUL_SPACE_ID='wz0qhhnughp9'
CONTENTFUL_ENVIRONMENT='master'
CONTENTFUL_MANAGEMENT_API_TOKEN='CFPAT-0GpNWiinmSTCv-_87YmgbKMmmWPE0KuDTkYAQl6I9PU'
CONTENTFUL_CONTENT_DELIVERY_API_TOKEN='Ztp1PYhDZnbleKnjY6fV3qigI6t3r9h0PWMyhwrlTSo'

STORYBLOK_ACCESS_TOKEN="4aqfIPzeJfHGc3Pe9W9nfwtt"

TELEGRAF_HOST='192.168.194.206'
TELEGRAF_PORT=8125

PRICE_SERVICE_API_URL='http://192.168.194.206:8080/graphql'
```

Das Vorhandensein dieser Variablen wird beim Servicestart überprüft.
Fehlende Werte werden auf der Console ausgegeben.
Sollte diese Readme also einmal nicht vollständig sein, lassen sich fehlende Schlüssel aus der Meldung herleiten.

### Neue Umgebungsvariablen hinzufügen

Werden neue Umgebungsvariablen benötigt, so sollten zunächst in der Datei `src/outer/configuration/configuration-validation.ts` die Validierungsregeln ergänzt werden.
Anschließend ist der Schlüssel im `src/outer/configuration/configuration.service.ts` aufzunehmen und kann an entsprechender Stelle verwendet werden.

Werden Konfigurationsparameter bereits bei der Dependency-Injection benötigt, hilft ggf. folgende [Information](https://github.com/nestjs/nest/issues/530#issuecomment-415690676)

## Starten der App

Es gibt verschiedene Wege die Anwendung lokal zu starten:

```bash
# Using watch mode (recommended)
$ nest start -w
# or
$ npm run start:dev
```

Für den Start im 'Production'-Modus:

```
$ npm run start:prod
```

ACHTUNG: Falls im Source-Code *.js Dateien inkludiert werden sollen, muss die tsconfig.json angepasst werden:

```
  "allowJS": true
```

## Bauen der App

Um die Anwendung zu packen:

```
$ npm run build
```

Das Ergebnis findet sich unter ./dist

## Test

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```

## GraphQL

Die API wird grundsätzlich per GraphQL bereitgestellt. Lokal wird automatisch immer ein Playground/eine lebende Dokumentation zum ausprobieren bereitgestellt unter

```
http://localhost:3000/graphql
```

Jedes Anwendungsmodul pflegt sein eigenes Schema in einer schema.graphql Datei. In dieser werden sowohl Modell-Klassen als auch Queries/Mutations beschrieben.
Beim Anwendungsstart wird nach *.graphql Dateien gescannt und ein gemeinsames Schema gebaut (siehe app.module.ts).

Um im Code einfach mit den Modell-Klassen des Schemas arbeiten zu können, muss bei jeder Änderung der eine Neu-Generierung der Typescript Dateien erfolgen:

```
$ npm run generate:aggregator
```

Die Ausgabe erfolgt in der Datei types.generated.ts, jeweils direkt neben der Schema-Datei des Moduls.

## Logging

Die Anwendung benutzt [Pino](http://getpino.io/#/), ein sehr performanter Node.JS Logger. Log Statements sind dadurch standardmäßig in JSON formatiert und können sehr einfach an ein zentrales Logging-Tool (z.B. Graylog) gesendet werden.
Siehe dazu das Command im Dockerfile: dort werden per [gelf-transformer](https://github.com/makeros/gelf-transformer) die JSON Statements auf stdout transformiert und an Graylog gesendet.

Initializiert wird der Logger im globalen SharedModule. Dort können auch Settings vorgenommen werden für:

* allgemeines LogLevel
* AutoLogging von Requests
* Logging für bestimmte API Endpunkte abschalten

Um den Logger in einer Klasse injecten zu lassen, muss folgende Syntax im Konstruktor verwendet werden:

```
constructor(@Inject(LOGGER_PROVIDER) private readonly logger: LoggerFacade) {
  this.logger.setContext(myClass.name);
}
```

Wenn man einen eigenen Logger einhängen möchte, dann muss dieser das Interface "LoggerFacade" implementieren und der LOGGER_PROVIDER eine neue Instanz der Klasse zurückgeben (siehe crosscutting/interface-provider-config.ts)~~~~

## Contentful

Das aggregator-backend ist für das Content-Model in Contenful verantwortlich und liefert dieses aus.
Verfügbare Typen und Felder können in der Datei
`src/outer/contentful/management/contentful-type.definitions.ts`
definiert werden.
Die Datei enthält entsprechende Hinweise für die Versionierung und das Anlegen neuer Typen.


## Docker Images bauen (push)

* Link zur Container Registry des [shop-template](https://gitlab.com/${GITLAB_PROJECT_NAMESPACE}) Projekts in der [ecube-intern](https://gitlab.com/ecube.de/ecube-intern) Gruppe: [https://gitlab.com/groups/${GITLAB_PROJECT_NAMESPACE}/-/container_registries](https://gitlab.com/groups/${GITLAB_PROJECT_NAMESPACE}/-/container_registries)
* Aufruf zur Anmeldung an der gitlab Container Registry mittels [docker login](https://docs.docker.com/engine/reference/commandline/login/):

  ```bash
  echo '<your gitlab password>' | docker login registry.gitlab.com -u <your gitlab username> --password-stdin
  ```


  **NB: wichtig ist daß das Passwort über die Standardeingabe STDIN an das `docker login` Kommando übergeben wird.
  Das verhindert daß das Passwort mit in die Shell-History oder Logs wandert!**
* Aufruf um das Docker Image zu bauen:

  ```bash
  make service-build
  ```
* Aufruf um das Docker Image zu starten, anschliessend [http://localhost:3000/categories](http://localhost:3000/categories) öffnen:

  ```bash
  make service-up
  ```
* Aufruf um das Docker Image zu stoppen:

  ```bash
  make service-down
  ```
* Aufruf um das Docker Image in die Container Registry zu pushen:

  ```bash
  docker-compose push
  ```

## Docker Images verwenden (pull)

* Diesen Anweisungen folgen um in [gitlab](https://gitlab.com/) ein Access Token mit "read_repository" Scope anzulegen: [Gitlab Docs: Personal access tokens](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
* Aufruf zur Anmeldung an der gitlab Container Registry mittels [docker login](https://docs.docker.com/engine/reference/commandline/login/):
  ```bash
  echo '<your gitlab access token>' | docker login registry.gitlab.com -u <your gitlab username> --password-stdin
  ```
  **NB: wichtig ist daß das Passwort über die Standardeingabe STDIN an das `docker login` Kommando übergeben wird.
  Das verhindert daß das Passwort mit in die Shell-History oder Logs wandert!**
