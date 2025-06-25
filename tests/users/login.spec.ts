import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import app from '../../src/app'
import { Roles } from '../../src/constants'
import { isJwt } from '../utils'
import bcrypt from 'bcrypt'
import { User } from '../../src/entity/User'

describe('POST /auth/login', () => {
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
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            const hasedPassord = await bcrypt.hash(userData.password, 10)

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hasedPassord,
                role: Roles.CUSTOMER,
            })

            const response = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password })

            expect(response.statusCode).toBe(200)
        })

        it('should return valid JSON response', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            const hasedPassord = await bcrypt.hash(userData.password, 10)

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hasedPassord,
                role: Roles.CUSTOMER,
            })

            const response = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password })

            expect(response.headers['content-type']).toMatch(/json/)
        })

        it('should return access token and refresh token in cookie', async () => {
            //  ARRANGE
            const userData = {
                email: 'something@something.com',
                password: 'secret-password',
            }

            //  ARRANGE
            const hashedPassword = await bcrypt.hash(userData.password, 10)

            // ASSERT
            const userRepo = connection.getRepository(User)

            await userRepo.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
                firstName: 'Nithin',
                lastName: 'V Kumar',
            })

            //  ACT
            const response = await request(app)
                .post('/auth/login')
                .send(userData)

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

        it('should return 401 status code if password is incorrect', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            const hasedPassord = await bcrypt.hash(userData.password, 10)

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hasedPassord,
                role: Roles.CUSTOMER,
            })

            const response = await request(app).post('/auth/login').send({
                email: userData.email,
                password: 'wrongpassword',
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('if fields are missing', () => {
        it('should return 400 status code if email field is missing', async () => {
            const userData = {
                email: '',
                password: 'password',
            }

            const respose = await request(app)
                .post('/auth/login')
                .send(userData)

            expect(respose.statusCode).toBe(400)
        })

        it('should return 400 status code if password field is missing', async () => {
            const userData = {
                email: 'rakesh@mern.space',
                password: '',
            }

            const response = await request(app)
                .post('/auth/login')
                .send(userData)
            expect(response.statusCode).toBe(400)
        })

        it('should return 400 status code if both email and password fields are missing', async () => {
            const userData = {
                email: '',
                password: '',
            }

            const response = await request(app)
                .post('/auth/login')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })

        it('should return 400 status code if email is not a valid email', async () => {
            const userData = {
                email: 'invalid-email',
                password: 'password',
            }

            const response = await request(app)
                .post('/auth/login')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })

        it('should return 404 status code if email is not registered', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            const hasedPassord = await bcrypt.hash(userData.password, 10)

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hasedPassord,
                role: Roles.CUSTOMER,
            })

            const response = await request(app).post('/auth/login').send({
                email: 'rohit@mern.space',
                password: userData.password,
            })

            expect(response.statusCode).toBe(404)
        })
    })
})
