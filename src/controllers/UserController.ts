import { Request, Response, NextFunction } from 'express'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import createHttpError from 'http-errors'

export class UserController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}
    async create(req: RegisterUserRequest, res: Response, next: NextFunction) {
        const validationErrors = validationResult(req)
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({ errors: validationErrors.array() })
        }

        const { firstName, lastName, email, password, role, tenantId } =
            req.body

        this.logger.debug('New request to register user', {
            firstName,
            lastName,
            email,
            role,
            password: '********',
        })
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role,
                tenantId,
            })
            this.logger.info('User created successfully', {
                userId: user.id,
            })

            return res.status(201).json({ id: user.id })
        } catch (error) {
            next(error)
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id

        if (isNaN(Number(userId))) {
            const error = createHttpError(400, 'Invalid user ID')
            next(error)
            return
        }

        try {
            const user = await this.userService.findById(Number(userId))

            return res.json(user)
        } catch (error) {
            next(error)
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await this.userService.findAll()
            return res.json(users)
        } catch (error) {
            next(error)
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const validationErrors = validationResult(req)
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({ errors: validationErrors.array() })
        }

        const { firstName, lastName, role } = req.body

        const userId = req.params.id

        if (isNaN(Number(userId))) {
            const error = createHttpError(400, 'Invalid user ID')
            next(error)
            return
        }

        this.logger.debug('Request for updating a user', req.body)

        try {
            await this.userService.update(Number(userId), {
                firstName,
                lastName,
                role,
            })

            this.logger.info('User has been updated', { id: userId })

            return res.json({ id: Number(userId) })
        } catch (error) {
            next(error)
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id

        if (isNaN(Number(userId))) {
            const error = createHttpError(400, 'Invalid user ID')
            next(error)
            return
        }

        try {
            await this.userService.deleteById(Number(userId))

            this.logger.info('User has been deleted', { id: userId })

            return res.json({ id: Number(userId) })
        } catch (error) {
            next(error)
        }
    }
}
