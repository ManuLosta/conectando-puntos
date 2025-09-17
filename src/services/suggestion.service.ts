import { suggestionRepo } from "@/repositories/suggestion.repository";
import { SuggestedProduct } from "@/types/suggestedProduct";

export const suggestionService = {
  async suggestProducts(
    distributorId: string,
    clientId: string,
    asOf: Date = new Date(),
    top: number,
  ): Promise<SuggestedProduct[]> {
    return await suggestionRepo.getSuggestedProducts(
      clientId,
      distributorId,
      asOf,
      top,
    );
  },
};
