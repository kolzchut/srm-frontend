import { forkJoin, map, Observable } from "rxjs";
import { ApiService } from "../api.service";
import { Card, SearchParams } from "../consts";

export type BranchCards = {cards: Card[], hidden: Card[]};
export type PointCards = {
  branches: BranchCards[],
  selectedCard: Card | null,
  cardBranch: BranchCards | null,
};

export function getPointCards(api: ApiService, pointId: string, cardId: string, searchParams: SearchParams | null): Observable<PointCards> {
  return forkJoin([
    api.getPoint(pointId, searchParams),
    api.getPoint(pointId),
  ]).pipe(
    map(([cards, allCards]) => {
      cards = cards.sort((a, b) => a.branch_id.localeCompare(b.branch_id));
      const branches: BranchCards[] = [];
      let selectedCard: Card | null = null;
      let cardBranch: BranchCards | null = null;

      let branch: BranchCards = {cards: [], hidden: []};
      for (const card of cards) {
        if (branch.cards.length === 0 || branch.cards[0].branch_id !== card.branch_id) {
          branch = {cards: [], hidden: []}
          branches.push(branch);
        }
        branch.cards.push(card);
      }
      for (const branch of branches) {
        const ids = branch.cards.map(c => c.card_id);
        if (ids.length > 0) {
          branch.hidden = allCards.filter(c => {
            return !ids.includes(c.card_id) && c.branch_id === branch.cards[0].branch_id;
          });
        }
        for (const card of [...branch.cards, ...branch.hidden]) {
          if (card.card_id === cardId) {
            cardBranch = branch;
            selectedCard = card;
          }
        }
      }
      return {branches, selectedCard, cardBranch};
    })
  );
}
  