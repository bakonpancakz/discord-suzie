import { BADGE_WHITELIST, DATABASE, Log } from '../../Constants'
import { Request, Response } from 'express'
import AwardRole from '../../functions/AwardRole'

export default async function POST_Sync(req: Request, res: Response) {
    const userId: number = req.body.userId
    const roleId: number = req.body.roleId
    const badgeIds = (req.body.badgeIds as string).split(',').map(p => parseInt(p))

    // Store Collected Badges
    let insertsOK = false
    const insertPromises = await Promise.allSettled(
        badgeIds.map(badgeId => {
            DATABASE.userBadges.create({
                data: {
                    'robloxBadgeId': badgeId,
                    'robloxUserId': userId,
                }
            })
        })
    )
    for (const somePromise of insertPromises) {
        if (somePromise.status === 'rejected') {
            if (somePromise.reason?.code !== 'P2002') {
                Log('/badges/sync', `Insert Error: ${somePromise.reason}`)
                insertsOK = false
            }
        }
    }
    if (!insertsOK) return res.sendStatus(500)

    // Award User their Role ^_^
    AwardRole(userId, badgeIds.length, roleId)
    Log('/badges/sync', `Synced User (${userId}) collected ${badgeIds.length} of ${BADGE_WHITELIST.size}`)
    return res.sendStatus(200)
}