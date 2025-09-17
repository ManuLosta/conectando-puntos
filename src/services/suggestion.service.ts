import { userRepo } from "@/repositories/user.repository";
import { SuggestedProduct } from "@/types/suggestedProduct";

export const suggestionService = {
  async suggestProducts(
    distributorId: string,
    clientId: string,
    asOf: Date = new Date(),
    top: number,
  ): Promise<SuggestedProduct[]> {
    return await userRepo.getSuggestedProducts(
      clientId,
      distributorId,
      asOf,
      top,
    );
  },
};
