import createJWKSMock from 'mock-jwks'
import { AppDataSource } from '../../src/config/data-source'
import { DataSource } from 'typeorm'
import request from 'supertest'
import app from '../../src/app'
import { Tenant } from '../../src/entity/Tenant'
import { Roles } from '../../src/constants'

describe('GET/tenants/:id', () => {
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

    it('should  return 200 status code', async () => {
        // Save an initial tenant
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
            .get(`/tenants/${tenant.id}`) // make sure your route accepts /:id
            .set('Cookie', [`accessToken=${adminToken}`])

        expect(response.statusCode).toBe(200)
    })

    it('should get the tenant from the database', async () => {
        // Save an initial tenant
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
            .get(`/tenants/${tenant.id}`) // make sure your route accepts /:id
            .set('Cookie', [`accessToken=${adminToken}`])

        const foundTenant = await tenantRepository.findOneBy({
            id: tenant.id,
        })
        expect(foundTenant).toMatchObject({
            id: tenant.id,
            name: tenant.name,
            address: tenant.address,
        })
    })

    it('should return 403 status code if non-admin tries to get tenant', async () => {
        // Save an initial tenant
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
            .get(`/tenants/${tenant.id}`)
            .set('Cookie', [`accessToken=${customerToken}`])

        expect(response.statusCode).toBe(403)
    })
})
