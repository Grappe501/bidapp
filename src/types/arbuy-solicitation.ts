/** Official ARBuy solicitation record — header, attachments, and quote lines (UNSPSC). */

export type ArbuyAttachmentCategory =
  | "rfp"
  | "technical_packet"
  | "price_sheet"
  | "disclosure"
  | "contract_sample"
  | "other";

export interface ArbuySolicitationHeader {
  solicitationNumber: string;
  description: string;
  bidOpeningDate: string;
  purchaser: string;
  organization: string;
  department: string;
  fiscalYear: string;
  typeCode: string;
  allowElectronicQuote: boolean;
  bidType: string;
  purchaseMethod: string;
  requiredDate?: string;
  availableDate?: string;
  infoContact?: {
    name: string;
    phone?: string;
    email?: string;
  };
  shipTo?: string[];
  billTo?: string[];
}

export interface ArbuySolicitationAttachment {
  name: string;
  required: boolean;
  category: ArbuyAttachmentCategory;
}

export interface ArbuySolicitationItem {
  itemNumber: number;
  unspscCode: string;
  description: string;
  quantity: number;
}

export interface ArbuySolicitationModel {
  header: ArbuySolicitationHeader;
  attachments: ArbuySolicitationAttachment[];
  items: ArbuySolicitationItem[];
}

/** Client + gate — ARBuy completeness vs uploads and pricing (no invented unit costs). */
export type ArbuySolicitationCompliance = {
  applicable: boolean;
  metadataLoaded: boolean;
  submissionMethodKnown: boolean;
  attachmentsComplete: boolean;
  missingAttachments: string[];
  quoteLineCount: number;
  pricingLineCount: number;
  /** True when workbook line count matches official ARBuy quote line count. */
  quoteStructureCountAligned: boolean;
  priceSheetDocumentPresent: boolean;
  pricingSupportPresent: boolean;
  ready: boolean;
  issues: string[];
};
