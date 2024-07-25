import { BADGE_WHITELIST, DATABASE, Log, pcall } from '../../Constants'
import { Request, Response } from 'express'
import AwardRole from '../../functions/AwardRole'

export default async function POST_Award(req: Request, res: Response) {
    const userID: number = req.body.userId
    const badgeID: number = req.body.badgeId

    // Is Badge Whitelisted?
    if (!BADGE_WHITELIST.has(badgeID))
        return res.sendStatus(404)

    // Insert Badge to Database
    const [_, insertError] = await pcall(
        DATABASE.userBadges.create({
            data: {
                'robloxUserId': userID,
                'robloxBadgeId': badgeID,
            }
        })
    )
    if (insertError && insertError?.code !== 'P2002') {
        Log('/badges/award', `Insert Error: ${insertError}`)
        return res.sendStatus(500)
    }

    // Count Collected Badge
    const [collectedCount, countError] = await pcall(
        DATABASE.userBadges.count({
            where: {
                'robloxUserId': userID,
            }
        })
    )
    if (countError) {
        Log('/badges/award', `Count Error: ${countError}`)
        return res.sendStatus(500)
    }

    // Award User their Role ^_^
    AwardRole(userID, collectedCount)
    Log('/badges/award', `User ${userID} collected ${collectedCount} of ${BADGE_WHITELIST.size} badges`)
    return res.sendStatus(200)
}