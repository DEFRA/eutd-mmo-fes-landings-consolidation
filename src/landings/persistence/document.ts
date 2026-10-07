import { QueryFilter } from "mongoose"
import { DocumentStatuses } from "mmo-shared-reference-data"
import { CatchCertificate, CatchCertificateModel, IDocumentLandingQuery, ProjectedCatchCertificate } from "../../types"
import logger from "../../logger"

const catchCertificateProjection = [
  'documentNumber',
  'exportData.products.speciesCode',
  'exportData.products.factor',
  'exportData.products.caughtBy.id',
  'exportData.products.caughtBy.pln',
  'exportData.products.caughtBy.date',
  'exportData.products.caughtBy.weight',
  'exportData.products.caughtBy.dataEverExpected',
  'exportData.products.caughtBy.landingDataExpectedDate',
  'exportData.products.caughtBy.landingDataEndDate',
  'exportData.exporterDetails.accountId',
  'exportData.exporterDetails.contactId',
  '-_id'
];

export const getCatchCertificates = async (landing: IDocumentLandingQuery): Promise<ProjectedCatchCertificate[]> => {
   const query: QueryFilter<any> = {
    __t: 'catchCert',
    'status': DocumentStatuses.Complete,
    'exportData.products': { $exists: true },
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
    .select(catchCertificateProjection)
    .lean();
}

export const getCatchCertificate = async (documentNumber: string, status: "COMPLETE" | "VOID"): Promise<CatchCertificate | null> =>
  await CatchCertificateModel.findOne({ documentNumber, status })
    .select(['-_id', '-__v', '-__t'])
    .lean();