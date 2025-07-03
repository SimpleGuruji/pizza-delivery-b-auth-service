import { Repository } from 'typeorm'
import { User } from '../entity/User'
import { LimitedUserData, UserData } from '../types'
import createHttpError from 'http-errors'
import bcrypt from 'bcrypt'
import logger from '../config/logger'

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
        } catch (err) {
            if (err instanceof Error) {
                logger.error(err.message)
            }
            const error = createHttpError(
                500,
                'Failed to create the user in the database',
            )
            throw error
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

             
        } catch (err) {
            if (err instanceof Error) {
                logger.error(err.message)
            }
            const error = createHttpError(
                500,
                `Failed to find the user with ${email}  from the database`,
            )
            throw error
        }
    }

    async findById(id: number) {
        try {
            return await this.userRepository.findOne({
                where: { id },
            })

             
        } catch (err) {
            if (err instanceof Error) {
                logger.error(err.message)
            }
            const error = createHttpError(
                500,
                `Failed to find the user of ${id} from the database`,
            )
            throw error
        }
    }

    async findAll() {
        try {
            return await this.userRepository.find()

             
        } catch (err) {
            if (err instanceof Error) {
                logger.error(err.message)
            }
            const error = createHttpError(
                500,
                'Failed to find all the users from the database',
            )
            throw error
        }
    }

    async deleteById(id: number) {
        try {
            return await this.userRepository.delete(id)
        } catch (err) {
            if (err instanceof Error) {
                logger.error(err.message)
            }
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
             
        } catch (err) {
            if (err instanceof Error) {
                logger.error(err.message)
            }
            const error = createHttpError(
                500,
                'Failed to update the user in the database',
            )
            throw error
        }
    }
}
