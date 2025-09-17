import { suggestionRepo } from "@/repositories/suggestion.repository";
import { SuggestedProduct } from "@/types/suggestedProduct";

export const suggestionService = {
  async suggestProducts(
    distributorId: string,
    clientId: string,
    asOf: Date = new Date(),
    top: number,
  ): Promise<SuggestedProduct[]> {
    // Ensure tenant isolation
    if (!distributorId) {
      throw new Error("DistributorId is required for suggestion operations");
    }
    if (!clientId) {
      throw new Error("ClientId is required for suggestion operations");
    }

    return await suggestionRepo.getSuggestedProducts(
      clientId,
      distributorId,
      asOf,
      top,
    );
  },
};
