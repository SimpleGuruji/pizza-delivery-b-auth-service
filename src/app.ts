import 'reflect-metadata'
import express, { NextFunction, Request, Response } from 'express'
import { HttpError } from 'http-errors'
import cookieParser from 'cookie-parser'
import logger from './config/logger'
import authRouter from './routes/auth.routes'
import tenantRouter from './routes/tenant.routes'
import userRouter from './routes/user.routes'

const app = express()

app.use(express.json())

app.use(cookieParser())

app.use(express.static('public', { dotfiles: 'allow' }))

app.get('/', (req, res) => {
    res.status(200).send('Hello World!')
})

app.use('/auth', authRouter)
app.use('/tenants', tenantRouter)
app.use('/users', userRouter)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || err.status || 500

    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: '',
                location: '',
            },
        ],
    })
})

export default app
