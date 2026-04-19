import type { ArbuySolicitationModel } from "../types/arbuy-solicitation";
import { S000000479_BID_NUMBER } from "./canonical-rfp-s000000479";

export { S000000479_BID_NUMBER };

/**
 * Canonical ARBuy solicitation header, attachment list, and quote lines for S000000479.
 * Descriptions for quote lines are limited to UNSPSC / line reference — no invented scope text.
 */
export const CANONICAL_ARBUY_S000000479: ArbuySolicitationModel = {
  header: {
    solicitationNumber: "S000000479",
    description: "Pharmacy Services for DHS HDCs",
    bidOpeningDate: "2026-05-04T15:00:00-05:00",
    purchaser: "Kimberly Haywood",
    organization: "Office of State Procurement",
    department: "AROSP - State Procurement",
    fiscalYear: "26",
    typeCode: "RP",
    allowElectronicQuote: true,
    bidType: "OPEN",
    purchaseMethod: "Open Market",
    requiredDate: "2026-07-01",
    availableDate: "2026-04-13T11:14:38-05:00",
  },
  attachments: [
    {
      name: "S000000479 RFP Pharmacy Services for DHS HDCs",
      required: true,
      category: "rfp",
    },
    {
      name: "S000000479 Technical Proposal Packet",
      required: true,
      category: "technical_packet",
    },
    {
      name: "S000000479 Official Solicitation Price Sheet DHS HDCs",
      required: true,
      category: "price_sheet",
    },
    {
      name: "S000000479 Contract and Grant Disclosure",
      required: true,
      category: "disclosure",
    },
    {
      name: "S000000479 Services-Contract-SRV-1-Sample",
      required: true,
      category: "contract_sample",
    },
  ],
  items: [
    {
      itemNumber: 1,
      unspscCode: "42-19-26-04-0000",
      description: "Quote line 1 (UNSPSC 42-19-26-04-0000)",
      quantity: 1.0,
    },
    {
      itemNumber: 3,
      unspscCode: "85-10-16-00-0000",
      description: "Quote line 3 (UNSPSC 85-10-16-00-0000)",
      quantity: 1.0,
    },
    {
      itemNumber: 5,
      unspscCode: "85-10-17-06-0000",
      description: "Quote line 5 (UNSPSC 85-10-17-06-0000)",
      quantity: 1.0,
    },
    {
      itemNumber: 6,
      unspscCode: "85-16-15-00-0000",
      description: "Quote line 6 (UNSPSC 85-16-15-00-0000)",
      quantity: 1.0,
    },
    {
      itemNumber: 7,
      unspscCode: "42-14-26-00-0000",
      description: "Quote line 7 (UNSPSC 42-14-26-00-0000)",
      quantity: 1.0,
    },
    {
      itemNumber: 8,
      unspscCode: "85-10-16-00-0000",
      description: "Quote line 8 (UNSPSC 85-10-16-00-0000)",
      quantity: 1.0,
    },
    {
      itemNumber: 9,
      unspscCode: "51-28-15-00-0000",
      description: "Quote line 9 (UNSPSC 51-28-15-00-0000)",
      quantity: 1.0,
    },
    {
      itemNumber: 10,
      unspscCode: "85-10-16-03-0000",
      description: "Quote line 10 (UNSPSC 85-10-16-03-0000)",
      quantity: 1.0,
    },
  ],
};

export function getCanonicalArbuyModel(
  bidNumber: string,
): ArbuySolicitationModel | null {
  if (bidNumber === S000000479_BID_NUMBER) {
    return CANONICAL_ARBUY_S000000479;
  }
  return null;
}
