import { useEffect, useState } from "react";
import { api } from "./api";
import { TarotCardData } from "./TarotCard";

let deckCache: TarotCardData[] | null = null;
let deckPromise: Promise<TarotCardData[]> | null = null;

export async function loadDeck(): Promise<TarotCardData[]> {
  if (deckCache) return deckCache;
  if (!deckPromise) {
    deckPromise = api.tarotDeck().then((r) => {
      deckCache = r.cards as TarotCardData[];
      return deckCache;
    });
  }
  return deckPromise;
}

export function useDeck() {
  const [deck, setDeck] = useState<TarotCardData[] | null>(deckCache);
  useEffect(() => {
    if (!deck) {
      let cancelled = false;
      loadDeck().then((d) => {
        if (!cancelled) setDeck(d);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [deck]);
  return deck;
}

export function getCardById(deck: TarotCardData[] | null, id: string): TarotCardData | null {
  if (!deck) return null;
  return deck.find((c) => c.id === id) || null;
}
