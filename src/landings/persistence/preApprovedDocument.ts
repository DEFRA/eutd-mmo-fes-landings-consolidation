import { PreApprovedDocumentModel } from "../../types";
import logger from "../../logger";

export const isDocumentPreApproved = async (documentNumber: string) => {
  if (!documentNumber) return false;

  const preApprovedDocument = await PreApprovedDocumentModel.findOne(
    { documentNumber, certificateData: { $nin: [null, ''] } },
    { documentNumber: 1, _id: 0 },
    { lean: true }
  );

  if (preApprovedDocument) {
    logger.info(`[LANDINGS-CONSOLIDATION][PREAPPROVAL-CHECK][${documentNumber}][true]`);
    return true;
  } else {
    logger.info(`[LANDINGS-CONSOLIDATION][PREAPPROVAL-CHECK][${documentNumber}][NOT-FOUND]`);
    return false;
  }
};

// FI0-11132: batch lookup all pre-approval statuses in a single query instead of N+1
export const getPreApprovedDocumentsMap = async (documentNumbers: string[]): Promise<Map<string, boolean>> => {
  const uniqueNumbers = [...new Set(documentNumbers.filter(Boolean))];
  const result = new Map<string, boolean>();

  if (uniqueNumbers.length === 0) return result;

  // certificateData holds the full serialised certificate; only its presence is needed, so filter
  // in the database and project documentNumber alone to avoid pulling every payload into memory
  const preApprovedDocuments = await PreApprovedDocumentModel.find(
    { documentNumber: { $in: uniqueNumbers }, certificateData: { $nin: [null, ''] } },
    { documentNumber: 1, _id: 0 },
    { lean: true }
  );

  const preApprovedNumbers = new Set<string>(preApprovedDocuments.map((doc: any) => doc.documentNumber));

  for (const docNum of uniqueNumbers) {
    const isPreApproved = preApprovedNumbers.has(docNum);
    result.set(docNum, isPreApproved);
    logger.info(`[LANDINGS-CONSOLIDATION][PREAPPROVAL-CHECK-BATCH][${docNum}][${isPreApproved}]`);
  }

  return result;
};