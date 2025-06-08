import { NextFunction, Response } from 'express'
import { LoginUserRequest, RegisterUserRequest } from '../types'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import { JwtPayload } from 'jsonwebtoken'
import { TokenService } from '../services/TokenService'

import createHttpError from 'http-errors'
import { CredentialService } from '../services/CredentialService'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
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
            const accessToken = this.tokenService.generateAccessToken(payload)

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

    async login(req: LoginUserRequest, res: Response, next: NextFunction) {
        // Validate the request
        // Note: Validation should be done before accessing req.body
        const validationErrors = validationResult(req)
        if (!validationErrors.isEmpty()) {
            return res.status(400).json({ errors: validationErrors.array() })
        }

        // Extract email and password from the request body
        const { email, password } = req.body

        // Log the login attempt
        // Note: Password should not be logged in production for security reasons
        this.logger.debug('New request to login user', {
            email,
            password: '********',
        })

        // Check if user exists
        const existingUser = await this.userService.findByEmail(email)

        if (!existingUser) {
            const err = createHttpError(404, 'User not found')
            return next(err)
        }

        // Verify password

        const isPasswordValid = await this.credentialService.comparePassword(
            password,
            existingUser.password,
        )

        if (!isPasswordValid) {
            const err = createHttpError(401, 'Invalid credentials')
            return next(err)
        }

        // Create JWT payload
        const payload: JwtPayload = {
            sub: String(existingUser.id),
            role: existingUser.role,
        }

        // Generate access token
        const accessToken = this.tokenService.generateAccessToken(payload)

        //persist the refresh token in the database
        const newRefreshToken =
            await this.tokenService.persistRefreshToken(existingUser)

        // Generate refresh token
        const refreshToken = this.tokenService.generateRefreshToken({
            ...payload,
            id: String(newRefreshToken.id),
        })

        // Set cookies for access and refresh tokens
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

        // Log successful login
        this.logger.info('User logged in successfully', {
            userId: existingUser.id,
        })

        // Return user ID in the response
        return res.status(200).json({ id: existingUser.id })
    }
}
