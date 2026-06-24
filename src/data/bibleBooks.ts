// 66 books, Protestant order. `n` is the book index bolls.life uses (1–66).
// `chapters` bounds the chapter selector; verse counts vary, validated on fetch.
export type BibleBook = { n: number; name: string; chapters: number }

export const BIBLE_BOOKS: BibleBook[] = [
  { n: 1,  name: 'Génesis',          chapters: 50 },
  { n: 2,  name: 'Éxodo',            chapters: 40 },
  { n: 3,  name: 'Levítico',         chapters: 27 },
  { n: 4,  name: 'Números',          chapters: 36 },
  { n: 5,  name: 'Deuteronomio',     chapters: 34 },
  { n: 6,  name: 'Josué',            chapters: 24 },
  { n: 7,  name: 'Jueces',           chapters: 21 },
  { n: 8,  name: 'Rut',              chapters: 4  },
  { n: 9,  name: '1 Samuel',         chapters: 31 },
  { n: 10, name: '2 Samuel',         chapters: 24 },
  { n: 11, name: '1 Reyes',          chapters: 22 },
  { n: 12, name: '2 Reyes',          chapters: 25 },
  { n: 13, name: '1 Crónicas',       chapters: 29 },
  { n: 14, name: '2 Crónicas',       chapters: 36 },
  { n: 15, name: 'Esdras',           chapters: 10 },
  { n: 16, name: 'Nehemías',         chapters: 13 },
  { n: 17, name: 'Ester',            chapters: 10 },
  { n: 18, name: 'Job',              chapters: 42 },
  { n: 19, name: 'Salmos',           chapters: 150 },
  { n: 20, name: 'Proverbios',       chapters: 31 },
  { n: 21, name: 'Eclesiastés',      chapters: 12 },
  { n: 22, name: 'Cantares',         chapters: 8  },
  { n: 23, name: 'Isaías',           chapters: 66 },
  { n: 24, name: 'Jeremías',         chapters: 52 },
  { n: 25, name: 'Lamentaciones',    chapters: 5  },
  { n: 26, name: 'Ezequiel',         chapters: 48 },
  { n: 27, name: 'Daniel',           chapters: 12 },
  { n: 28, name: 'Oseas',            chapters: 14 },
  { n: 29, name: 'Joel',             chapters: 3  },
  { n: 30, name: 'Amós',             chapters: 9  },
  { n: 31, name: 'Abdías',           chapters: 1  },
  { n: 32, name: 'Jonás',            chapters: 4  },
  { n: 33, name: 'Miqueas',          chapters: 7  },
  { n: 34, name: 'Nahúm',            chapters: 3  },
  { n: 35, name: 'Habacuc',          chapters: 3  },
  { n: 36, name: 'Sofonías',         chapters: 3  },
  { n: 37, name: 'Hageo',            chapters: 2  },
  { n: 38, name: 'Zacarías',         chapters: 14 },
  { n: 39, name: 'Malaquías',        chapters: 4  },
  { n: 40, name: 'Mateo',            chapters: 28 },
  { n: 41, name: 'Marcos',           chapters: 16 },
  { n: 42, name: 'Lucas',            chapters: 24 },
  { n: 43, name: 'Juan',             chapters: 21 },
  { n: 44, name: 'Hechos',           chapters: 28 },
  { n: 45, name: 'Romanos',          chapters: 16 },
  { n: 46, name: '1 Corintios',      chapters: 16 },
  { n: 47, name: '2 Corintios',      chapters: 13 },
  { n: 48, name: 'Gálatas',          chapters: 6  },
  { n: 49, name: 'Efesios',          chapters: 6  },
  { n: 50, name: 'Filipenses',       chapters: 4  },
  { n: 51, name: 'Colosenses',       chapters: 4  },
  { n: 52, name: '1 Tesalonicenses', chapters: 5  },
  { n: 53, name: '2 Tesalonicenses', chapters: 3  },
  { n: 54, name: '1 Timoteo',        chapters: 6  },
  { n: 55, name: '2 Timoteo',        chapters: 4  },
  { n: 56, name: 'Tito',             chapters: 3  },
  { n: 57, name: 'Filemón',          chapters: 1  },
  { n: 58, name: 'Hebreos',          chapters: 13 },
  { n: 59, name: 'Santiago',         chapters: 5  },
  { n: 60, name: '1 Pedro',          chapters: 5  },
  { n: 61, name: '2 Pedro',          chapters: 3  },
  { n: 62, name: '1 Juan',           chapters: 5  },
  { n: 63, name: '2 Juan',           chapters: 1  },
  { n: 64, name: '3 Juan',           chapters: 1  },
  { n: 65, name: 'Judas',            chapters: 1  },
  { n: 66, name: 'Apocalipsis',      chapters: 22 },
]

const RV1960 = 'RV1960'

export type FetchedVerse = { reference: string; text: string }

/** Fetch verse count for a chapter from bolls.life. */
export async function fetchVerseCount(book: BibleBook, chapter: number): Promise<number> {
  try {
    const res = await fetch(`https://bolls.life/get-text/${RV1960}/${book.n}/${chapter}/`)
    if (!res.ok) return 30
    const data = await res.json() as { verse: number }[]
    return data.length || 30
  } catch {
    return 30
  }
}

/** Fetch a single verse (RVR1960) from bolls.life. Returns null if not found. */
export async function fetchVerse(book: BibleBook, chapter: number, verse: number): Promise<FetchedVerse | null> {
  const url = `https://bolls.life/get-verse/${RV1960}/${book.n}/${chapter}/${verse}/`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as { text?: string }
    const text = (data.text || '').replace(/<[^>]*>/g, '').trim() // strip any HTML tags
    if (!text) return null
    return { reference: `${book.name} ${chapter}:${verse}`, text }
  } catch {
    return null
  }
}
