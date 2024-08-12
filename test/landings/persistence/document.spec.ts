import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { CatchCertModel, CatchCertificate, CatchCertificateModel, IDocumentLandingQuery } from "../../../src/types";
import { getCatchCertificate, getCatchCertificates } from "../../../src/landings/persistence/document";
import { DocumentStatuses } from "mmo-shared-reference-data";

describe('MongoMemoryServer - Fetching catch certificates', () => {

  let mongoServer: MongoMemoryServer;
  const opts = {}

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, opts).catch(err => { console.log(err) });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await CatchCertificateModel.deleteMany({});
  });

  describe('when querying the exportCertificates collection for multiple documents', () => {
    it('wont return certs with a status other than COMPLETE', async () => {

      const catchCert = new CatchCertificateModel({
        status: "DRAFT",
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
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
        }
      });
      await catchCert.save();
      const landings: IDocumentLandingQuery = {
        pln: "WA1",
        dateLanded: "2019-07-10"
      };
      const res = await getCatchCertificates(landings);
      expect(res).toHaveLength(0);
  
    });
  
    it('no results for empty no matching landings', async () => {
  
      const catchCert = new CatchCertificateModel({
        status: "COMPLETE",
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
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
        }
      });
      await catchCert.save();
  
      const res = await getCatchCertificates(undefined);
  
      expect(res).toHaveLength(0);
  
    });
  
    it('no results for no matching landings', async () => {
  
      const catchCert = new CatchCertificateModel({
        status: "COMPLETE",
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
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
        }
      });
      await catchCert.save();
      const landings: IDocumentLandingQuery = {
        pln: 'WA2',
        dateLanded: '2019-07-10'
      };
      const res = await getCatchCertificates(landings);
  
      expect(res).toHaveLength(0);
  
    });
  
    it('single catch cert single landing', async () => {
  
      const catchCert = new CatchCertificateModel({
        status: "COMPLETE",
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId:  "CC1-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC1-1", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 }
              ]
            }
          ]
        }
      });
      await catchCert.save()
  
      const expected: CatchCertificate[] = [
        {
          documentNumber: 'CC1',
          status: 'COMPLETE',
          createdAt: new Date('2019-07-10T08:26:06.939Z'),
          createdBy: 'Bob',
          createdByEmail: 'foo@foo.com',
          audit: [],
          exportData: { 
            products: [
              {
                speciesId:  "CC1-1-LBE",
                speciesCode: "LBE",
                caughtBy: [
                  { id: "CC1-1", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100, numberOfSubmissions: 0 }
                ]
              }
            ]
          }
        }
      ];
  
      const landings: IDocumentLandingQuery = { pln: 'WA1', dateLanded: '2019-07-10' };
      const res = await getCatchCertificates(landings);
  
      expect(res).toHaveLength(1);
      expect(res).toStrictEqual(expected);
    });
  
    it('multiple catch certs', async () => {
  
      let catchCert: CatchCertModel; 
  
      catchCert = new CatchCertificateModel({
        status: "COMPLETE",
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId:  "CC1-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC1-1", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 }
              ]
            }
          ]
        }
      })
      await catchCert.save()
  
      catchCert = new CatchCertificateModel({
        status: "COMPLETE",
        __t: "catchCert",
        documentNumber: "CC2",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId:  "CC2-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC2-1", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 }
              ]
            }
          ]
        }
      })
      await catchCert.save()
  
      const landings: IDocumentLandingQuery = { pln: 'WA1', dateLanded: '2019-07-10' };
      const res = await getCatchCertificates(landings);
  
      expect(res).toHaveLength(2);
  
    });
  
    it('multiple catch certs multiple landings', async () => {
  
      let catchCert: CatchCertModel;
  
      catchCert = new CatchCertificateModel({
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId:  "CC1-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC1-1", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100 },
                { id: "CC1-2", vessel: "DAYBREAK", pln: "WA2", date: '2019-07-10', weight: 100 },
              ]
            },
            {
              speciesId:  "CC1-2-BOB",
              speciesCode: "BOB",
              caughtBy: [
                { id: "CC1-3", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100 },
                { id: "CC1-4", vessel: "DAYBREAK", pln: "WA2", date: '2019-07-10', weight: 100 },
              ]
            },
          ],
        }
      })
      await catchCert.save()
  
      catchCert = new CatchCertificateModel({
        __t: "catchCert",
        documentNumber: "CC2",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId:  "CC2-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC2-1", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100 },
                { id: "CC2-2", vessel: "DAYBREAK", pln: "WA3", date: '2019-07-10', weight: 100 },
              ]
            },
            {
              speciesId:  "CC2-2-LBE",
              speciesCode: "BOB",
              caughtBy: [
                { id: "CC2-3", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-11', weight: 100 },
              ]
            },
          ],
        }
      })
      await catchCert.save()
  
      catchCert = new CatchCertificateModel({
        __t: "catchCert",
        documentNumber: "CC3",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId:  "CC3-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC3-1", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100 },
                { id: "CC3-2", vessel: "DAYBREAK", pln: "WA3", date: '2019-07-10', weight: 100 },
              ]
            },
            {
              speciesId:  "CC2-3-LBE",
              speciesCode: "BOB",
              caughtBy: [
                { id: "CC3-3", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100 },
              ]
            },
          ],
        }
      })
      await catchCert.save()
  
      const landings: IDocumentLandingQuery = { pln: 'WA1', dateLanded: '2019-07-10' }
      
      const res = await getCatchCertificates(landings)
  
      expect(res).toHaveLength(3)
  
    });
  
    it('multiple catch certs only one match', async () => {
  
      let catchCert: CatchCertModel;
  
      catchCert = new CatchCertificateModel({
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId: "CC1-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC1-1", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100 },
              ]
            },
          ],
        }
      })
      await catchCert.save()
  
      catchCert = new CatchCertificateModel({
        __t: "catchCert",
        documentNumber: "CC2",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId: "CC2-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC2-1", vessel: "DAYBREAK", pln: "WA2", date: '2019-07-10', weight: 100 },
              ]
            },
          ],
        }
      })
      await catchCert.save()
  
      const landings: IDocumentLandingQuery = { pln: 'WA1', dateLanded: '2019-07-10' };
      const res = await getCatchCertificates(landings)
  
      expect(res).toHaveLength(1);
  
    });

    it('multiple catch certs multiple with landings', async () => {
  
      let catchCert: CatchCertModel;
  
      catchCert = new CatchCertificateModel({
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId:  "CC1-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC1-1", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100 },
                { id: "CC1-2", vessel: "DAYBREAK", pln: "WA2", date: '2019-07-10', weight: 100 },
              ]
            },
            {
              speciesId:  "CC1-2-BOB",
              speciesCode: "BOB",
              caughtBy: [
                { id: "CC1-3", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100, _status: "PENDING_LANDING_DATA" },
                { id: "CC1-4", vessel: "DAYBREAK", pln: "WA2", date: '2019-07-10', weight: 100 },
              ]
            },
          ],
        }
      })
      await catchCert.save()
  
      catchCert = new CatchCertificateModel({
        __t: "catchCert",
        documentNumber: "CC2",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId:  "CC2-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC2-1", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100 },
                { id: "CC2-2", vessel: "DAYBREAK", pln: "WA3", date: '2019-07-10', weight: 100 },
              ]
            },
            {
              speciesId:  "CC2-2-LBE",
              speciesCode: "BOB",
              caughtBy: [
                { id: "CC2-3", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-11', weight: 100 },
              ]
            },
          ],
        }
      })
      await catchCert.save()
  
      catchCert = new CatchCertificateModel({
        __t: "catchCert",
        documentNumber: "CC3",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId:  "CC3-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC3-1", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100 },
                { id: "CC3-2", vessel: "DAYBREAK", pln: "WA3", date: '2019-07-10', weight: 100 },
              ]
            },
            {
              speciesId:  "CC2-3-LBE",
              speciesCode: "BOB",
              caughtBy: [
                { id: "CC3-3", vessel: "DAYBREAK", pln: "WA1", date: '2019-07-10', weight: 100, _status: "PENDING_LANDING_DATA" },
              ]
            },
          ],
        }
      })
      await catchCert.save()
  
      const landings: IDocumentLandingQuery = { pln: 'WA1', dateLanded: '2019-07-10' }
      
      const res = await getCatchCertificates(landings)
  
      expect(res).toHaveLength(3)
  
    })
  });

  describe('when querying the exportCertificates collection for a single document', () => {
    it('will return a single COMPLETE document with the document number CC1', async () => {
      const catchCert = new CatchCertificateModel({
        status: "COMPLETE",
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
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
        }
      });
      await catchCert.save();

      const document: CatchCertificate | null = await getCatchCertificate('CC1', DocumentStatuses.Complete);

      expect(document).not.toBeNull();
      expect(document?.documentNumber).toBe("CC1");
      expect(document?.status).toBe("COMPLETE");
    });

    it('will return null when CC1 is in DRAFT', async () => {
      const catchCert = new CatchCertificateModel({
        status: "DRAFT",
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
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
        }
      });
      await catchCert.save();

      const document: CatchCertificate | null = await getCatchCertificate('CC1', DocumentStatuses.Complete);

      expect(document).toBeNull();
    });

    it('will return a single VOID document with the document number CC1', async () => {
      const catchCert = new CatchCertificateModel({
        status: "VOID",
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
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
        }
      });
      await catchCert.save();

      const document: CatchCertificate | null = await getCatchCertificate('CC1', DocumentStatuses.Void);

      expect(document).not.toBeNull();
      expect(document?.documentNumber).toBe("CC1");
      expect(document?.status).toBe("VOID");
    });

    it('will return a single COMPLETE document with a collection of multiple COMPLETE documents', async () => {
      let catchCert = new CatchCertificateModel({
        status: "COMPLETE",
        __t: "catchCert",
        documentNumber: "CC1",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
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
        }
      });
      
      await catchCert.save();

      catchCert = new CatchCertificateModel({
        status: "COMPLETE",
        __t: "catchCert",
        documentNumber: "CC2",
        createdAt: "2019-07-10T08:26:06.939Z",
        createdBy: "Bob",
        createdByEmail: "foo@foo.com",
        exportData: {
          products: [
            {
              speciesId:  "CC1-1-LBE",
              speciesCode: "LBE",
              caughtBy: [
                { id: "CC2-1", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-10", weight: 100 },
                { id: "CC2-2", vessel: "DAYBREAK", pln: "WA1", date: "2019-07-11", weight: 100 }
              ]
            }
          ]
        }
      });

      await catchCert.save();

      const document: CatchCertificate | null = await getCatchCertificate('CC1', DocumentStatuses.Complete);

      expect(document).not.toBeNull();
      expect(document?.documentNumber).toBe("CC1");
      expect(document?.status).toBe("COMPLETE");
    });
  });

});