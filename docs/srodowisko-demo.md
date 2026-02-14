# Brief techniczny: środowisko demo (`interactive + auto-reset`)

## 1. Cel
Stworzyć publiczne środowisko demo do portfolio, w którym odwiedzający może samodzielnie przejść najważniejsze funkcjonalności aplikacji ślubnej bez ryzyka ujawnienia danych prywatnych.

## 2. Klasyfikacja zadania
- Typ: `feature`
- Tryb demo: `interactive + auto-reset`

## 3. Zakres i poza zakresem
### Zakres (in)
- Logowanie na gotowe konto demo (gość + admin demo).
- Pełne flow: RSVP, Car Pool, Q&A, przegląd dashboardu, podgląd panelu admina.
- Edycja danych przez użytkownika w trakcie sesji demo.
- Automatyczny reset danych do stanu bazowego.

### Poza zakresem (out)
- Realne dane gości, realne tokeny QR/PIN, realna komunikacja z gośćmi.
- Realne wysyłki email/SMS/push.
- Integracje kosztowe lub ryzykowne uruchamiane bezpośrednio z demo.

## 4. Założenia architektoniczne
- Osobne środowisko: osobny URL, osobne sekrety, osobna baza, osobny storage.
- Brak współdzielonych zasobów danych z produkcją.
- Tryb aplikacji ustawiany flagą środowiskową (np. `APP_MODE=demo`).
- W demo obowiązuje zasada: każda integracja zewnętrzna działa jako mock/stub albo jest wyłączona.

## 5. Strategia danych demo
- Dane seedowane są fikcyjne, ale realistyczne (nazwiska, statusy RSVP, przyloty, oferty Car Pool, pytania Q&A).
- Seed zawiera 2-3 gotowe scenariusze:
  - Para z kompletnym RSVP i transportem.
  - Para bez odpowiedzi (pokazuje stany oczekujące).
  - Scenariusz konfliktu/mediacji Car Pool.
- Materiały graficzne i treści nie mogą zawierać danych osobowych ani zdjęć prywatnych.

## 6. Auto-reset
- Reset cykliczny: np. co noc (00:00 lokalnego czasu).
- Reset ręczny: endpoint/komenda admin-only do natychmiastowego odtworzenia seeda.
- Model resetu:
  - `truncate + reseed` dla danych operacyjnych,
  - odtwarzanie konfiguracji bazowej (terminy, ustawienia),
  - czyszczenie artefaktów tymczasowych.
- Cel: każdy użytkownik dostaje przewidywalny stan startowy niezależnie od aktywności poprzednich odwiedzających.

## 7. Bezpieczeństwo i prywatność
- Zero migracji realnych danych do demo.
- Osobne klucze API i osobna polityka dostępu.
- Ograniczenia anty-abuse:
  - rate limiting na logowanie i mutacje,
  - ograniczenie payloadów i uploadów,
  - podstawowe logowanie nadużyć.
- Widoczny baner: „To jest środowisko demonstracyjne. Dane są okresowo resetowane”.

## 8. UX demo w portfolio
- Dedykowana podstrona „Jak testować demo”:
  - dane logowania do kont demo,
  - krótka checklista kroków (RSVP -> Car Pool -> Q&A -> Admin),
  - informacja o harmonogramie resetu.
- Szybkie CTA do kluczowych ekranów, aby skrócić czas „time-to-wow”.

## 9. Obserwowalność i utrzymanie
- Monitoring błędów frontend/backend (oddzielny projekt dla demo).
- Prosty heartbeat / healthcheck dla demo URL.
- Alert przy nieudanym reseedzie lub braku resetu zgodnie z harmonogramem.

## 10. Kryteria akceptacji (Definition of Done)
- Demo działa pod osobnym adresem i nie używa produkcyjnej bazy/secrets.
- Odwiedzający może wykonać pełne flow użytkownika demo bez wsparcia.
- Żadna akcja demo nie wysyła realnych wiadomości i nie dotyka produkcji.
- Reset przywraca stan bazowy w sposób powtarzalny.
- Istnieje instrukcja „jak testować demo” oraz informacja o resetach.
- Monitoring zgłasza awarię resetu i błędy krytyczne.

## 11. Plan wdrożenia (etapami)
### Etap 1: fundament
- Wydzielenie środowiska demo i konfiguracji.
- Implementacja flag `APP_MODE=demo`.
- Przygotowanie datasetu seed.

### Etap 2: bezpieczeństwo i reset
- Mock/wyłączenie integracji zewnętrznych.
- Implementacja resetu cyklicznego i ręcznego.
- Dodanie rate limiting + podstawowe logi nadużyć.

### Etap 3: doświadczenie portfolio
- Strona onboardingowa dla odwiedzającego.
- Konto gość/admin demo i gotowe scenariusze testowe.
- Monitoring + healthcheck + alerty.

## 12. Ryzyka i mitigacje
- Ryzyko: „wyciek” konfiguracji między demo i prod.
  - Mitigacja: jawne rozdzielenie env, sekrety per środowisko, checklista release.
- Ryzyko: „zepsuty” stan demo po intensywnych testach.
  - Mitigacja: regularny reset + przycisk resetu ręcznego.
- Ryzyko: odwiedzający nie wie, co kliknąć.
  - Mitigacja: checklista i krótkie scenariusze wejścia.

## 13. Decyzje zatwierdzone
- Model docelowy: `interactive + auto-reset`.
- Kierunek: środowisko demo traktowane jak osobny produkt operacyjny, nie jako okrojona produkcja.
