import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import app from '../../src/app'
import createJWKSMock from 'mock-jwks'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'

describe('GET/auth/self', () => {
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
        it('should return 200 status code', async () => {
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

            //add the token to cookies
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send()

            // Check the response status code
            expect(response.statusCode).toBe(200)
        })

        it('should return the user data', async () => {
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

            //add the token to cookies
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send()

            // Check the response
            expect((response.body as Record<string, string>).id).toBe(
                createdUser.id,
            )
        })

        it('should not return password in the response', async () => {
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

            //add the token to cookies
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send()

            // Check the response
            expect(response.body as Record<string, string>).not.toHaveProperty(
                'password',
            )
        })

        it('should return 401 status code if token does not exists', async () => {
            // Register a user first

            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }

            const userRepository = connection.getRepository(User)

            await userRepository.save(userData)

            const response = await request(app).get('/auth/self').send()

            // Check the response
            expect(response.statusCode).toBe(401)
        })
    })
})
