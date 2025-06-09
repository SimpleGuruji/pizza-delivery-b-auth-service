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

        it('should return accessToken and refreshToken in cookies', async () => {
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

            let accessToken = null
            let refreshToken = null

            const cookies =
                (response.headers['set-cookie'] as unknown as string[]) || []

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
