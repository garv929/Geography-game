import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CONTINENTS,
  COUNTRIES,
  COUNTRIES_BY_CONTINENT,
  COUNTRY_BY_ID,
  type Continent,
  type Country,
} from '../data/countries';
import { scoreCountryName, type NameScore } from '../utils/levenshtein';

export type GameMode = 'find' | 'name';
export type CountryStatus = 'correct' | 'wrong' | 'revealed' | 'partial' | 'missed';

export type NameResult = NameScore & {
  country: Country;
};

export type RoundSummary = {
  totalScore: number;
  maxScore: number;
  percentage: number;
  byContinent: Array<{
    continent: Exclude<Continent, 'World'>;
    attempted: number;
    score: number;
    maxScore: number;
  }>;
};

const findModeMaxPoints = 2;
const nameModeMaxPoints = 3;

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const modeMaxPoints = (mode: GameMode) =>
  mode === 'find' ? findModeMaxPoints : nameModeMaxPoints;

export const useGameState = () => {
  const [mode, setModeState] = useState<GameMode>('find');
  const [continent, setContinentState] = useState<Continent>('World');
  const [queue, setQueue] = useState<Country[]>(() => shuffle(COUNTRIES));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [findIndex, setFindIndex] = useState(0);
  const [findAttempts, setFindAttempts] = useState(0);
  const [findMessage, setFindMessage] = useState('Click the highlighted country on the map.');
  const [revealPendingId, setRevealPendingId] = useState<string | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [lastNameResult, setLastNameResult] = useState<NameResult | null>(null);
  const [countryStatuses, setCountryStatuses] = useState<Record<string, CountryStatus>>({});
  const [completedNameIds, setCompletedNameIds] = useState<Set<string>>(() => new Set());
  const [continentScores, setContinentScores] = useState<
    Record<string, { score: number; attempted: number }>
  >({});
  const timeoutRef = useRef<number | null>(null);

  const activePool = useMemo(() => COUNTRIES_BY_CONTINENT[continent], [continent]);
  const activeIds = useMemo(() => new Set(activePool.map((country) => country.id)), [activePool]);
  const currentCountry = mode === 'find' ? queue[findIndex] ?? null : null;
  const findRoundComplete = mode === 'find' && queue.length > 0 && findIndex >= queue.length;
  const nameRoundComplete =
    mode === 'name' && activePool.length > 0 && completedNameIds.size >= activePool.length;
  const isRoundComplete = findRoundComplete || nameRoundComplete;
  const remaining =
    mode === 'find'
      ? Math.max(queue.length - findIndex, 0)
      : Math.max(activePool.length - completedNameIds.size, 0);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetRound = useCallback(
    (nextMode = mode, nextContinent = continent) => {
      clearPendingTimeout();
      const nextPool = COUNTRIES_BY_CONTINENT[nextContinent];
      setQueue(shuffle(nextPool));
      setScore(0);
      setStreak(0);
      setFindIndex(0);
      setFindAttempts(0);
      setFindMessage('Click the highlighted country on the map.');
      setRevealPendingId(null);
      setSelectedCountryId(null);
      setLastNameResult(null);
      setCountryStatuses({});
      setCompletedNameIds(new Set());
      setContinentScores({});
      setModeState(nextMode);
      setContinentState(nextContinent);
    },
    [clearPendingTimeout, continent, mode],
  );

  const setMode = useCallback(
    (nextMode: GameMode) => {
      resetRound(nextMode, continent);
    },
    [continent, resetRound],
  );

  const setContinent = useCallback(
    (nextContinent: Continent) => {
      resetRound(mode, nextContinent);
    },
    [mode, resetRound],
  );

  const markCountryTemporarily = useCallback(
    (id: string, status: CountryStatus, duration = 650) => {
      clearPendingTimeout();
      setCountryStatuses((current) => ({ ...current, [id]: status }));
      timeoutRef.current = window.setTimeout(() => {
        setCountryStatuses((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        timeoutRef.current = null;
      }, duration);
    },
    [clearPendingTimeout],
  );

  const recordAttempt = useCallback((country: Country, points: number) => {
    setContinentScores((current) => {
      const existing = current[country.continent] ?? { score: 0, attempted: 0 };
      return {
        ...current,
        [country.continent]: {
          score: existing.score + points,
          attempted: existing.attempted + 1,
        },
      };
    });
  }, []);

  const advanceFind = useCallback(() => {
    clearPendingTimeout();
    setFindIndex((index) => index + 1);
    setFindAttempts(0);
    setRevealPendingId(null);
    setFindMessage('Click the highlighted country on the map.');
  }, [clearPendingTimeout]);

  const handleFindGuess = useCallback(
    (countryId: string) => {
      if (!currentCountry || !activeIds.has(countryId)) {
        return;
      }

      if (revealPendingId) {
        if (countryId === revealPendingId) {
          advanceFind();
        }
        return;
      }

      if (countryId === currentCountry.id) {
        const points = findAttempts === 0 ? 2 : 1;
        const status: CountryStatus = points === 2 ? 'correct' : 'partial';
        setScore((value) => value + points);
        setStreak((value) => value + 1);
        recordAttempt(currentCountry, points);
        setFindMessage(points === 2 ? '+2 points. Nice find!' : '+1 point. Good recovery!');
        setCountryStatuses((current) => ({ ...current, [countryId]: status }));
        timeoutRef.current = window.setTimeout(advanceFind, 700);
        return;
      }

      if (findAttempts === 0) {
        setFindAttempts(1);
        setStreak(0);
        setFindMessage('Try again (1 attempt left)');
        markCountryTemporarily(countryId, 'wrong');
        return;
      }

      setStreak(0);
      recordAttempt(currentCountry, 0);
      setFindMessage(`That was ${currentCountry.name}. Moving to the next country.`);
      setCountryStatuses((current) => ({ ...current, [currentCountry.id]: 'missed' }));
      timeoutRef.current = window.setTimeout(advanceFind, 1200);
    },
    [
      activeIds,
      advanceFind,
      currentCountry,
      findAttempts,
      markCountryTemporarily,
      recordAttempt,
      revealPendingId,
    ],
  );

  const selectNameCountry = useCallback(
    (countryId: string) => {
      if (mode !== 'name' || !activeIds.has(countryId) || completedNameIds.has(countryId)) {
        return;
      }

      setSelectedCountryId(countryId);
      setLastNameResult(null);
    },
    [activeIds, completedNameIds, mode],
  );

  const submitNameAnswer = useCallback(
    (answer: string) => {
      if (!selectedCountryId || completedNameIds.has(selectedCountryId)) {
        return null;
      }

      const country = COUNTRY_BY_ID.get(selectedCountryId);
      if (!country) {
        return null;
      }

      const result = scoreCountryName(answer, [country.name, ...(country.aliases ?? [])]);
      const status: CountryStatus =
        result.quality === 'perfect'
          ? 'correct'
          : result.quality === 'partial'
            ? 'partial'
            : 'missed';

      setScore((value) => value + result.points);
      setStreak((value) => (result.points > 0 ? value + 1 : 0));
      setCountryStatuses((current) => ({ ...current, [country.id]: status }));
      setCompletedNameIds((current) => new Set(current).add(country.id));
      setContinentScores((current) => {
        const existing = current[country.continent] ?? { score: 0, attempted: 0 };
        return {
          ...current,
          [country.continent]: {
            score: existing.score + result.points,
            attempted: existing.attempted + 1,
          },
        };
      });

      const nameResult = { ...result, country };
      setLastNameResult(nameResult);
      setSelectedCountryId(null);
      return nameResult;
    },
    [completedNameIds, selectedCountryId],
  );

  const selectedCountry = selectedCountryId ? COUNTRY_BY_ID.get(selectedCountryId) ?? null : null;
  const maxScore = activePool.length * modeMaxPoints(mode);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const summary: RoundSummary = {
    totalScore: score,
    maxScore,
    percentage,
    byContinent: CONTINENTS.filter(
      (item): item is Exclude<Continent, 'World'> => item !== 'World',
    )
      .map((item) => {
        const attempted =
          continent === 'World'
            ? continentScores[item]?.attempted ?? 0
            : item === continent
              ? activePool.length
              : 0;
        const continentScore =
          continent === 'World'
            ? continentScores[item]?.score ?? 0
            : item === continent
              ? score
              : 0;
        const max = attempted * modeMaxPoints(mode);
        return { continent: item, attempted, score: continentScore, maxScore: max };
      })
      .filter((item) => item.attempted > 0),
  };

  useEffect(() => () => clearPendingTimeout(), [clearPendingTimeout]);

  return {
    activeIds,
    activePool,
    continent,
    continentOptions: CONTINENTS,
    countryStatuses,
    currentCountry,
    findAttempts,
    findMessage,
    handleFindGuess,
    isRoundComplete,
    lastNameResult,
    maxScore,
    mode,
    percentage,
    remaining,
    resetRound,
    revealPendingId,
    score,
    selectNameCountry,
    selectedCountry,
    setContinent,
    setMode,
    streak,
    submitNameAnswer,
    summary,
  };
};
