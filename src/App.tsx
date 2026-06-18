import { useCallback, useMemo, useState } from 'react';
import ControlBar from './components/ControlBar';
import FindItMode from './components/FindItMode';
import Map, { type CountryFeature } from './components/Map';
import NameItMode from './components/NameItMode';
import { useGameState, type GameMode } from './hooks/useGameState';
import type { Continent } from './data/countries';

const modeDescriptions: Record<GameMode, { title: string; description: string; rules: string[] }> = {
  find: {
    title: 'Find It',
    description: 'You are given a country name and click that country on the map.',
    rules: [
      'Correct on the first click: 2 points',
      'Correct on the second click: 1 point',
      'Two wrong clicks: 0 points, then the country is revealed',
    ],
  },
  name: {
    title: 'Name It',
    description: 'You click a country on the map and type its name for points.',
    rules: [
      'Exact spelling: 3 points',
      '1-2 letters off: 2 points',
      '3-4 letters off: 1 point',
      'More than 4 letters off: 0 points',
    ],
  },
};

const featureId = (feature: CountryFeature) => {
  if (feature.id === null || feature.id === undefined) {
    return `name:${feature.properties?.name ?? 'unknown'}`;
  }

  return String(feature.id).padStart(3, '0');
};

export default function App() {
  const game = useGameState();
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [startupMode, setStartupMode] = useState<GameMode>('find');
  const [startupContinent, setStartupContinent] = useState<Continent>('World');

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

  const startGame = () => {
    game.resetRound(startupMode, startupContinent);
    setHasStarted(true);
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

        {!hasStarted ? (
          <div className="absolute inset-0 z-40 grid place-items-center bg-slate-950/85 p-4 backdrop-blur">
            <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
                Choose Your Game
              </p>
              <h1 className="mt-3 text-3xl font-black text-white">World Geography Guessing Game</h1>
              <p className="mt-2 text-slate-300">
                Pick a mode and region before the round begins.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {(['find', 'name'] as GameMode[]).map((option) => (
                  <button
                    key={option}
                    className={`rounded-2xl border p-4 text-left transition ${
                      startupMode === option
                        ? 'border-emerald-300 bg-emerald-400/15 shadow-glow'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    type="button"
                    onClick={() => setStartupMode(option)}
                  >
                    <span className="block text-xl font-black text-white">
                      {modeDescriptions[option].title}
                    </span>
                    <span className="mt-2 block text-sm text-slate-300">
                      {modeDescriptions[option].description}
                    </span>
                    <span className="mt-4 block text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                      Points
                    </span>
                    <span className="mt-2 grid gap-1 text-sm text-slate-300">
                      {modeDescriptions[option].rules.map((rule) => (
                        <span key={rule}>{rule}</span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>

              <label className="mt-6 block text-sm font-semibold text-slate-200" htmlFor="startup-continent">
                Continent
              </label>
              <select
                id="startup-continent"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-sky-300"
                value={startupContinent}
                onChange={(event) => setStartupContinent(event.target.value as Continent)}
              >
                {game.continentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <button
                className="mt-6 w-full rounded-full bg-sky-300 px-6 py-3 font-black text-slate-950 transition hover:bg-sky-200"
                type="button"
                onClick={startGame}
              >
                Start Game
              </button>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
