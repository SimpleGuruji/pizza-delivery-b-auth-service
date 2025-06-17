import Router, { NextFunction } from 'express'
import { Request, Response } from 'express'
import { TenantController } from '../controllers/TenantController'
import { AppDataSource } from '../config/data-source'
import { Tenant } from '../entity/Tenant'
import { TenantService } from '../services/TenantService'
import logger from '../config/logger'
import authenticate from '../middlewares/authenticate'
import { canAccessAdmin } from '../middlewares/canAccessAdmin'
import tenantValidator from '../validators/tenant.validator'

const router = Router()
const tenantRepository = AppDataSource.getRepository(Tenant)
const tenantService = new TenantService(tenantRepository)
const tenantController = new TenantController(tenantService, logger)

router.post(
    '/',
    authenticate,
    canAccessAdmin,
    tenantValidator,
    async (req: Request, res: Response, next: NextFunction) => {
        await tenantController.create(req, res, next)
    },
)

router.patch(
    '/:id',
    authenticate,
    canAccessAdmin,
    tenantValidator,
    async (req: Request, res: Response, next: NextFunction) => {
        await tenantController.update(req, res, next)
    },
)

router.get(
    '/:id',
    authenticate,
    canAccessAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
        await tenantController.getOne(req, res, next)
    },
)
router.get(
    '/',
    authenticate,
    canAccessAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
        await tenantController.getAll(req, res, next)
    },
)

router.delete(
    '/:id',
    authenticate,
    canAccessAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
        await tenantController.destroy(req, res, next)
    },
)

export default router
