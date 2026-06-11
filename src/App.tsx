import { useCallback, useMemo, useState } from 'react';
import ControlBar from './components/ControlBar';
import FindItMode from './components/FindItMode';
import Map, { type CountryFeature } from './components/Map';
import NameItMode from './components/NameItMode';
import { useGameState } from './hooks/useGameState';

const featureId = (feature: CountryFeature) => {
  if (feature.id === null || feature.id === undefined) {
    return `name:${feature.properties?.name ?? 'unknown'}`;
  }

  return String(feature.id).padStart(3, '0');
};

export default function App() {
  const game = useGameState();
  const [features, setFeatures] = useState<CountryFeature[]>([]);

  const handleFeaturesLoaded = useCallback((nextFeatures: CountryFeature[]) => {
    setFeatures(nextFeatures);
  }, []);

  const selectedFeature = useMemo(() => {
    if (!game.selectedCountry) {
      return null;
    }

    return features.find((feature) => featureId(feature) === game.selectedCountry?.id) ?? null;
  }, [features, game.selectedCountry]);

  const handleMapClick = (countryId: string) => {
    if (game.mode === 'find') {
      game.handleFindGuess(countryId);
      return;
    }

    game.selectNameCountry(countryId);
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <ControlBar
        continent={game.continent}
        continentOptions={game.continentOptions}
        maxScore={game.maxScore}
        mode={game.mode}
        remaining={game.remaining}
        score={game.score}
        streak={game.streak}
        onContinentChange={game.setContinent}
        onModeChange={game.setMode}
        onReset={() => game.resetRound()}
      />

      <main className="relative min-h-0 flex-1">
        <Map
          activeIds={game.activeIds}
          countryStatuses={game.countryStatuses}
          currentCountryId={game.currentCountry?.id ?? null}
          mode={game.mode}
          selectedCountryId={game.selectedCountry?.id ?? null}
          onCountryClick={handleMapClick}
          onFeaturesLoaded={handleFeaturesLoaded}
        />

        <div className="pointer-events-none absolute left-1/2 top-5 z-10 w-[min(92vw,640px)] -translate-x-1/2">
          <div className="pointer-events-auto">
            {game.mode === 'find' ? (
              <FindItMode
                attempts={game.findAttempts}
                currentCountry={game.currentCountry}
                message={game.findMessage}
                revealPendingId={game.revealPendingId}
              />
            ) : null}
          </div>
        </div>

        {game.mode === 'name' ? (
          <div className="absolute right-5 top-5 z-10">
            <NameItMode
              lastResult={game.lastNameResult}
              selectedCountry={game.selectedCountry}
              selectedFeature={selectedFeature}
              onSubmit={game.submitNameAnswer}
            />
          </div>
        ) : null}

        {game.isRoundComplete ? (
          <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Round Summary</p>
              <h2 className="mt-3 text-4xl font-black text-white">
                {game.summary.percentage}%
              </h2>
              <p className="mt-2 text-slate-300">
                You scored {game.summary.totalScore} of {game.summary.maxScore} possible points.
              </p>

              {game.continent === 'World' && game.summary.byContinent.length ? (
                <div className="mt-5 grid gap-2 text-left">
                  {game.summary.byContinent.map((item) => (
                    <div
                      key={item.continent}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-slate-100">{item.continent}</span>
                      <span className="text-slate-300">
                        {item.score}/{item.maxScore} points across {item.attempted}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                className="mt-6 rounded-full bg-sky-300 px-6 py-3 font-black text-slate-950 transition hover:bg-sky-200"
                type="button"
                onClick={() => game.resetRound()}
              >
                Play Again
              </button>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
