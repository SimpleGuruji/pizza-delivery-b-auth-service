import createJWKSMock from 'mock-jwks'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import request from 'supertest'
import app from '../../src/app'

describe('POST/users', () => {
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

    it('should return 201 ststus code', async () => {
        // Register a user first with manager role
        const userData = {
            firstName: 'Rakesh',
            lastName: 'Singh',
            email: 'rakesh@mern.space',
            password: 'password',
            role: Roles.MANAGER,
            tenantId: '1',
        }

        const adminToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })

        // add the tokens to cookie
        const response = await request(app)
            .post('/users')
            .set('Cookie', [`accessToken=${adminToken}`])
            .send(userData)

        // Check the response status code
        expect(response.statusCode).toBe(201)
    })

    it('should persist the user in the database', async () => {
        // Register a user first with manager role
        const userData = {
            firstName: 'Rakesh',
            lastName: 'Singh',
            email: 'rakesh@mern.space',
            password: 'password',
            role: Roles.MANAGER,
            tenantId: '1',
        }

        const adminToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })

        // add the tokens to cookie
        await request(app)
            .post('/users')
            .set('Cookie', [`accessToken=${adminToken}`])
            .send(userData)

        const userRepository = connection.getRepository(User)
        const users = await userRepository.find()

        expect(users).toHaveLength(1)
        expect(users[0].role).toBe(userData.role)
    })

    it('should return 403 status code if non-admin tries to crate manager user', async () => {
        // Register a user first with manager role
        const userData = {
            firstName: 'Rakesh',
            lastName: 'Singh',
            email: 'rakesh@mern.space',
            password: 'password',
            role: Roles.MANAGER,
            tenantId: '1',
        }

        const managerToken = jwks.token({
            sub: '1',
            role: Roles.MANAGER,
        })

        // add the tokens to cookie
        const response = await request(app)
            .post('/users')
            .set('Cookie', [`accessToken=${managerToken}`])
            .send(userData)

        // Check the response status code
        expect(response.statusCode).toBe(403)
    })

    it('should return 500 status code if create fails', async () => {
        // Mock the repository save method to throw an error
        const userRepository = connection.getRepository(User)
        jest.spyOn(userRepository, 'save').mockRejectedValue(
            new Error('failed to store the data in database'),
        )

        const adminToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })

        const userData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'password123',
            role: Roles.CUSTOMER,
        }

        const response = await request(app)
            .post('/users')
            .send(userData)
            .set('Cookie', [`accessToken=${adminToken}`])

        expect(response.statusCode).toBe(500)
    })
})
