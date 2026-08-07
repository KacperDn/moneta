import { IconChevronLeft } from "./icons";

interface Props {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: Props) {
  return (
    <div className="settings">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <header className="settings__header">
        <button type="button" className="settings__back" onClick={onBack} aria-label="Wróć">
          {IconChevronLeft}
        </button>
        <div className="settings__title">Polityka prywatności</div>
      </header>

      <div className="settings__container">
        <div className="legal__updated">Ostatnia aktualizacja: 8 sierpnia 2026</div>

        <div className="legal__section">
          <div className="legal__heading">1. Administrator danych</div>
          <div className="legal__text">
            Administratorem danych jest autor aplikacji moneta, Kacper Daniluk. Kontakt: <a href="mailto:praktykikd@gmail.com" className="legal__link">praktykikd@gmail.com</a>.
          </div>
        </div>

        <div className="legal__section">
          <div className="legal__heading">2. Jakie dane zbieramy</div>
          <div className="legal__text">
            Adres email i hasło — podczas rejestracji i logowania (hasło jest przechowywane w formie zaszyfrowanej przez Supabase Auth, nigdy jako czysty tekst). Dane o wydatkach, które sam wprowadzasz: opis, kategoria, kwota, data. Opcjonalny cel budżetowy — miesięczny limit wydatków.
            <br /><br />
            Nie zbieramy żadnych innych danych — nie prosimy o imię, numer telefonu, adres czy dane płatnicze.
          </div>
        </div>

        <div className="legal__section">
          <div className="legal__heading">3. Do czego wykorzystujemy dane</div>
          <div className="legal__text">
            Wyłącznie do działania samej aplikacji — logowania, wyświetlania Twoich wydatków, wykresów i statystyk. Nie wykorzystujemy danych do żadnych innych celów. Nie ma reklam, nie ma sprzedaży danych, nie ma profilowania.
          </div>
        </div>

        <div className="legal__section">
          <div className="legal__heading">4. Jak przechowujemy dane</div>
          <div className="legal__text">
            Dane są przechowywane w bazie PostgreSQL udostępnianej przez Supabase, z włączonym Row Level Security — na poziomie bazy danych masz dostęp wyłącznie do swoich własnych danych. Połączenie z bazą odbywa się przez HTTPS.
          </div>
        </div>

        <div className="legal__section">
          <div className="legal__heading">5. Udostępnianie danych</div>
          <div className="legal__text">
            Nie udostępniamy, nie sprzedajemy i nie wynajmujemy Twoich danych żadnym firmom trzecim. Aplikacja nie korzysta z narzędzi analitycznych ani reklamowych.
          </div>
        </div>

        <div className="legal__section">
          <div className="legal__heading">6. Cookies i localStorage</div>
          <div className="legal__text">
            Aplikacja nie używa cookies do śledzenia. W pamięci lokalnej przeglądarki zapisujemy jedynie token sesji logowania oraz wybrany motyw (jasny/ciemny). Żadne z tych danych nie są wysyłane do firm trzecich.
          </div>
        </div>

        <div className="legal__section">
          <div className="legal__heading">7. Twoje prawa</div>
          <div className="legal__text">
            Masz prawo do wglądu, poprawiania i usunięcia swoich danych. Wydatki możesz edytować i usuwać samodzielnie w aplikacji. Jeśli chcesz usunąć całe konto wraz z danymi, napisz na adres kontaktowy poniżej — usuniemy je jak najszybciej.
          </div>
        </div>

        <div className="legal__section">
          <div className="legal__heading">8. Kontakt</div>
          <div className="legal__text">
            W sprawie swoich danych pisz na: <a href="mailto:praktykikd@gmail.com" className="legal__link">praktykikd@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
