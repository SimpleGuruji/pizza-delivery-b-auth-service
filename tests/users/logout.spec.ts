import createJWKSMock from 'mock-jwks'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import { RefreshToken } from '../../src/entity/RefreshToken'
import app from '../../src/app'
import { Config } from '../../src/config'

describe('POST/auth/logout', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('given all fields', () => {
        it('should return 200 ststus code', async () => {
            // Register a user first

            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }

            const userRepository = connection.getRepository(User)

            const createdUser = await userRepository.save(userData)

            // generate a JWT token for the user
            // using the mock JWKS
            const accessToken = jwks.token({
                sub: String(createdUser.id),
                role: createdUser.role,
            })

            // get refresh token repository
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            //create a record in the refresh token table
            const refreshToken = await refreshTokenRepository.save({
                user: createdUser,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })

            // generate a refresh token
            const newRefreshToken = jwt.sign(
                {
                    sub: String(createdUser.id),
                    role: createdUser.role,
                    id: String(refreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                { algorithm: 'HS256' },
            )

            // add the tokens to cookies
            const response = await request(app)
                .post('/auth/logout')
                .set('Cookie', [
                    `accessToken=${accessToken}`,
                    `refreshToken=${newRefreshToken}`,
                ])
                .send()

            // Check the response status code
            expect(response.statusCode).toBe(200)
        })

        it('should delete the refresh token from the database', async () => {
            // Register a user first

            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }

            const userRepository = connection.getRepository(User)

            const createdUser = await userRepository.save(userData)

            // generate a JWT token for the user
            // using the mock JWKS
            const accessToken = jwks.token({
                sub: String(createdUser.id),
                role: createdUser.role,
            })

            // get refresh token repository
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            //create a record in the refresh token table
            const refreshToken = await refreshTokenRepository.save({
                user: createdUser,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })

            // generate a refresh token
            const newRefreshToken = jwt.sign(
                {
                    sub: String(createdUser.id),
                    role: createdUser.role,
                    id: String(refreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                { algorithm: 'HS256' },
            )

            // add the tokens to cookies
            await request(app)
                .post('/auth/logout')
                .set('Cookie', [
                    `accessToken=${accessToken}`,
                    `refreshToken=${newRefreshToken}`,
                ])
                .send()

            const tokens = await refreshTokenRepository.find()

            expect(tokens).toHaveLength(0)
        })

        it('should clear access token and refresh token from cookies', async () => {
            // Register a user first

            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }

            const userRepository = connection.getRepository(User)

            const createdUser = await userRepository.save(userData)

            // generate a JWT token for the user
            // using the mock JWKS
            const accessToken = jwks.token({
                sub: String(createdUser.id),
                role: createdUser.role,
            })

            // get refresh token repository
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            //create a record in the refresh token table
            const refreshToken = await refreshTokenRepository.save({
                user: createdUser,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })

            // generate a refresh token
            const newRefreshToken = jwt.sign(
                {
                    sub: String(createdUser.id),
                    role: createdUser.role,
                    id: String(refreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                { algorithm: 'HS256' },
            )

            // add the tokens to cookies
            const response = await request(app)
                .post('/auth/logout')
                .set('Cookie', [
                    `accessToken=${accessToken}`,
                    `refreshToken=${newRefreshToken}`,
                ])
                .send()

            let clearedAccessToken = null
            let clearedRefreshToken = null

            const cookies =
                (response.headers['set-cookie'] as unknown as string[]) || []

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    clearedAccessToken = cookie.split(';')[0].split('=')[1]
                }

                if (cookie.startsWith('refreshToken=')) {
                    clearedRefreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            expect(clearedAccessToken).toBe('')
            expect(clearedRefreshToken).toBe('')
        })
    })

    describe('if fields are not in proper format', () => {
        it('Should return 401 status code if  refresh token is invalid', async () => {
            // Register a user first

            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }

            const userRepository = connection.getRepository(User)

            const createdUser = await userRepository.save(userData)

            // generate a JWT token for the user
            // using the mock JWKS
            const accessToken = jwks.token({
                sub: String(createdUser.id),
                role: createdUser.role,
            })

            // get refresh token repository
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            //create a record in the refresh token table
            const refreshToken = await refreshTokenRepository.save({
                user: createdUser,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })

            // generate a refresh token
            jwt.sign(
                {
                    sub: String(createdUser.id),
                    role: createdUser.role,
                    id: String(refreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                { algorithm: 'HS256' },
            )

            // send the request with wrong refresh token
            const response = await request(app)
                .post('/auth/logout')
                .set('Cookie', [
                    `accessToken=${accessToken}`,
                    `refreshToken=wrong-token`,
                ])
                .send()

            // Check the response status code
            expect(response.statusCode).toBe(401)
        })

        it('should return 401 status code if access token is invalid', async () => {
            // Register a user first

            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }

            const userRepository = connection.getRepository(User)

            const createdUser = await userRepository.save(userData)

            // generate a JWT token for the user
            // using the mock JWKS
            jwks.token({
                sub: String(createdUser.id),
                role: createdUser.role,
            })

            // get refresh token repository
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            //create a record in the refresh token table
            const refreshToken = await refreshTokenRepository.save({
                user: createdUser,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })

            // generate a refresh token
            const newRefreshToken = jwt.sign(
                {
                    sub: String(createdUser.id),
                    role: createdUser.role,
                    id: String(refreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                { algorithm: 'HS256' },
            )

            // send request with wrong access token
            const response = await request(app)
                .post('/auth/logout')
                .set('Cookie', [
                    `accessToken=wrong-token`,
                    `refreshToken=${newRefreshToken}`,
                ])
                .send()

            // Check the response status code
            expect(response.statusCode).toBe(401)
        })

        it('should return 401 status code if both access token and refresh tokens are invalid', async () => {
            // Register a user first

            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }

            const userRepository = connection.getRepository(User)

            const createdUser = await userRepository.save(userData)

            // generate a JWT token for the user
            // using the mock JWKS
            jwks.token({
                sub: String(createdUser.id),
                role: createdUser.role,
            })

            // get refresh token repository
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            //create a record in the refresh token table
            const refreshToken = await refreshTokenRepository.save({
                user: createdUser,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
            })

            // generate a refresh token
            jwt.sign(
                {
                    sub: String(createdUser.id),
                    role: createdUser.role,
                    id: String(refreshToken.id),
                },
                Config.REFRESH_TOKEN_SECRET!,
                { algorithm: 'HS256' },
            )

            // send request with wrong access token and refresh token
            const response = await request(app)
                .post('/auth/logout')
                .set('Cookie', [
                    `accessToken=wrong-token`,
                    `refreshToken=wrong-token`,
                ])
                .send()

            // Check the response status code
            expect(response.statusCode).toBe(401)
        })
    })
})
