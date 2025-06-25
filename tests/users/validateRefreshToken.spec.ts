import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import app from '../../src/app'
import jwt from 'jsonwebtoken'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import { RefreshToken } from '../../src/entity/RefreshToken'
import { Config } from '../../src/config'
import { isJwt } from '../utils'

describe('POST/auth/refresh', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('given all fields', () => {
        it('should return 200 status code', async () => {
            // Register a user first

            // Create a user data object
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }
            // Get user repository
            const userRepository = connection.getRepository(User)

            // Create a new user
            const createdUser = await userRepository.save(userData)

            // Get refresh token repository
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            // Create a record in the refresh token table
            const refreshToken = await refreshTokenRepository.save({
                user: createdUser,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })

            // Generate a refresh token for the user
            const newRefreshToken = jwt.sign(
                {
                    sub: String(createdUser.id),
                    role: createdUser.role,
                    id: String(refreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                { algorithm: 'HS256' },
            )

            //add the token to cookies
            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', [`refreshToken=${newRefreshToken}`])
                .send()

            // Check the response status code
            expect(response.statusCode).toBe(200)
        })

        it("should return 401 status code if refresh token doesn't exist", async () => {
            // Register a user first

            // Create a user data object
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }
            // Get user repository
            const userRepository = connection.getRepository(User)

            // Create a new user
            const createdUser = await userRepository.save(userData)

            // Get refresh token repository
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            // Create a record in the refresh token table
            const refreshToken = await refreshTokenRepository.save({
                user: createdUser,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })

            // Generate a refresh token for the user
            jwt.sign(
                {
                    sub: String(createdUser.id),
                    role: createdUser.role,
                    id: String(refreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                { algorithm: 'HS256' },
            )

            //add wrong token to cookies
            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', ['refreshToken=invalidToken'])
                .send()

            // Check the response status code
            expect(response.statusCode).toBe(401)
        })

        it('should return 401 status code if refresh token is expired', async () => {
            // Register a user first
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }

            // Get user repository
            const userRepository = connection.getRepository(User)

            // Create a new user
            const createdUser = await userRepository.save(userData)

            // Get refresh token repository
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            // Create a refresh token entry in DB (still future expiresAt for DB, but JWT will be expired)
            const refreshToken = await refreshTokenRepository.save({
                user: createdUser,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
            })

            // Create an **expired** JWT token
            const expiredRefreshToken = jwt.sign(
                {
                    sub: String(createdUser.id),
                    role: createdUser.role,
                    id: String(refreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: 'HS256',
                    expiresIn: '-1s', // token already expired
                },
            )

            // Add the expired token to cookies and make the request
            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', [`refreshToken=${expiredRefreshToken}`])
                .send()

            // Expect a 401 Unauthorized
            expect(response.statusCode).toBe(401)
        })

        it('should return new access token and refresh token in the cookies', async () => {
            // Register a user first
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }

            // Get user repository
            const userRepository = connection.getRepository(User)

            // Create a new user
            const createdUser = await userRepository.save(userData)

            // Get refresh token repository
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            const savedRefreshToken = await refreshTokenRepository.save({
                user: createdUser,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
            })

            const oldRefreshToken = jwt.sign(
                {
                    sub: String(createdUser.id),
                    role: createdUser.role,
                    id: String(savedRefreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: 'HS256',
                },
            )

            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', [`refreshToken=${oldRefreshToken}`])
                .send()

            interface Headers {
                ['set-cookie']: string[]
            }

            // Assert
            let accessToken = ''
            let refreshToken = ''
            const cookies =
                (response.headers as unknown as Headers)['set-cookie'] || []
            // accessToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjkzOTA5Mjc2LCJleHAiOjE2OTM5MDkzMzYsImlzcyI6Im1lcm5zcGFjZSJ9.KetQMEzY36vxhO6WKwSR-P_feRU1yI-nJtp6RhCEZQTPlQlmVsNTP7mO-qfCdBr0gszxHi9Jd1mqf-hGhfiK8BRA_Zy2CH9xpPTBud_luqLMvfPiz3gYR24jPjDxfZJscdhE_AIL6Uv2fxCKvLba17X0WbefJSy4rtx3ZyLkbnnbelIqu5J5_7lz4aIkHjt-rb_sBaoQ0l8wE5KzyDNy7mGUf7cI_yR8D8VlO7x9llbhvCHF8ts6YSBRBt_e2Mjg5txtfBaDq5auCTXQ2lmnJtMb75t1nAFu8KwQPrDYmwtGZDkHUcpQhlP7R-y3H99YnrWpXbP8Zr_oO67hWnoCSw; Max-Age=43200; Domain=localhost; Path=/; Expires=Tue, 05 Sep 2023 22:21:16 GMT; HttpOnly; SameSite=Strict
            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1]
                }

                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()

            expect(isJwt(accessToken)).toBeTruthy()
            expect(isJwt(refreshToken)).toBeTruthy()
        })
    })

    describe('all fields are not provided', () => {
        it('should return 401 status code if refresh token is not prent in cookies', async () => {
            // Register a user first

            // Create a user data object
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }
            // Get user repository
            const userRepository = connection.getRepository(User)

            // Create a new user
            await userRepository.save(userData)

            //send request without setting the refresh token in cookies
            const response = await request(app).post('/auth/refresh').send()

            // Check the response status code
            expect(response.statusCode).toBe(401)
        })
    })
})
