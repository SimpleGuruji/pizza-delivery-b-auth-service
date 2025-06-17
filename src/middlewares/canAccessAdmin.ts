import createHttpError from 'http-errors'
import { AuthRequest } from '../types'
import { Request, Response, NextFunction, RequestHandler } from 'express'

export const canAccessAdmin: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const _req = req as AuthRequest
    const roleFromToken = _req.auth.role

    if (roleFromToken !== 'admin') {
        const error = createHttpError(
            403,
            'You are not authorized to access this resource',
        )
        next(error)
        return
    }

    next()
}
