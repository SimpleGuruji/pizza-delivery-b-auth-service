import createJWKSMock from 'mock-jwks'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import request from 'supertest'
import app from '../../src/app'

describe('GET/users/:id', () => {
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
        // Register a user first with manager role
        const userData = {
            firstName: 'Rakesh',
            lastName: 'Singh',
            email: 'rakesh@mern.space',
            password: 'password',
            role: Roles.MANAGER,
            tenantId: '1',
        }
        const userRepository = connection.getRepository(User)

        const createdUser = await userRepository.save(userData)

        const adminToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })

        // add the tokens to cookie
        const response = await request(app)
            .get(`/users/${createdUser.id}`)
            .set('Cookie', [`accessToken=${adminToken}`])

        expect(response.statusCode).toBe(200)
    })

    it('should fetch the user from the database', async () => {
        // Register a user first with manager role
        const userData = {
            firstName: 'Rakesh',
            lastName: 'Singh',
            email: 'rakesh@mern.space',
            password: 'password',
            role: Roles.MANAGER,
            tenantId: '1',
        }
        const userRepository = connection.getRepository(User)

        const createdUser = await userRepository.save(userData)

        const adminToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })

        // add the tokens to cookie
        await request(app)
            .get(`/users/${createdUser.id}`)
            .set('Cookie', [`accessToken=${adminToken}`])

        const user = await userRepository.findOneBy({ id: createdUser.id })

        expect(user).toMatchObject({
            id: createdUser.id,
            email: createdUser.email,
            firstName: createdUser.firstName,
            lastName: createdUser.lastName,
            role: createdUser.role,
        })
    })

    it('should return the found user', async () => {
        // Register a user first with manager role
        const userData = {
            firstName: 'Rakesh',
            lastName: 'Singh',
            email: 'rakesh@mern.space',
            password: 'password',
            role: Roles.MANAGER,
            tenantId: '1',
        }
        const userRepository = connection.getRepository(User)

        const createdUser = await userRepository.save(userData)

        const adminToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })

        // add the tokens to cookie
        const response = await request(app)
            .get(`/users/${createdUser.id}`)
            .set('Cookie', [`accessToken=${adminToken}`])

        const user = await userRepository.findOneBy({ id: createdUser.id })

        expect(response.body).toMatchObject({
            id: user?.id,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            role: user?.role,
        })
    })

    it('should return 403 status code if non-admin tries to fetch user', async () => {
        // Register a user first with manager role
        const userData = {
            firstName: 'Rakesh',
            lastName: 'Singh',
            email: 'rakesh@mern.space',
            password: 'password',
            role: Roles.MANAGER,
            tenantId: '1',
        }

        const userRepository = connection.getRepository(User)

        const createdUser = await userRepository.save(userData)

        const managerToken = jwks.token({
            sub: '1',
            role: Roles.MANAGER,
        })

        // add the tokens to cookie
        const response = await request(app)
            .get(`/users/${createdUser.id}`)
            .set('Cookie', [`accessToken=${managerToken}`])

        // Check the response status code
        expect(response.statusCode).toBe(403)
    })
})
