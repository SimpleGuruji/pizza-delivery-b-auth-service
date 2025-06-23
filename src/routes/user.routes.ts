import Router, { Request, Response, NextFunction } from 'express'
import authenticate from '../middlewares/authenticate'
import { canAccessAdmin } from '../middlewares/canAccessAdmin'
import createUserValidator from '../validators/create-user.validator'
import { UserController } from '../controllers/UserController'
import { UserService } from '../services/UserService'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import logger from '../config/logger'

const router = Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const userController = new UserController(userService, logger)

router.post(
    '/',
    authenticate,
    canAccessAdmin,
    createUserValidator,
    async (req: Request, res: Response, next: NextFunction) => {
        await userController.create(req, res, next)
    },
)

router.patch(
    '/:id',
    authenticate,
    canAccessAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
        await userController.update(req, res, next)
    },
)

router.get(
    '/:id',
    authenticate,
    canAccessAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
        await userController.getOne(req, res, next)
    },
)

router.get(
    '/',
    authenticate,
    canAccessAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
        await userController.getAll(req, res, next)
    },
)
router.delete(
    '/:id',
    authenticate,
    canAccessAdmin,
    async (req: Request, res: Response, next: NextFunction) => {
        await userController.delete(req, res, next)
    },
)

export default router
