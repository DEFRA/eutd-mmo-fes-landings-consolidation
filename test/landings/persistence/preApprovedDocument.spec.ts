import { connectTestMongo, disconnectTestMongo } from '../../helpers/mongoTestConnection';
import { DocumentStatuses } from "mmo-shared-reference-data";
import { isDocumentPreApproved } from '../../../src/landings/persistence/preApprovedDocument';
import { CatchCertificateModel, PreApprovedDocumentModel } from "../../../src/types";

const preApproveDocument = async (documentNumber: string, exportData: string, user: string) => {

  return await PreApprovedDocumentModel.findOneAndUpdate(
      {
          documentNumber: documentNumber,
      },
      { documentNumber, certificateData: exportData, preApprovedBy: user },
      { upsert: true, new: true }
  )
};

describe('Pre approved documents', () => {

  const testData = {
    documentNumber: "CC1",
    certificateData: { test: "test payload test" },
    preApprovedBy: "Bob"
  };

  beforeAll(async () => {
    await connectTestMongo();
  });

  afterAll(async () => {
    await disconnectTestMongo();
  });

  beforeEach(async () => {
    await PreApprovedDocumentModel.deleteMany({});
    await CatchCertificateModel.deleteMany({});
  });

  describe('When pre approving a certificate', () => {

    it('should return true exists as a preapproved document and its export data has not changed', async () => {
      const exportData = {
        products: [
          {
            speciesId:  "CC1-1-LBE",
            speciesCode: "LBE",
            caughtBy: [
              { id: "CC1-1", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
              { id: "CC1-2", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 }
            ]
          }
        ]
      };

      const catchCert = new CatchCertificateModel({
        status: DocumentStatuses.Draft,
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData
      });
      await catchCert.save();

      await preApproveDocument("CC1", JSON.stringify(exportData), "Bob");

      const result = await isDocumentPreApproved(testData.documentNumber);

      expect(result).toEqual(true);
    });

    it('should return false if does not exist as a preapproved document', async () => {
      const exportData = {
        products: [
          {
            speciesId:  "CC1-1-LBE",
            speciesCode: "LBE",
            caughtBy: [
              { id: "CC1-1", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
              { id: "CC1-2", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 }
            ]
          }
        ]
      };

      const catchCert = new CatchCertificateModel({
        status: DocumentStatuses.Draft,
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData
      });
      await catchCert.save();

      const result = await isDocumentPreApproved(testData.documentNumber);

      expect(result).toEqual(false);
    });

    it('should return false if the certificate does not have export data', async () => {
      const exportData = {
        products: [
          {
            speciesId: "CC1-1-LBE",
            speciesCode: "LBE",
            caughtBy: [
              { id: "CC1-1", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
              { id: "CC1-2", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 }
            ]
          }
        ]
      };

      const catchCert = new CatchCertificateModel({
        status: DocumentStatuses.Draft,
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData
      });
      await catchCert.save();

      const result = await isDocumentPreApproved(testData.documentNumber);

      expect(result).toEqual(false);
    });

    it('should return false if the document number is not defined', async () => {
      const result = await isDocumentPreApproved("");
      expect(result).toEqual(false);
    })
  });
});
