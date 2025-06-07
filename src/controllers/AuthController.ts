import { NextFunction, Response } from 'express'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import { JwtPayload } from 'jsonwebtoken'
import { TokenService } from '../services/TokenService'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
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

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }
            // Generate access token
            const accessToken = this.tokenService.generateAcceessToken(payload)

            //persist the refresh token in the database
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

            // Generate refresh token
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, // 1 hour
                httpOnly: true,
            })

            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
                httpOnly: true,
            })

            return res.status(201).json({ id: user.id })
        } catch (error) {
            next(error)
            return
        }
    }
}
