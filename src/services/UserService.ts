import { Repository } from 'typeorm'
import { User } from '../entity/User'
import { UserData } from '../types'
import createHttpError from 'http-errors'
import { Roles } from '../constants'
import bcrypt from 'bcrypt'

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    // Constructor logic if needed

    async create({ firstName, lastName, email, password }: UserData) {
        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
            where: { email },
        })
        if (existingUser) {
            const err = createHttpError(400, 'User already exists')
            throw err
        }

        // Hash the password
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: Roles.CUSTOMER, // Default role
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            const err = createHttpError(500, 'Failed to store user')
            throw err
        }
    }
}
