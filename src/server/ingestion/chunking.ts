import { sha256 } from './checksum';
import type { ChunkRow } from './types';
import { getServerEnv } from '../env';

const splitByWords = (text: string) => text.split(/\s+/).filter(Boolean);

export const buildChunks = (pageMap: Array<{ pageNumber: number; text: string }>): ChunkRow[] => {
  const env = getServerEnv();
  const allChunks: ChunkRow[] = [];
  let chunkIndex = 0;

  for (const page of pageMap) {
    const words = splitByWords(page.text);
    if (words.length === 0) {
      continue;
    }

    const size = env.CHUNK_SIZE_WORDS;
    const overlap = env.CHUNK_OVERLAP_WORDS;
    const step = Math.max(1, size - overlap);

    for (let i = 0; i < words.length; i += step) {
      const content = words.slice(i, i + size).join(' ').trim();
      if (!content) {
        continue;
      }

      allChunks.push({
        chunkIndex,
        pageNumber: page.pageNumber,
        sectionRef: null,
        content,
        checksum: sha256(content)
      });
      chunkIndex += 1;

      if (i + size >= words.length) {
        break;
      }
    }
  }

  return allChunks;
};
