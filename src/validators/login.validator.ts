import { checkSchema } from 'express-validator'

export default checkSchema({
    email: {
        trim: true,
        errorMessage: 'Email is required!',
        notEmpty: true,
        isEmail: {
            errorMessage: 'Email should be a valid email',
        },
    },

    password: {
        notEmpty: true,
        trim: true,
        errorMessage: 'Password is required',
    },
})
