import { isWithinRetrospectivePeriod } from "../../../src/landings/query/isWithinRetrospectivePeriod";
import { ICatchCertificateLanding } from "../../../src/types";

describe('when calculating if a landing is within it\'s retrospective period', () => {

  let mockCurrentTime: jest.SpyInstance;

  beforeEach(() => {
    mockCurrentTime = jest.spyOn(Date, 'now').mockImplementation(() => 1697112000000); // 2023-10-1212:00:00.000Z
  });

  afterEach(() => {
    mockCurrentTime.mockRestore();
  });

  it('will return false for a landing outside it\'s retrospective period and enddate is in the future', () => {
    const landings: ICatchCertificateLanding[] = [{
      landingId: "CC1-1",
      documentNumber: "CC1",
      weight: 51,
      dataEverExpected: true,
      landingDataExpectedDate: "2023-10-15",
      landingDataEndDate: "2023-10-15"
    }];
    
    const result = isWithinRetrospectivePeriod(landings);
    expect(result).toBe(false);
  })

  it('will return true if one of the landings are within it\' retrospective period', () => {
    const landings: ICatchCertificateLanding[] = [{
      landingId: "CC1-1",
      documentNumber: "CC1",
      weight: 51,
      dataEverExpected: true,
      landingDataExpectedDate: "2023-10-15",
      landingDataEndDate: "2023-10-15"
    },{
      landingId: "CC1-2",
      documentNumber: "CC1",
      weight: 51,
      dataEverExpected: true,
      landingDataExpectedDate: "2023-10-12",
      landingDataEndDate: "2023-10-15"
    }];

    const result = isWithinRetrospectivePeriod(landings);
    expect(result).toBe(true);
  })

  it('will return true for a landing within it\'s retrospective period when currentdate is enddate+1', () => {
    const landings: ICatchCertificateLanding[] = [{
      landingId: "CC1-1",
      documentNumber: "CC1",
      weight: 51,
      dataEverExpected: true,
      landingDataExpectedDate: "2023-10-10",
      landingDataEndDate: "2023-10-11"
    }];
    
    const result = isWithinRetrospectivePeriod(landings);
    expect(result).toBe(true);
  })

  it('will return false for a landing outside it\'s retrospective period and enddate is in the past', () => {
    const landings: ICatchCertificateLanding[] = [{
      landingId: "CC1-1",
      documentNumber: "CC1",
      weight: 51,
      dataEverExpected: true,
      landingDataExpectedDate: "2023-10-10",
      landingDataEndDate: "2023-10-10"
    }];
    
    const result = isWithinRetrospectivePeriod(landings);
    expect(result).toBe(false);
  })
});