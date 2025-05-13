import request from 'supertest'
import app from '../../src/app'
import { DataSource } from 'typeorm'
import { User } from '../../src/entity/User'
import { AppDataSource } from '../../src/config/data-source'
import { Roles } from '../../src/constants'

describe('POST /auth/register', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()
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

        it("should assign the user a default role of 'customer'", async () => {
            // Arrange
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            // Act
            await request(app).post('/auth/register').send(userData)

            // Assert
            const repository = connection.getRepository(User)
            const users = await repository.find()
            expect(users[0]).toHaveProperty('role')
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it('it shoulld store the hash of the password in the database ', async () => {
            // Arrange
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            // Act

            await request(app).post('/auth/register').send(userData)

            // Assert
            const repository = connection.getRepository(User)
            const users = await repository.find()

            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
        })

        it('should return 400 statuscode if email is already exists', async () => {
            // Arrange
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            const repository = connection.getRepository(User)
            await repository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const users = await repository.find()

            // Assert

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(1)
        })
    })

    describe('fields are missing', () => {
        it('should return 400 status code if email field is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: '',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.statusCode).toBe(400)

            const repository = connection.getRepository(User)
            const users = await repository.find()
            expect(users).toHaveLength(0)
        })
    })
})
