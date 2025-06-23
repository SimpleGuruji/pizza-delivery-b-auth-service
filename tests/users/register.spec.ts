import request from 'supertest'
import app from '../../src/app'
import { DataSource } from 'typeorm'
import { User } from '../../src/entity/User'
import { AppDataSource } from '../../src/config/data-source'
import { Roles } from '../../src/constants'
import { isJwt } from '../utils'
import { RefreshToken } from '../../src/entity/RefreshToken'

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
                password: 'password',
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
                password: 'password',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'))
        })

        it('should persist the user in the database', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'reakeshsingh@gmail.com',
                password: 'password',
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
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
                role: Roles.CUSTOMER,
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.body).toHaveProperty('id')
            const repository = connection.getRepository(User)
            const users = await repository.find()
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            )
        })

        it("should assign the user a default role of 'customer'", async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            await request(app).post('/auth/register').send(userData)

            const repository = connection.getRepository(User)
            const users = await repository.find()
            expect(users[0]).toHaveProperty('role')
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it('it should store the hash of the password in the database', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            await request(app).post('/auth/register').send(userData)

            const repository = connection.getRepository(User)
            const users = await repository.find({ select: ['password'] })

            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
        })

        it('should return 400 statuscode if email already exists', async () => {
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

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const users = await repository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(1)
        })

        it('should return the access token and refresh token inside a cookie', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'K',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            let accessToken = null
            let refreshToken = null

            const cookies =
                (response.headers['set-cookie'] as unknown as string[]) || []

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1]
                }

                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })

            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()

            expect(isJwt(accessToken)).toBeTruthy()
            expect(isJwt(refreshToken)).toBeTruthy()
        })

        it('should store the refresh token in the database', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'reakeshsingh@gmail.com',
                password: 'password',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const refreshTokenRepo = connection.getRepository(RefreshToken)
            // const refreshTokens = await refreshTokenRepo.find()

            const tokens = await refreshTokenRepo
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId = :userId', {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany()

            expect(tokens).toHaveLength(1)
        })
    })

    describe('fields are missing', () => {
        it('should return 400 status code if email field is missing', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: '',
                password: 'password',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)

            const repository = connection.getRepository(User)
            const users = await repository.find()
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if firstName field is missing', async () => {
            const userData = {
                firstName: '',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })

        it('should return 400 status code if lastName field is missing', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: '',
                email: 'rakesh@mern.space',
                password: 'password',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })

        it('should return 400 status code if password field is missing', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: '',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })
    })

    describe('fields are not in proper format', () => {
        it('should trim the email field', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: '  rakeshsingh@mern.space   ',
                password: 'password',
            }

            await request(app).post('/auth/register').send(userData)

            const repository = connection.getRepository(User)
            const users = await repository.find()
            const user = users[0]
            expect(user.email).toBe('rakeshsingh@mern.space')
        })

        it('should return 400 status code if email is not valid', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakeshsingh@mern',
                password: 'password',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })

        it('should return 400 status code if password is less than 8 characters', async () => {
            const userData = {
                firstName: 'Rakesh',
                lastName: 'Singh',
                email: 'rakesh@mern.space',
                password: 'sceret',
            }

            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            expect(response.statusCode).toBe(400)
        })
    })
})
