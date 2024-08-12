import * as Hapi from '@hapi/hapi';
import * as ConsolidateLandings from '../../src/services/consolidateLanding.service';
import * as Cache from '../../src/data/cache';
import logger from '../../src/logger';

describe('routes', () => {
  let server: Hapi.Server<Hapi.ServerApplicationState>;
  let mockRunConsolidateLandings: jest.SpyInstance;
  let mockUpdateConsolidateLandings: jest.SpyInstance;
  let mockVoidConsolidateLandings: jest.SpyInstance;
  let mockGetLandingRefresh: jest.SpyInstance;
  let mockLandingsConsolidateJob: jest.SpyInstance;
  let mockLoadFishCountriesAndSpecies: jest.SpyInstance;
  let mockLoadExporterBehaviour: jest.SpyInstance;
  let mockLoggerInfo: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;

  const mockTrackEvent = jest.fn();

  beforeAll(async () => {
    jest.mock('applicationinsights', () => {
      return {
        defaultClient: {
          trackEvent: mockTrackEvent,
        },
      };
    });

    const { jobsRoutes } = require('../../src/handler/jobs');

    server = Hapi.server({
      port: 9018,
      host: 'localhost',
    });

    jobsRoutes(server);

    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    mockRunConsolidateLandings = jest.spyOn(ConsolidateLandings, 'runLandingsConsolidationJob');
    mockRunConsolidateLandings.mockResolvedValue(undefined);

    mockUpdateConsolidateLandings = jest.spyOn(ConsolidateLandings, 'updateConsolidateLandings');
    mockUpdateConsolidateLandings.mockResolvedValue(undefined);

    mockVoidConsolidateLandings = jest.spyOn(ConsolidateLandings, 'voidConsolidateLandings');
    mockVoidConsolidateLandings.mockResolvedValue(undefined);

    mockLandingsConsolidateJob = jest.spyOn(ConsolidateLandings, 'startLandingsConsolidationJob');
    mockLandingsConsolidateJob.mockResolvedValue(undefined);

    mockGetLandingRefresh = jest.spyOn(ConsolidateLandings, 'getLandingsRefresh');
    mockGetLandingRefresh.mockResolvedValue([{ rssNumber: 'rssWA1', dateLanded: '2020-01-01' }]);

    mockLoadFishCountriesAndSpecies = jest.spyOn(Cache, 'loadFishCountriesAndSpecies');
    mockLoadFishCountriesAndSpecies.mockResolvedValue(undefined);

    mockLoadExporterBehaviour = jest.spyOn(Cache, 'loadExporterBehaviour');
    mockLoadExporterBehaviour.mockResolvedValue(undefined);
    
    mockLoggerInfo = jest.spyOn(logger, 'info');
    mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockRunConsolidateLandings.mockRestore();
    mockUpdateConsolidateLandings.mockRestore();
    mockVoidConsolidateLandings.mockRestore();
    mockLandingsConsolidateJob.mockRestore();
    mockGetLandingRefresh.mockRestore();
    mockLoadFishCountriesAndSpecies.mockRestore();
    mockLoadExporterBehaviour.mockRestore();
    mockLoggerInfo.mockRestore();
    mockLoggerError.mockRestore();
    mockTrackEvent.mockReset();
  });

  it('will always return a status of 200 to acknowledge the request', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/consolidate',
      payload: {
        startDate: '2023-10-09',
        endDate: "2023-10-10",
      }
    };

    const response = await server.inject(req);

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][START]');
    expect(response.statusCode).toBe(200);
  });

  it('will return a status of 500 if any error', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/consolidate',
    };

    const response = await server.inject(req);

    expect(response.statusCode).toBe(500);
  });

  it('will always return a status of 200 to acknowledge the request for /jobs/update', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/update',
      payload: {
        documentNumber: 'CC1'
      }
    }

    const response = await server.inject(req);
    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][UPDATING-FOR][DOCUMENT][CC1]');
    expect(mockUpdateConsolidateLandings).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  it('will always return a status of 400 if the payload of the request is incorrect (missing attribute)', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/update',
      payload: {}
    }

    const response = await server.inject(req);
    expect(mockUpdateConsolidateLandings).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it('will always return a status of 400 if the payload of the request is incorrect (incorrect att type)', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/update',
      payload: {
        documentNumber: 123
      }
    }

    const response = await server.inject(req);
    expect(mockUpdateConsolidateLandings).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it('will return a status of 500 if something goes wrong when trying to get catch certificates', async () => {
    mockUpdateConsolidateLandings.mockRejectedValue(new Error('something has gone wrong'));

    const req = {
      method: 'POST',
      url: '/v1/jobs/update',
      payload: {
        documentNumber: '123'
      }
    }

    const response = await server.inject(req);

    expect(mockLoggerError).toHaveBeenCalled();

    expect(response.statusCode).toBe(500);
  });

  it('will always return a status of 200 to acknowledge the request for /jobs/landings', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/landings',
      payload: {
        landings: []
      }
    }

    const response = await server.inject(req);
    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][UPDATING-LANDINGS][0]');
    expect(mockLandingsConsolidateJob).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  it('will always return a status of 400 if the payload of the request is incorrect (missing landings attribute)', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/landings',
      payload: {}
    }

    const response = await server.inject(req);
    expect(mockLandingsConsolidateJob).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it('will always return a status of 400 if the payload of the request is incorrect (incorrect landings att type)', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/landings',
      payload: {
        landings: 123
      }
    }

    const response = await server.inject(req);
    expect(mockUpdateConsolidateLandings).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it('will return a status of 500 if something goes wrong when updating landings', async () => {
    mockLandingsConsolidateJob.mockRejectedValue(new Error('something has gone wrong'));

    const req = {
      method: 'POST',
      url: '/v1/jobs/landings',
      payload: {
        landings: []
      }
    }

    const response = await server.inject(req);

    expect(mockLoggerError).toHaveBeenCalled();
    expect(response.statusCode).toBe(500);
  });

  it('will always return a status of 200 to acknowledge the request for /jobs/void', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/void',
      payload: {
        documentNumber: 'CC1'
      }
    }


    const response = await server.inject(req);
    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][VOIDING-FOR][DOCUMENT][CC1]');
    expect(response.statusCode).toBe(200);
  });

  it('will always return a status of 400 if the payload of the request is incorrect (incorrect att type) for /jobs/void', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/void',
      payload: {
        documentNumber: 123
      }
    }

    const response = await server.inject(req);

    expect(response.statusCode).toBe(400);
  });

  it('will return a status of 500 if something goes wrong when trying to void catch certificates', async () => {
    mockVoidConsolidateLandings.mockRejectedValue(new Error('something has gone wrong'));

    const req = {
      method: 'POST',
      url: '/v1/jobs/void',
      payload: {
        documentNumber: '123'
      }
    }

    const response = await server.inject(req);

    expect(mockLoggerError).toHaveBeenCalled();

    expect(response.statusCode).toBe(500);
  });

  it('will return the list of landings that are overused', async () => {
    const req = {
      method: 'GET',
      url: '/v1/landings/refresh'
    };

    const response = await server.inject(req);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toStrictEqual(JSON.stringify([{ rssNumber: 'rssWA1', dateLanded: '2020-01-01' }]))
  });

  it('will return a status of 500 if something goes wrong when trying to retrieve overuse landings', async () => {
    mockGetLandingRefresh.mockRejectedValue(new Error('something has gone wrong'));

    const req = {
      method: 'GET',
      url: '/v1/landings/refresh'
    }

    const response = await server.inject(req);

    expect(mockLoggerError).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-LANDINGS-REFRESH][ERROR][Error: something has gone wrong]');
    expect(response.statusCode).toBe(500);
  });

  it('will always return a status of 200 to acknowledge the purge request', async () => {
    const req = {
      method: 'POST',
      url: '/v1/jobs/purge',
    };

    const response = await server.inject(req);

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LOAD-FISH-COUNTRIES-SPECIES][POST][START]');
    expect(mockLoadFishCountriesAndSpecies).toHaveBeenCalled()
    expect(mockLoggerInfo).toHaveBeenCalledWith('[LOAD-FISH-COUNTRIES-SPECIES][POST][SUCCESS]');
    expect(response.statusCode).toBe(200);
  });

  it('will return a status of 500 if something goes wrong when trying to load data', async () => {
    mockLoadFishCountriesAndSpecies.mockRejectedValue(new Error('something has gone wrong'));

    const req = {
      method: 'POST',
      url: '/v1/jobs/purge',
    }

    const response = await server.inject(req);

    expect(mockLoggerError).toHaveBeenCalled();

    expect(response.statusCode).toBe(500);
  });
});
