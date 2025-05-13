import { NextFunction, Response } from 'express'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        // Validate the request

        const validationErrors = validationResult(req)
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({ errors: validationErrors.array() })
        }

        const { firstName, lastName, email, password } = req.body

        this.logger.debug('New request to register user', {
            firstName,
            lastName,
            email,
            password: '********',
        })

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            })

            this.logger.info('User created successfully', {
                userId: user.id,
            })

            return res.status(201).json({ id: user.id })
        } catch (error) {
            next(error)
            return
        }
    }
}
