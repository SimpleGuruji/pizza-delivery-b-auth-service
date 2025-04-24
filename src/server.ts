import app from './app'
import { Config } from './config/index'
import logger from './config/logger'

const startServer = () => {
    const port = Config.PORT

    try {
        app.listen(port, () => logger.info(`Server running  on port ${port}.`))
    } catch (error) {
        console.error('Error starting server', error)
        process.exit(1)
    }
}

startServer()
