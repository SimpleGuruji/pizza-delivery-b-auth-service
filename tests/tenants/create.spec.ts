import createJWKSMock from 'mock-jwks'
import { AppDataSource } from '../../src/config/data-source'
import { DataSource } from 'typeorm'
import request from 'supertest'
import app from '../../src/app'
import { Tenant } from '../../src/entity/Tenant'
import { Roles } from '../../src/constants'

describe('POST/tenants', () => {
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
        it('should return 201 status code', async () => {
            const tenantData = {
                name: 'Tenant name',
                address: 'Tenant address',
            }
            const adminToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${adminToken}`])
                .send(tenantData)

            expect(response.statusCode).toBe(201)
        })

        it('should create a tenant in the databae', async () => {
            const tenantData = {
                name: 'Tenant name',
                address: 'Tenant address',
            }
            const adminToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${adminToken}`])
                .send(tenantData)

            const tenantRepository = connection.getRepository(Tenant)

            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(1)

            expect(tenants[0].name).toBe(tenantData.name)
            expect(tenants[0].address).toBe(tenantData.address)
        })

        it('should return 401 status code if user in not authenticated', async () => {
            const tenantData = {
                name: 'Tenant name',
                address: 'Tenant address',
            }

            const response = await request(app)
                .post('/tenants')
                .send(tenantData)

            const tenantRepository = connection.getRepository(Tenant)

            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(0)
            expect(response.statusCode).toBe(401)
        })

        it('should return 403 status code if user is not admin', async () => {
            const tenantData = {
                name: 'Tenant name',
                address: 'Tenant address',
            }
            const managerToken = jwks.token({
                sub: '1',
                role: Roles.MANAGER,
            })

            const response = await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${managerToken}`])
                .send(tenantData)

            const tenantRepository = connection.getRepository(Tenant)

            const tenants = await tenantRepository.find()

            expect(response.statusCode).toBe(403)
            expect(tenants).toHaveLength(0)
        })
    })
})
