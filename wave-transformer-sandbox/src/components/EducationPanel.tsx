import type { ThicknessMode } from "../physics";

interface EducationPanelProps {
  mode: ThicknessMode;
}

export function EducationPanel({ mode }: EducationPanelProps) {
  return (
    <section className="education-grid">
      <article className={mode === "quarter" ? "lesson active" : "lesson"}>
        <span>λ/4</span>
        <h3>Transformator ćwierćfalowy</h3>
        <p>Warstwa λ/4 odwraca impedancję: Zin = Zw2² / Zw3.</p>
      </article>
      <article className={mode === "half" ? "lesson active" : "lesson"}>
        <span>λ/2</span>
        <h3>Warstwa półfalowa</h3>
        <p>Warstwa λ/2 jest impedancyjnie przezroczysta: Zin = Zw3.</p>
      </article>
      <article className="lesson">
        <span>Γ = 0</span>
        <h3>Dopasowanie</h3>
        <p>Dobieramy Zw2 = √(Zw1 Zw3), aby Γ12 = 0.</p>
      </article>
      <article className="lesson lesson-wide">
        <span>Ważne</span>
        <h3>Odbicia wewnętrzne nadal istnieją</h3>
        <p>
          Brak odbicia w ośrodku 1 nie oznacza, że nie ma odbić wewnątrz
          warstwy; oznacza, że ich wynikowy efekt widziany od strony źródła
          znika.
        </p>
      </article>
    </section>
  );
}
