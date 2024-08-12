import Joi from 'joi';
import { Request, ResponseToolkit, Server, ServerApplicationState } from '@hapi/hapi';
import {
	getLandingsRefresh,
	runLandingsConsolidationJob,
	startLandingsConsolidationJob,
	updateConsolidateLandings,
	voidConsolidateLandings
} from '../services/consolidateLanding.service';
import {
	IConsolidateLandingDates,
	IUpdateConsolidateLanding,
	IUpdateLandings
} from '../types';
import logger from '../logger';
import { loadExporterBehaviour, loadFishCountriesAndSpecies } from '../data/cache';

export const jobsRoutes = (server: Server<ServerApplicationState>) => {
	server.route([
		{
			method: 'GET',
			path: '/v1/landings/refresh',
			options: {
				auth: false,
				description: 'retreive all the landings [rssNumber, dateLanded] where an overuse or elog mismatch has occured'
			},
			handler: async (_req: Request, h: ResponseToolkit) => {
				try {
					logger.info('[LANDING-CONSOLIDATION][GET-LANDINGS-REFRESH]');
					return await getLandingsRefresh();
				} catch (e) {
					logger.error(`[LANDINGS-CONSOLIDATION][GET-LANDINGS-REFRESH][ERROR][${e}]`);
					return h.response().code(500);
				}
			}
		},
		{
			method: 'POST',
			path: '/v1/jobs/consolidate',
			options: {
				auth: false,
				description: 'To consolidate all landings from the admin app',
			},
			handler: async (req: Request, h: ResponseToolkit) => {
				try {
					logger.info('[LANDINGS-CONSOLIDATION][START]');
					const { startDate, endDate } = req.payload as IConsolidateLandingDates;
					await runLandingsConsolidationJob(startDate, endDate);
					logger.info('[LANDINGS-CONSOLIDATION][SUCCESS]');
					return h.response().code(200);
				} catch (e) {
					logger.error(`[LANDINGS-CONSOLIDATION][ERROR][${e}]`);
					return h.response().code(500);
				}
			}
		},
		{
			method: 'POST',
			path: '/v1/jobs/update',
			options: {
				auth: false,
				description: 'To run the async flow of weight calculation upon the creation of a Catch Certificate',
				validate: {
					payload: Joi.object({
						documentNumber: Joi.string().required()
					})
				}
			},
			handler: async (req: Request, h: ResponseToolkit) => {
				try {
					const { documentNumber } = req.payload as IUpdateConsolidateLanding;

					logger.info(`[LANDING-CONSOLIDATION][UPDATING-FOR][DOCUMENT][${documentNumber}]`);
					await updateConsolidateLandings(documentNumber);
					logger.info(`[LANDING-CONSOLIDATION][UPDATING-FOR][DOCUMENT][${documentNumber}][SUCCESS]`);
					return h.response().code(200);
				} catch (e) {
					logger.error(`[LANDINGS-CONSOLIDATION][ERROR][${e}]`);
					return h.response().code(500);
				}
			},
		},
		{
			method: 'POST',
			path: '/v1/jobs/landings',
			options: {
				auth: false,
				description: 'To run the async flow of weight calculation upon the creation of a Catch Certificate from the batch',
				validate: {
					payload: Joi.object({
						landings: Joi.array().required()
					})
				}
			},
			handler: async (req: Request, h: ResponseToolkit) => {
				try {
					const { landings } = req.payload as IUpdateLandings;

					logger.info(`[LANDING-CONSOLIDATION][UPDATING-LANDINGS][${landings.length}]`);
					await startLandingsConsolidationJob(landings);
					logger.info(`[LANDING-CONSOLIDATION][UPDATING-LANDINGS][SUCCESS]`);
					return h.response().code(200);
				} catch (e) {
					logger.error(`[LANDINGS-CONSOLIDATION][ERROR][${e}]`);
					return h.response().code(500);
				}
			},
		},
		{
			method: 'POST',
			path: '/v1/jobs/void',
			options: {
				auth: false,
				description: 'To remove the used_weights from the reported landing, when a user VOIDs a catch certificate that has landing data from the web application',
				validate: {
					payload: Joi.object({
						documentNumber: Joi.string().required(),
					})
				}
			},
			handler: async (req: Request, h: ResponseToolkit) => {
				try {
					const { documentNumber } = req.payload as IUpdateConsolidateLanding;
					logger.info(`[LANDING-CONSOLIDATION][VOIDING-FOR][DOCUMENT][${documentNumber}]`);
					await voidConsolidateLandings(documentNumber);
					return h.response().code(200);
				} catch (e) {
					logger.error(`[LANDINGS-CONSOLIDATION][VOID][ERROR][${e}]`);
					return h.response().code(500);
				}
			}
		},
		{
			method: 'POST',
			path: '/v1/jobs/purge',
			options: {
				auth: false,
				description: 'To reload fish countries and species into cache',
			},
			handler: async (request: Request, h: ResponseToolkit) => {
				try {
					logger.info('[LOAD-FISH-COUNTRIES-SPECIES][POST][START]');
					await loadFishCountriesAndSpecies();
					await loadExporterBehaviour();
					logger.info('[LOAD-FISH-COUNTRIES-SPECIES][POST][SUCCESS]');
					return h.response().code(200);
				} catch (e) {
					logger.error({ err: e }, `[LOAD-FISH-COUNTRIES-SPECIES][POST][ERROR] ${e}`);
					return h.response().code(500);
				}
			},
		},
	]);
}