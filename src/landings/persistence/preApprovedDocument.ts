import { PreApprovedDocumentModel } from "../../types";
import logger from "../../logger";

export const isDocumentPreApproved = async (documentNumber: string) => {
  if (!documentNumber) return false;

  const preApprovedDocument = await PreApprovedDocumentModel.findOne({ documentNumber }, null, { lean: true });

  if (preApprovedDocument?.certificateData) {
    const isPreApproved = !!preApprovedDocument.certificateData
    logger.info(`[LANDINGS-CONSOLIDATION][PREAPPROVAL-CHECK][${documentNumber}][${isPreApproved}]`);
    return isPreApproved;
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

  const preApprovedDocuments = await PreApprovedDocumentModel.find(
    { documentNumber: { $in: uniqueNumbers } },
    null,
    { lean: true }
  );

  for (const docNum of uniqueNumbers) {
    const match = preApprovedDocuments.find((doc: any) => doc.documentNumber === docNum);
    const isPreApproved = !!(match?.certificateData);
    result.set(docNum, isPreApproved);
    logger.info(`[LANDINGS-CONSOLIDATION][PREAPPROVAL-CHECK-BATCH][${docNum}][${isPreApproved}]`);
  }

  return result;
};