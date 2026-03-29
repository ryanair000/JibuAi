import { getActiveFaqsForMerchant } from '../repositories/faqRepo';

type FaqMatch = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  score: number;
};

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string): string[] =>
  normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 1);

const scoreQuestion = (query: string, candidate: string): number => {
  const normalizedQuery = normalizeText(query);
  const normalizedCandidate = normalizeText(candidate);

  if (!normalizedQuery || !normalizedCandidate) {
    return 0;
  }

  if (normalizedQuery === normalizedCandidate) {
    return 1;
  }

  if (
    normalizedCandidate.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedCandidate)
  ) {
    return 0.92;
  }

  const queryTokens = tokenize(query);
  const candidateTokens = tokenize(candidate);
  const querySet = new Set(queryTokens);
  const candidateSet = new Set(candidateTokens);
  const overlap = queryTokens.filter((token) => candidateSet.has(token)).length;

  if (overlap === 0) {
    return 0;
  }

  const precision = overlap / Math.max(querySet.size, 1);
  const recall = overlap / Math.max(candidateSet.size, 1);
  const score = (precision * 0.75) + (recall * 0.25);

  if (overlap >= 2) {
    return Math.min(score + 0.1, 0.9);
  }

  return score;
};

export const findFaqMatch = async (
  merchantId: string,
  messageText: string,
): Promise<FaqMatch | null> => {
  const faqs = await getActiveFaqsForMerchant(merchantId);
  let bestMatch: FaqMatch | null = null;

  for (const faq of faqs) {
    const score = scoreQuestion(messageText, faq.question);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        score,
      };
    }
  }

  if (!bestMatch) {
    return null;
  }

  return bestMatch.score >= 0.55 ? bestMatch : null;
};
