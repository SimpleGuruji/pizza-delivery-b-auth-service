import express, { RequestHandler, Request, Response } from 'express'
import { AuthController } from '../controllers/AuthController'
const router = express.Router()
import { UserService } from '../services/UserService'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const authController = new AuthController(userService)

router.post('/register', (async (req: Request, res: Response) => {
    await authController.register(req, res)
}) as RequestHandler)

export default router
