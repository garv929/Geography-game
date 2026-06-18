import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { COUNTRY_BY_ID } from '../data/countries';
import type { CountryStatus, GameMode } from '../hooks/useGameState';

const ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type AtlasTopology = {
  objects: {
    countries: unknown;
  };
};

export type CountryFeature = Feature<Geometry, { name?: string }> & {
  id?: string | number | null;
};

type MapProps = {
  activeIds: Set<string>;
  countryStatuses: Record<string, CountryStatus>;
  currentCountryId?: string | null;
  mode: GameMode;
  onCountryClick: (countryId: string) => void;
  onFeaturesLoaded: (features: CountryFeature[]) => void;
  selectedCountryId?: string | null;
};

const statusFill: Record<CountryStatus, string> = {
  correct: '#22c55e',
  wrong: '#ef4444',
  revealed: '#f59e0b',
  partial: '#facc15',
  missed: '#ef4444',
};

const getFeatureId = (country: CountryFeature) => {
  if (country.id === null || country.id === undefined) {
    return `name:${country.properties?.name ?? 'unknown'}`;
  }

  return String(country.id).padStart(3, '0');
};

const getCountryFill = (
  id: string,
  isActive: boolean,
  status: CountryStatus | undefined,
  selectedCountryId?: string | null,
) => {
  if (status) {
    return statusFill[status];
  }

  if (selectedCountryId === id) {
    return '#38bdf8';
  }

  return isActive ? '#64748b' : '#1e293b';
};

const makeCollection = (features: CountryFeature[]): FeatureCollection<Geometry> => ({
  type: 'FeatureCollection',
  features,
});

const useElementSize = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 960, height: 560 });

  useEffect(() => {
    if (!ref.current) {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({
        width: Math.max(width, 320),
        height: Math.max(height, 240),
      });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
};

export const CountryThumbnail = ({
  feature: countryFeature,
}: {
  feature: CountryFeature | null;
}) => {
  const path = useMemo(() => {
    if (!countryFeature) {
      return '';
    }

    const projection = d3.geoMercator();
    projection.fitExtent(
      [
        [10, 10],
        [150, 90],
      ],
      countryFeature,
    );
    return d3.geoPath(projection)(countryFeature) ?? '';
  }, [countryFeature]);

  return (
    <svg viewBox="0 0 160 100" className="h-24 w-full rounded-xl bg-slate-950/60">
      {path ? (
        <path d={path} fill="#38bdf8" stroke="#e0f2fe" strokeWidth={1.5} />
      ) : (
        <text x="80" y="55" textAnchor="middle" fill="#94a3b8" fontSize="12">
          Select a country
        </text>
      )}
    </svg>
  );
};

export default function Map({
  activeIds,
  countryStatuses,
  currentCountryId,
  mode,
  onCountryClick,
  onFeaturesLoaded,
  selectedCountryId,
}: MapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { ref: wrapperRef, size } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    let cancelled = false;

    fetch(ATLAS_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Map request failed: ${response.status}`);
        }
        return response.json() as Promise<AtlasTopology>;
      })
      .then((topology) => {
        const countries = feature(
          topology as never,
          topology.objects.countries as never,
        ) as unknown as FeatureCollection<Geometry, { name?: string }>;

        if (!cancelled) {
          const nextFeatures = countries.features as CountryFeature[];
          setFeatures(nextFeatures);
          onFeaturesLoaded(nextFeatures);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setLoadError(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onFeaturesLoaded]);

  const projection = useMemo(() => {
    const activeFeatures =
      activeIds.size > 0
        ? features.filter((country) => activeIds.has(getFeatureId(country)))
        : features;
    const projectionInstance = d3.geoNaturalEarth1();
    const fitFeatures = activeFeatures.length ? activeFeatures : features;

    if (fitFeatures.length) {
      projectionInstance.fitExtent(
        [
          [24, 24],
          [size.width - 24, size.height - 24],
        ],
        makeCollection(fitFeatures),
      );
    }

    return projectionInstance;
  }, [activeIds, features, size.height, size.width]);

  const countryPaths = useMemo(() => {
    const path = d3.geoPath(projection);
    return features.map((country) => ({
      country,
      id: getFeatureId(country),
      path: path(country) ?? '',
    }));
  }, [features, projection]);

  useEffect(() => {
    if (!svgRef.current || !groupRef.current) {
      return undefined;
    }

    const svg = d3.select(svgRef.current);
    const group = d3.select(groupRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [-size.width, -size.height],
        [size.width * 2, size.height * 2],
      ])
      .on('zoom', (event) => {
        group.attr('transform', event.transform.toString());
      });

    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity);

    return () => {
      svg.on('.zoom', null);
    };
  }, [activeIds, size.height, size.width]);

  return (
    <div ref={wrapperRef} className="relative h-full w-full overflow-hidden bg-slate-950">
      {loadError ? (
        <div className="absolute inset-0 grid place-items-center p-8 text-center text-red-200">
          Could not load world map: {loadError}
        </div>
      ) : null}
      <svg
        ref={svgRef}
        className="h-full w-full touch-none"
        role="img"
        aria-label="Interactive world map"
        viewBox={`0 0 ${size.width} ${size.height}`}
      >
        <rect width={size.width} height={size.height} fill="#020617" />
        <g ref={groupRef}>
          {countryPaths.map(({ country, id, path }) => {
            const metadata = COUNTRY_BY_ID.get(id);
            const isActive = activeIds.has(id);
            const isClickable =
              Boolean(metadata) &&
              isActive &&
              (mode === 'find' || countryStatuses[id] === undefined);
            const status = countryStatuses[id];
            const name = metadata?.name ?? country.properties?.name ?? id;

            return (
              <path
                key={`${id}-${name}`}
                className="country-path outline-none"
                d={path}
                fill={getCountryFill(id, isActive, status, selectedCountryId)}
                stroke="#f8fafc"
                strokeOpacity={isActive ? 0.75 : 0.22}
                strokeWidth={currentCountryId === id || selectedCountryId === id ? 1.15 : 0.55}
                opacity={isActive ? 1 : 0.36}
                role={isClickable ? 'button' : 'img'}
                tabIndex={isClickable ? 0 : -1}
                aria-label={name}
                onClick={() => {
                  if (isClickable) {
                    onCountryClick(id);
                  }
                }}
                onKeyDown={(event) => {
                  if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onCountryClick(id);
                  }
                }}
              />
            );
          })}
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs text-slate-300 shadow-lg backdrop-blur">
        Scroll to zoom. Drag to pan.
      </div>
    </div>
  );
}
