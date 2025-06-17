import { NextFunction, Response, Request } from 'express'
import { TenantRequest } from '../types'
import { TenantService } from '../services/TenantService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import createHttpError from 'http-errors'

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}
    async create(req: TenantRequest, res: Response, next: NextFunction) {
        const validationErrors = validationResult(req)
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({ errors: validationErrors.array() })
        }

        const { name, address } = req.body
        this.logger.debug('Creating a new Tenant', req.body)

        try {
            const tenant = await this.tenantService.create({ name, address })
            this.logger.info('Tenant created successfully', { id: tenant.id })
        } catch (error) {
            return next(error)
        }

        return res.status(201).json({})
    }

    async update(req: TenantRequest, res: Response, next: NextFunction) {
        const validationErrors = validationResult(req)
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({ errors: validationErrors.array() })
        }

        const { name, address } = req.body

        const tenantId = req.params.id

        if (isNaN(Number(tenantId))) {
            const error = createHttpError(400, 'Invalid Tenant ID')
            next(error)
            return
        }

        this.logger.debug('Request for updating a tenant', req.body)

        try {
            await this.tenantService.update(Number(tenantId), { name, address })
            return res.json({ id: Number(tenantId) })
        } catch (error) {
            next(error)
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.params.id

        if (isNaN(Number(tenantId))) {
            const error = createHttpError(400, 'Invalid Tenant ID')
            next(error)
            return
        }

        try {
            const tenant = await this.tenantService.getOne(Number(tenantId))
            return res.json(tenant)
        } catch (error) {
            next(error)
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const tenants = await this.tenantService.getAll()
            return res.json(tenants)
        } catch (error) {
            next(error)
        }
    }

    async destroy(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.params.id

        if (isNaN(Number(tenantId))) {
            next(createHttpError(400, 'Invalid url param.'))
            return
        }

        try {
            await this.tenantService.deleteById(Number(tenantId))

            this.logger.info('Tenant has been deleted', {
                id: Number(tenantId),
            })
            res.json({ id: Number(tenantId) })
        } catch (err) {
            next(err)
        }
    }
}
