import { FilterQuery } from "mongoose"
import { DocumentStatuses } from "mmo-shared-reference-data"
import { CatchCertificate, CatchCertificateModel, IDocumentLandingQuery } from "../../types"
import logger from "../../logger"

export const getCatchCertificates = async (landing: IDocumentLandingQuery): Promise<CatchCertificate[]> => {
  const query: FilterQuery<any> = {
    __t: 'catchCert',
    createdAt: { $type: 9 },
    'exportData.products': { $exists: true },
    $or: [{ 'status': { $exists: false } }, { 'status': DocumentStatuses.Complete }]
  }

  if (!landing) return [];

  const landingsClause = {
    $elemMatch: {
      pln: landing.pln,
      date: landing.dateLanded,
    }
  }

  query['exportData.products.caughtBy'] = landingsClause

  logger.info(`[LANDINGS-CONSOLIDATION][GET-ALL-CATCH-CERTS][QUERY]${JSON.stringify(query)}`)

  return await CatchCertificateModel
    .find(query, null, { timeout: true, lean: true })
    .select(['-_id', '-__v', '-__t'])
    .lean();
}

export const getCatchCertificate = async (documentNumber: string, status: "COMPLETE" | "VOID"): Promise<CatchCertificate | null> =>
  await CatchCertificateModel.findOne({ documentNumber, status })
    .select(['-_id', '-__v', '-__t'])
    .lean();