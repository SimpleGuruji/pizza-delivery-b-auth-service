import fs from 'fs'
import path from 'path'
import { NextFunction, Response } from 'express'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import { JwtPayload, sign } from 'jsonwebtoken'
import createHttpError from 'http-errors'
import { Config } from '../config'

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

            let privateKey: Buffer
            // Read the private key from the file
            try {
                privateKey = fs.readFileSync(
                    path.join(__dirname, '../../certs/private.pem'),
                )
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                const err = createHttpError(
                    500,
                    'Error reading private key file',
                )
                next(err)
                return
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }

            const accessToken = sign(payload, privateKey, {
                algorithm: 'RS256',
                expiresIn: '1h',
                issuer: 'auth-service',
            })
            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: 'HS256',
                expiresIn: '1y',
                issuer: 'auth-service',
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
