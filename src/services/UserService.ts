import { Repository } from 'typeorm'
import { User } from '../entity/User'
import { UserData } from '../types'
import createHttpError from 'http-errors'
import { Roles } from '../constants'

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    // Constructor logic if needed

    async create({ firstName, lastName, email, password }: UserData) {
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password,
                role: Roles.CUSTOMER, // Default role
            })
        } catch (error) {
            const err = createHttpError(500, 'Failed to store user')
            throw err
        }
    }
}
