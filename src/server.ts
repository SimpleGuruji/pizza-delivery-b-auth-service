import app from './app'
import { AppDataSource } from './config/data-source'
import { Config } from './config/index'
import logger from './config/logger'

const startServer = async () => {
    const port = Config.PORT

    try {
        await AppDataSource.initialize()
        logger.info('Database connection established successfully.')

        app.listen(port, () => logger.info(`Server running  on port ${port}.`))
    } catch (error) {
        console.error('Error starting server', error)
        process.exit(1)
    }
}

void startServer()
