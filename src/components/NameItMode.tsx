import { FormEvent, useEffect, useState } from 'react';
import type { Country } from '../data/countries';
import type { NameResult } from '../hooks/useGameState';
import { CountryThumbnail, type CountryFeature } from './Map';

type NameItModeProps = {
  lastResult: NameResult | null;
  selectedCountry: Country | null;
  selectedFeature: CountryFeature | null;
  onSubmit: (answer: string) => NameResult | null;
};

export default function NameItMode({
  lastResult,
  selectedCountry,
  selectedFeature,
  onSubmit,
}: NameItModeProps) {
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    setAnswer('');
  }, [selectedCountry?.id]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCountry || !answer.trim()) {
      return;
    }

    onSubmit(answer);
    setAnswer('');
  };

  return (
    <section className="w-80 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Name It</p>
      <p className="mt-2 text-sm text-slate-300">
        Click a country, type its name, then press Enter or submit.
      </p>

      <div className="mt-4">
        <CountryThumbnail feature={selectedFeature} />
      </div>

      {selectedCountry ? (
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-200" htmlFor="country-answer">
            What country is this?
          </label>
          <input
            id="country-answer"
            autoFocus
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
            placeholder="Type the country name..."
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <button
            className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300"
            type="submit"
          >
            Submit
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
          Select an unplayed country on the map.
        </div>
      )}

      {lastResult ? (
        <div
          className={`mt-4 rounded-xl p-3 text-sm ${
            lastResult.quality === 'perfect'
              ? 'bg-emerald-400/15 text-emerald-100'
              : lastResult.quality === 'partial'
                ? 'bg-amber-300/15 text-amber-100'
                : 'bg-red-400/15 text-red-100'
          }`}
        >
          <strong>{lastResult.label}</strong>{' '}
          {lastResult.points > 0
            ? `+${lastResult.points} point${lastResult.points === 1 ? '' : 's'}`
            : `The answer was ${lastResult.country.name}.`}
        </div>
      ) : null}
    </section>
  );
}
