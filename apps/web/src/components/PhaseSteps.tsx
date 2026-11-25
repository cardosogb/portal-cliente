import { PHASE_ORDER, phaseStepIndex } from "@portal/shared";

/**
 * Mostra as fases do processo como uma linha do tempo visual (passo a
 * passo), em vez de só um texto. Pra quem não é da área, "ver" onde o
 * processo está (com um check nas etapas já passadas) é mais fácil de
 * entender num relance do que ler um parágrafo.
 *
 * Se a fase atual não estiver na lista padrão (processos reais variam),
 * não desenha nada — quem usa a tela continua vendo só o texto da fase,
 * sem quebrar a página.
 */
export function PhaseSteps({ currentPhase }: { currentPhase: string }) {
  const currentIndex = phaseStepIndex(currentPhase);
  if (currentIndex === -1) return null;

  return (
    <div className="phase-steps" role="list" aria-label="Fases do processo">
      {PHASE_ORDER.map((phase, i) => {
        const status = i < currentIndex ? "done" : i === currentIndex ? "current" : "";
        return (
          <div key={phase} className={`phase-step ${status}`} role="listitem">
            <span className="phase-step-line" aria-hidden="true" />
            <span className="phase-step-dot" aria-hidden="true">{i < currentIndex ? "✓" : i + 1}</span>
            <span className="phase-step-label">{phase}</span>
          </div>
        );
      })}
    </div>
  );
}
