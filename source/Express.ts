import { Log, WEB_HOSTNAME, WEB_PASS, WEB_PORT } from './Constants'
import POST_Award from './routes/badges/POST_Award'
import POST_Sync from './routes/badges/POST_Sync'
import express from 'express'

// Middleware to Validate Authorization Header Matches Password
function ValidatePass(req: express.Request, res: express.Response, next: express.NextFunction) {
    req.header('authorization') !== WEB_PASS
        ? res.sendStatus(401)
        : next()
}

// Middleware to Validate Request Body
function ValidateBody(options: { [key: string]: 'string' | 'number' }) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        Object.entries(options).every(([key, expectedType]) => {
            return (
                req.body[key] !== undefined &&
                typeof req.body[key] === expectedType
            )
        })
            ? next()
            : res.sendStatus(400)
    }
}

// Create Webserver
express()
    .disable('x-powered-by')
    .disable('etag')
    .post(
        '/badges/award',
        express.json(),
        ValidatePass,
        ValidateBody({ userId: 'number', badgeId: 'number' }),
        POST_Award
    )
    .post(
        '/badges/sync',
        express.json(),
        ValidatePass,
        ValidateBody({ userId: 'number', roleId: 'number', badgeIds: 'string' }),
        POST_Sync
    )
    .listen(
        parseInt(WEB_PORT), WEB_HOSTNAME,
        () => Log('EXPRESS', `Listening on ${WEB_HOSTNAME}:${WEB_PORT}`),
    )