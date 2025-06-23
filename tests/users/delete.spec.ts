import createJWKSMock from 'mock-jwks'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import request from 'supertest'
import app from '../../src/app'

describe('DELETE/users/:id', () => {
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

        const user = await userRepository.save({
            firstName: 'Rakesh',
            lastName: 'Singh',
            email: 'rakesh@mern.space',
            password: 'password',
            role: Roles.MANAGER,
            tenantId: '1',
        })

        const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN })

        const response = await request(app)
            .delete(`/users/${user.id}`)
            .set('Cookie', [`accessToken=${adminToken}`])

        expect(response.statusCode).toBe(200)
    })

    it('should delete the user from the database', async () => {
        const userRepository = connection.getRepository(User)

        const user = await userRepository.save({
            firstName: 'Rakesh',
            lastName: 'Singh',
            email: 'rakesh@mern.space',
            password: 'password',
            role: Roles.MANAGER,
            tenantId: '1',
        })

        const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN })

        await request(app)
            .delete(`/users/${user.id}`)
            .set('Cookie', [`accessToken=${adminToken}`])

        const users = await userRepository.find()

        expect(users).toHaveLength(0)
    })

    it('should return 403 if non-admin tries to delete user', async () => {
        const userRepository = connection.getRepository(User)

        const user = await userRepository.save({
            firstName: 'Suresh',
            lastName: 'Kumar',
            email: 'suresh@mern.space',
            password: 'password',
            role: Roles.CUSTOMER,
            tenantId: '1',
        })

        const managerToken = jwks.token({
            sub: '1',
            role: Roles.MANAGER,
        })

        const response = await request(app)
            .delete(`/users/${user.id}`)
            .set('Cookie', [`accessToken=${managerToken}`])

        expect(response.statusCode).toBe(403)
    })
})
