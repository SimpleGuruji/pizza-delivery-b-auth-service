import { Repository } from 'typeorm'
import { User } from '../entity/User'
import { LimitedUserData, UserData } from '../types'
import createHttpError from 'http-errors'
import bcrypt from 'bcryptjs'

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    // Constructor logic if needed

    async create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
    }: UserData) {
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await this.userRepository.findOne({
            where: {
                email: email,
            },
        })

        if (user) {
            const err = createHttpError(
                400,
                'user with same email id already exists!!',
            )
            throw err
        }

        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                tenantId: tenantId ? { id: tenantId } : undefined,
            })
        } catch {
            const err = createHttpError(
                500,
                'failed to store the data in database',
            )
            throw err
        }
    }

    async findByEmailWithPassword(email: string) {
        try {
            return await this.userRepository.findOne({
                where: { email },
                select: [
                    'id',
                    'firstName',
                    'lastName',
                    'email',
                    'password',
                    'role',
                    'tenant',
                    'createdAt',
                    'updatedAt',
                ],
            })

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            const error = createHttpError(
                500,
                'Failed to find the user from the  database by email',
            )
            throw error
        }
    }

    async findById(id: number) {
        try {
            return await this.userRepository.findOne({
                where: { id },
            })

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            const error = createHttpError(
                500,
                'Failed to find the user from the  database by id',
            )
            throw error
        }
    }

    async findAll() {
        try {
            return await this.userRepository.find()

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            const error = createHttpError(
                500,
                'Failed to find all users from the database ',
            )
            throw error
        }
    }

    async deleteById(id: number) {
        try {
            return await this.userRepository.delete(id)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            const error = createHttpError(
                500,
                'Failed to delete the user in the database',
            )
            throw error
        }
    }

    async update(
        userId: number,
        { firstName, lastName, role }: LimitedUserData,
    ) {
        try {
            return await this.userRepository.update(userId, {
                firstName,
                lastName,
                role,
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            const error = createHttpError(
                500,
                'Failed to update the user in the database',
            )
            throw error
        }
    }
}
