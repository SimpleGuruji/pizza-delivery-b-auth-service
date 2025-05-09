import request from 'supertest'
import app from '../../src/app'
import { DataSource } from 'typeorm'
import { User } from '../../src/entity/User'
import { AppDataSource } from '../../src/config/data-source'
import { truncateTables } from '../utils'

describe('POST /auth/register', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await truncateTables(connection)
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('given all fields ', () => {
        it('should return 201 status code', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'reakeshsingh@gmail.com',
                password: 'secret',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(201)
        })

        it('should return valid json response', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'reakeshsingh@gmail.com',
                password: 'secret',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'))
        })

        it('should persist the user in the databasr', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'reakeshsingh@gmail.com',
                password: 'secret',
            }

            await request(app).post('/auth/register').send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users.length).toBe(1)
            expect(users[0].firstName).toBe(userData.firstName)
            expect(users[0].lastName).toBe(userData.lastName)
            expect(users[0].email).toBe(userData.email)
        })

        it('should return an id of the created user', async () => {
            // Arrange
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.body).toHaveProperty('id')
            const repository = connection.getRepository(User)
            const users = await repository.find()
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            )
        })
    })

    describe('fields are missing', () => {})
})
