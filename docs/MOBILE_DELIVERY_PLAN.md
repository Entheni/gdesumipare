# Mobile Delivery Plan

## Cilj
Web ostaje glavni proizvod. Mobilna aplikacija ide paralelno, za korisnike koji vise vole telefon nego browser.

## Pravac
Ne radimo rewrite. Postojeci Vue frontend ostaje osnova, a mobilne aplikacije se uvode preko `Capacitor`-a.

## Faza 1: Web spreman za mobilni wrapper
- dodatno ciscenje navigacije za uske ekrane
- pregled svih kljucnih strana na telefonu
- izdvajanje API konfiguracije za web i mobile build
- proveriti login/session flow posle app resume-a

## Faza 2: iOS i Android shell
- uvesti `Capacitor` u `frontend`
- generisati iOS i Android projekte
- povezati app ikonice, splash i osnovne native postavke
- proveriti rad prijave, odjave i cuvanja sesije
- dodati lokalne notifikacije za podsetnike

## Faza 3: Distribucija
- App Store i Google Play listing asseti
- privacy policy i support URL
- release checklist
- build pipeline za test i release buildove

## Procena
- PWA polish: 2-4 dana
- Capacitor MVP: 1-2 nedelje
- push/lokalne notifikacije i store spremnost: dodatnih 1-2 nedelje

## Napomena
Web i mobilna aplikacija dele istu poslovnu logiku i API. Korisnik bira kanal koji mu vise odgovara, a proizvod ostaje jedan.
