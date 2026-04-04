# Mobile Delivery Plan

## Status
- web aplikacija ostaje glavni proizvod
- Capacitor scaffold je uveden u `frontend/`
- iOS projekat postoji u `frontend/ios/`
- Android projekat postoji u `frontend/android/`
- `npm run mobile:sync` sada osvezava native projekte iz aktuelnog web build-a

## Cilj
Web ostaje glavni proizvod. Mobilna aplikacija ide paralelno, za korisnike koji vise vole telefon nego browser.

## Pravac
Ne radimo rewrite. Postojeci Vue frontend ostaje osnova, a mobilne aplikacije se uvode preko `Capacitor`-a.

## Pravilo za dalje feature-e
Svaki novi feature od ovog trenutka mora da se dizajnira i proveri kroz 3 kanala:
- web browser
- Android aplikacija
- iOS aplikacija

To ne znaci da svaki feature mora odmah imati native-only implementaciju, ali mora imati:
- ispravan responsive UI
- ispravan API tok u web i mobile shell-u
- proveru da navigacija, forma i auth/session ponasanje ne pucaju na telefonu

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