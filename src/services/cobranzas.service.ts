import { cobranzasRepo } from "@/repositories/cobranzas.repository";
import type {
  CobranzasMetrics,
  FacturaCobranza,
} from "@/repositories/cobranzas.repository";

export interface CobranzasService {
  getCobranzasMetrics(distributorId: string): Promise<CobranzasMetrics>;
  getFacturasCobranza(distributorId: string): Promise<FacturaCobranza[]>;
}

class CobranzasServiceImpl implements CobranzasService {
  async getCobranzasMetrics(distributorId: string): Promise<CobranzasMetrics> {
    return cobranzasRepo.getCobranzasMetrics(distributorId);
  }

  async getFacturasCobranza(distributorId: string): Promise<FacturaCobranza[]> {
    return cobranzasRepo.getFacturasCobranza(distributorId);
  }
}

export const cobranzasService = new CobranzasServiceImpl();

// Re-export types for convenience
export type { CobranzasMetrics, FacturaCobranza };
