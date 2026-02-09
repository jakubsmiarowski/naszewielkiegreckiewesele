# Produktyzacja projektu - stan obecny i kierunki rozwoju

## Cel dokumentu
Ten dokument zbiera:
- funkcjonalności, które już działają w aplikacji,
- propozycje kolejnych kroków, które pomogą przejść od projektu eventowego do bardziej "produktowego" rozwiązania.

## Co już jest zaimplementowane

### 1. Dostęp i logowanie
- Logowanie gościa przez link z QR (`/auth/verify?token=...`) z walidacją tokenu i przekierowaniem do dashboardu.
- Logowanie alternatywne przez krótki kod PIN (`/api/invitations/login`).
- Sesja oparta o cookie HTTP-only (`crux`) z długim czasem życia (90 dni).
- Oznaczanie zaproszenia jako "wyświetlone" po wejściu przez QR (`isViewed`).
- Osobna ścieżka dla organizatorów przez Google login (`better-auth`) + allowlista emaili adminów.

### 2. Model danych (Convex)
- Zaproszenia jako główny byt (token QR, PIN, RSVP, transport, +1, przylot, wiadomość, statusy).
- Goście przypięci do zaproszeń (1 zaproszenie -> wielu gości).
- Ustawienia terminów RSVP i Car Pool.
- Moduł Car Pool (oferty przejazdu, zgłoszenia pasażerów, statusy, mediacje).
- Moduł Q&A (pytania od gości, odpowiedzi admina, status pending/answered).

### 3. Dashboard gościa
- Zakładki: `RSVP`, `Car Pool`, `Plan zabawy`, `Logistyka`, `Atrakcje`, `Q&A`.
- Sekcja informacyjna: plan wydarzenia, logistyka, mapa, atrakcje, FAQ.
- Liczniki czasu (do wydarzenia i do deadline RSVP).
- Eksport wydarzenia do kalendarza (`.ics`, przycisk "Dodaj do kalendarza").

### 4. RSVP
- Formularz RSVP z decyzją per osoba (wymagana odpowiedź dla wszystkich gości z zaproszenia).
- Obsługa +1 (czy będzie + imię i nazwisko).
- Wybór transportu (`own` / `bus`).
- Deklaracja udziału jako kierowca Car Pool.
- Data i godzina przylotu.
- Wiadomość do organizatorów.
- Edycja odpowiedzi do końca "grace period".

### 5. Car Pool
- Tworzenie, edycja, zamykanie i anulowanie ofert przejazdu przez kierowców.
- Zgłaszanie się pasażerów na przejazd (liczba miejsc, wiadomość, flaga mediacji).
- Akceptacja/odrzucanie zgłoszeń przez kierowcę.
- Anulowanie zgłoszenia przez pasażera.
- Reguły biznesowe: limity miejsc, tylko jedno oczekujące zgłoszenie, blokada po deadline, walidacja uprawnień.
- Automatyczne porządkowanie spójności przy zmianach RSVP (np. systemowe anulowanie niespójnych ofert/zgłoszeń).
- Widok admina: podgląd ofert, oczekujących zgłoszeń i alertów mediacyjnych.

### 6. Q&A
- Publiczna lista pytań i odpowiedzi dla gości.
- Dodawanie pytań przez gości (także z przypięciem do zaproszenia).
- Panel admina do odpowiadania na pytania i zarządzania kolejką pending/answered.

### 7. Panel admina
- Zbiorcze statystyki RSVP (potwierdzenia, odmowy, brak odpowiedzi, transport bus).
- Edycja terminów (`RSVP deadline`, `grace`, `Car Pool deadline`).
- Tabela zaproszeń z PIN, linkiem QR, statusem RSVP i szczegółami +1.
- Grupowanie przylotów po datach.
- Uzupełnianie relacji gości (np. świadek/rodzina).
- Seed zaproszeń z listy gości (`seedInvitations`).

### 8. Operacje i wdrożenie
- Skrypt generowania QR kodów (`scripts/generate-qr.mjs`) + eksport `index.csv` i `index.json`.
- Konfiguracja deployu na Cloudflare (`wrangler`, workflow GitHub Actions).

## Potencjalne kierunki rozwoju (produktyzacja)

### Priorytet A - stabilność i bezpieczeństwo
1. Dodać middleware/autoryzację po stronie backendu Convex dla mutacji administracyjnych (nie tylko na poziomie UI).
2. Przenieść listę adminów z kodu do konfiguracji środowiskowej lub tabeli z rolami.
3. Dodać rate limiting i proste mechanizmy anty-bruteforce dla logowania PIN.
4. Dodać audit log (kto/co/kiedy zmienił: RSVP, terminy, odpowiedzi Q&A, Car Pool).

### Priorytet B - obsługa procesu eventowego
1. Automatyczne przypomnienia (email/SMS) o braku RSVP i o zbliżającym się deadline.
2. Powiadomienia o zmianie statusu Car Pool (akceptacja/odrzucenie/anulowanie).
3. Eksporty operacyjne CSV (goście, przyloty, transport, Car Pool, Q&A).
4. Zarządzanie kontaktami awaryjnymi z panelu admina (teraz wartości są statyczne w UI).

### Priorytet C - doświadczenie użytkownika
1. Wielojęzyczność (PL/EN), szczególnie dla gości zagranicznych.
2. Lepszy onboarding po zalogowaniu (krótka checklista: RSVP -> transport -> Q&A).
3. Strona "Moje dane" z ostatnią aktualizacją i historią zmian.
4. Uspójnienie dat i stref czasowych (jawna strefa dla wszystkich dat w formularzach i dashboardzie).

### Priorytet D - jakość techniczna
1. Testy jednostkowe i integracyjne dla krytycznych reguł (RSVP i Car Pool).
2. E2E dla flow logowania QR/PIN i podstawowych ścieżek gościa/admina.
3. Monitoring błędów i alerty produkcyjne (frontend + backend).
4. Walidacja konfiguracji środowiska przy starcie (brak kluczowych envów = czytelny błąd).

### Priorytet E - skalowanie do "produktu"
1. Multi-event / multi-tenant: możliwość tworzenia wielu wydarzeń z osobnymi ustawieniami i domeną.
2. Samoobsługowy panel organizatora (tworzenie eventu, import gości CSV, branding).
3. Szablony wydarzeń (wesele, konferencja, zjazd rodzinny).
4. Role i uprawnienia (owner, coordinator, read-only).

## Proponowana kolejność wdrożeń

### Etap 1 (krótki horyzont)
- Twarde uprawnienia backendowe + audit log + rate limiting PIN.
- Testy krytycznych reguł RSVP/Car Pool.

### Etap 2
- Powiadomienia i eksporty operacyjne.
- Uporządkowanie panelu admina pod codzienną pracę organizacyjną.

### Etap 3
- Multi-event i role użytkowników.
- Rozwój w kierunku pełnego produktu SaaS.

## Szybkie podsumowanie
Projekt już pokrywa kluczowe procesy eventowe (dostęp, RSVP, Car Pool, Q&A, panel admina). Największy efekt biznesowy da teraz domknięcie bezpieczeństwa i operacyjności (logi, uprawnienia, powiadomienia), a dopiero potem skalowanie do modelu wielo-eventowego.
