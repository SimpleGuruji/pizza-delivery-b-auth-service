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

    firstName: {
        notEmpty: true,
        errorMessage: 'First name is required',
    },

    lastName: {
        notEmpty: true,
        errorMessage: 'Last name is required',
    },

    password: {
        notEmpty: true,
        errorMessage: 'Password is required',
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password should be at least 8 characters long',
        },
    },

    role: {
        notEmpty: true,
        errorMessage: 'Role is required',
        trim: true,
    },
})
