import createJWKSMock from 'mock-jwks'
import { AppDataSource } from '../../src/config/data-source'
import { DataSource } from 'typeorm'
import request from 'supertest'
import app from '../../src/app'
import { Tenant } from '../../src/entity/Tenant'
import { Roles } from '../../src/constants'

describe('DELETE/tenants/:id', () => {
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

        const tenantData = {
            name: 'tenant name',
            address: 'tenant address',
        }
        const tenant = await tenantRepository.save(tenantData)

        // Create admin token
        const adminToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })

        const response = await request(app)
            .delete(`/tenants/${tenant.id}`) // make sure your route accepts /:id
            .set('Cookie', [`accessToken=${adminToken}`])

        expect(response.statusCode).toBe(200)
    })

    it('should delete the tenant in the database', async () => {
        const tenantRepository = connection.getRepository(Tenant)

        const tenantData = {
            name: 'tenant name',
            address: 'tenant address',
        }
        const tenant = await tenantRepository.save(tenantData)

        // Create admin token
        const adminToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })

        await request(app)
            .delete(`/tenants/${tenant.id}`) // make sure your route accepts /:id
            .set('Cookie', [`accessToken=${adminToken}`])

        const tenants = await tenantRepository.find()
        expect(tenants).toHaveLength(0)
    })

    it('should return 403 status code if non-admin tries to delete', async () => {
        const tenantRepository = connection.getRepository(Tenant)

        const tenantData = {
            name: ' Tenant name',
            address: ' Tenant address ',
        }
        const tenant = await tenantRepository.save(tenantData)

        const customerToken = jwks.token({
            sub: '1',
            role: Roles.CUSTOMER,
        })

        const response = await request(app)
            .delete(`/tenants/${tenant.id}`)
            .set('Cookie', [`accessToken=${customerToken}`])

        expect(response.statusCode).toBe(403)
    })
})
