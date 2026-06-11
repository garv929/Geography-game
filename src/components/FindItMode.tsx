import type { Country } from '../data/countries';

type FindItModeProps = {
  attempts: number;
  currentCountry: Country | null;
  message: string;
  revealPendingId: string | null;
};

export default function FindItMode({
  attempts,
  currentCountry,
  message,
  revealPendingId,
}: FindItModeProps) {
  if (!currentCountry) {
    return (
      <div className="rounded-2xl border border-emerald-300/30 bg-slate-900/90 p-5 text-center shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Round Complete</p>
        <h2 className="mt-2 text-2xl font-black text-white">You found every country.</h2>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.25em] text-sky-300">Find It</p>
      <h1 className="mt-2 text-3xl font-black text-white">
        Find: <span className="text-sky-300">{currentCountry.name}</span>
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`rounded-full px-3 py-1 font-semibold ${
            revealPendingId
              ? 'bg-amber-300 text-slate-950'
              : attempts === 0
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-red-400 text-slate-950'
          }`}
        >
          {revealPendingId ? 'Click the answer to continue' : `${2 - attempts} attempt(s) left`}
        </span>
        <span className="text-slate-300">{message}</span>
      </div>
    </section>
  );
}
