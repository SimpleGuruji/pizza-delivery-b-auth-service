import express, {
    RequestHandler,
    Request,
    Response,
    NextFunction,
} from 'express'
import { AuthController } from '../controllers/AuthController'
const router = express.Router()
import { UserService } from '../services/UserService'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import logger from '../config/logger'
import registerValidator from '../validators/register.validator'
import { TokenService } from '../services/TokenService'
import { RefreshToken } from '../entity/RefreshToken'

const userRepository = AppDataSource.getRepository(User)
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken)
const userService = new UserService(userRepository)
const tokenService = new TokenService(refreshTokenRepository)
const authController = new AuthController(userService, logger, tokenService)

router.post('/register', registerValidator, (async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    await authController.register(req, res, next)
}) as RequestHandler)

export default router
