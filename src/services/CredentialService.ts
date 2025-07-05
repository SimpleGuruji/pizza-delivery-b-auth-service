import bcrypt from 'bcryptjs'

export class CredentialService {
    async comparePassword(
        userPassword: string,
        hashPassword: string,
    ): Promise<boolean> {
        // Compare the user password with the provided password

        return await bcrypt.compare(userPassword, hashPassword)
    }
}
