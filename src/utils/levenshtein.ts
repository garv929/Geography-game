export const normalizeAnswer = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

export const levenshtein = (a: string, b: string) => {
  const left = normalizeAnswer(a);
  const right = normalizeAnswer(b);

  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost,
      );
    }

    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
};

export type NameScore = {
  points: number;
  label: string;
  quality: 'perfect' | 'partial' | 'missed';
  distance: number;
};

export const scoreCountryName = (answer: string, acceptedNames: string[]): NameScore => {
  const distances = acceptedNames.map((name) => levenshtein(answer, name));
  const distance = Math.min(...distances);

  if (distance === 0) {
    return { points: 3, label: 'Perfect!', quality: 'perfect', distance };
  }

  if (distance <= 2) {
    return { points: 2, label: 'Close enough!', quality: 'partial', distance };
  }

  if (distance <= 4) {
    return { points: 1, label: 'Almost!', quality: 'partial', distance };
  }

  return { points: 0, label: 'Missed', quality: 'missed', distance };
};
