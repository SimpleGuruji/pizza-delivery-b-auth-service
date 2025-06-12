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

            let newAccessToken = null
            let newRefreshToken = null

            const cookies =
                (response.headers['set-cookie'] as unknown as string[]) || []

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    newAccessToken = cookie.split(';')[0].split('=')[1]
                }

                if (cookie.startsWith('refreshToken=')) {
                    newRefreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            expect(newAccessToken).not.toBeNull()
            expect(newRefreshToken).not.toBeNull()

            expect(isJwt(newAccessToken)).toBeTruthy()
            expect(isJwt(newRefreshToken)).toBeTruthy()
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
