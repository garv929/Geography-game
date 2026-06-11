import type { Continent } from '../data/countries';
import type { GameMode } from '../hooks/useGameState';

type ControlBarProps = {
  continent: Continent;
  continentOptions: Continent[];
  maxScore: number;
  mode: GameMode;
  remaining: number;
  score: number;
  streak: number;
  onContinentChange: (continent: Continent) => void;
  onModeChange: (mode: GameMode) => void;
  onReset: () => void;
};

const modeLabels: Record<GameMode, string> = {
  find: 'Find It',
  name: 'Name It',
};

export default function ControlBar({
  continent,
  continentOptions,
  maxScore,
  mode,
  remaining,
  score,
  streak,
  onContinentChange,
  onModeChange,
  onReset,
}: ControlBarProps) {
  return (
    <header className="z-20 flex flex-col gap-3 border-b border-white/10 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
          Region
        </span>
        <div className="hidden flex-wrap gap-1 md:flex">
          {continentOptions.map((option) => (
            <button
              key={option}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                continent === option
                  ? 'bg-sky-400 text-slate-950 shadow-glow'
                  : 'bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
              type="button"
              onClick={() => onContinentChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <select
          className="rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-300 md:hidden"
          value={continent}
          onChange={(event) => onContinentChange(event.target.value as Continent)}
        >
          {continentOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-full bg-slate-950/70 p-1">
          {(['find', 'name'] as GameMode[]).map((option) => (
            <button
              key={option}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === option
                  ? 'bg-emerald-400 text-slate-950'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
              type="button"
              onClick={() => onModeChange(option)}
            >
              {modeLabels[option]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
          <span className="text-slate-400">Score</span>
          <strong className="text-white">
            {score}/{maxScore}
          </strong>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
          <span className="text-slate-400">Remaining</span>
          <strong className="text-white">{remaining}</strong>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
          <span className="text-slate-400">Streak</span>
          <strong className="text-white">{streak}</strong>
        </div>
        <button
          className="rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
          type="button"
          onClick={onReset}
        >
          New Game / Reset
        </button>
      </div>
    </header>
  );
}
