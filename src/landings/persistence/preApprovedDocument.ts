import { PreApprovedDocumentModel } from "../../types";
import logger from "../../logger";

export const isDocumentPreApproved = async (documentNumber: string) => {
  if (!documentNumber) return false;

  const preApprovedDocument = await PreApprovedDocumentModel.findOne({ documentNumber }, null, { lean: true });

  if (preApprovedDocument && preApprovedDocument.certificateData) {
    const isPreApproved = !!preApprovedDocument.certificateData
    logger.info(`[LANDINGS-CONSOLIDATION][PREAPPROVAL-CHECK][${documentNumber}][${isPreApproved}]`);
    return isPreApproved;
  } else {
    logger.info(`[LANDINGS-CONSOLIDATION][PREAPPROVAL-CHECK][${documentNumber}][NOT-FOUND]`);
    return false;
  }
};