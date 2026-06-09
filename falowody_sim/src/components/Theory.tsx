export function Theory() {
  return (
    <section className="theory panel">
      <div className="theory-title">
        <p className="eyebrow">Teoria</p>
        <h2>Jak czytać symulator</h2>
      </div>
      <div className="theory-grid">
        <article>
          <span>01</span>
          <h3>TE i TM to nie TEM</h3>
          <p>
            TE oznacza E<sub>z</sub> = 0 i H<sub>z</sub> ≠ 0. TM oznacza
            H<sub>z</sub> = 0 i E<sub>z</sub> ≠ 0. W pustym,
            jednoprzewodowym falowodzie prostokątnym klasyczny mod TEM nie
            istnieje.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Indeksy m, n</h3>
          <p>
            Indeksy opisują liczbę półfalowych zmian rozkładu w kierunkach x
            i y. TE<sub>00</sub> nie istnieje, a dla modów TM oba indeksy
            muszą być co najmniej równe 1.
          </p>
        </article>
        <article>
          <span>03</span>
          <h3>Odcięcie</h3>
          <p>
            Częstotliwość f<sub>c</sub> decyduje o propagacji. Dla f &gt;
            f<sub>c</sub> stała β jest rzeczywista. Poniżej odcięcia pole
            zanika wykładniczo wzdłuż z.
          </p>
        </article>
        <article>
          <span>04</span>
          <h3>Trzy różne prądy</h3>
          <p>
            J<sub>s</sub> = n × H jest prądem powierzchniowym na PEC.
            J<sub>d</sub> = ∂D/∂t oraz J<sub>σ</sub> = σE są gęstościami
            objętościowymi w dielektryku i nie wolno ich utożsamiać.
          </p>
        </article>
      </div>
    </section>
  );
}
