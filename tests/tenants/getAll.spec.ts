import createJWKSMock from 'mock-jwks'
import { AppDataSource } from '../../src/config/data-source'
import { DataSource } from 'typeorm'
import request from 'supertest'
import app from '../../src/app'
import { Tenant } from '../../src/entity/Tenant'
import { Roles } from '../../src/constants'

describe('GET /tenants', () => {
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
        const tenantRepository = connection.getRepository(Tenant)

        const tenants = [
            { name: 'Tenant A', address: 'Address A' },
            { name: 'Tenant B', address: 'Address B' },
        ]
        await tenantRepository.save(tenants)

        const adminToken = jwks.token({ sub: 'admin-id', role: Roles.ADMIN })

        const response = await request(app)
            .get(`/tenants`)
            .set('Cookie', [`accessToken=${adminToken}`])

        expect(response.statusCode).toBe(200)
    })

    it('should fetch all tenants from the database', async () => {
        const tenantRepository = connection.getRepository(Tenant)

        const tenants = [
            { name: 'Tenant A', address: 'Address A' },
            { name: 'Tenant B', address: 'Address B' },
        ]
        await tenantRepository.save(tenants)

        const adminToken = jwks.token({ sub: 'admin-id', role: Roles.ADMIN })

        const response = await request(app)
            .get(`/tenants`)
            .set('Cookie', [`accessToken=${adminToken}`])

        const allTenants = await tenantRepository.find()

        expect((response.body as Record<string, string>).length).toBe(2)
        expect(allTenants).toHaveLength(2)
    })
})
