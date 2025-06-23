import createJWKSMock from 'mock-jwks'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import request from 'supertest'
import app from '../../src/app'

describe('GET /users', () => {
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

    it('should return 200 status code', async () => {
        const userRepository = connection.getRepository(User)

        await userRepository.save([
            {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.MANAGER,
                tenantId: '1',
            },
            {
                firstName: 'Suresh',
                lastName: 'Kumar',
                email: 'suresh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
                tenantId: '1',
            },
        ])

        const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN })

        const response = await request(app)
            .get('/users')
            .set('Cookie', [`accessToken=${adminToken}`])

        expect(response.statusCode).toBe(200)
    })

    it('should return all users in the response', async () => {
        const userRepository = connection.getRepository(User)

        const users = await userRepository.save([
            {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.MANAGER,
                tenantId: '1',
            },
            {
                firstName: 'Suresh',
                lastName: 'Kumar',
                email: 'suresh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
                tenantId: '1',
            },
        ])

        const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN })

        const response = await request(app)
            .get('/users')
            .set('Cookie', [`accessToken=${adminToken}`])

        expect(response.body as User[]).toHaveLength(users.length)

        // Optionally check fields of the first user
        expect((response.body as User[])[0]).toMatchObject({
            email: users[0].email,
            firstName: users[0].firstName,
            lastName: users[0].lastName,
            role: users[0].role,
        })
    })

    it('should return 403 if accessed by non-admin', async () => {
        const userRepository = connection.getRepository(User)

        await userRepository.save({
            firstName: 'Rakesh',
            lastName: 'Singh',
            email: 'rakesh@mern.space',
            password: 'password',
            role: Roles.MANAGER,
            tenantId: '1',
        })

        const managerToken = jwks.token({ sub: '1', role: Roles.MANAGER })

        const response = await request(app)
            .get('/users')
            .set('Cookie', [`accessToken=${managerToken}`])

        expect(response.statusCode).toBe(403)
    })
})
