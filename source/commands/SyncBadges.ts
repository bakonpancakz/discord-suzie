import { Log, BADGE_WHITELIST, GROUP_ID } from '../Constants'
import API from '../class/API'

/** 
 * Fetches all badges currently collectable from Group Games and places them in the BadgeWhitelist set.
 * 
 * NOTE: This function doesn't include pagination so only the first 100 badge will be collected from the first 100 games
 */
export default async function SyncBadges() {

    // Fetch List of Games
    const [ok, body] = await API.fetch<APIResponse>(
        'GET', `https://games.roblox.com/v2/groups/${GROUP_ID}/games?accessFilter=Public&limit=100`
    )
    if (!ok) {
        Log('SyncBadges', `Cannot fetch Group Games\n${body}`)
        return SyncBadges()
    }

    // Collect Badges for Games
    for await (const { id: somePlaceId } of body.data) {
        const [ok, body] = await API.fetch<APIResponse>(
            'GET', `https://badges.roblox.com/v1/universes/${somePlaceId}/badges?limit=100`
        )
        if (!ok) {
            Log('SyncBadges', `Cannot Fetch Badges\n${body}`)
            return SyncBadges()
        }
        for (const { id: someBadgeId } of body.data) {
            BADGE_WHITELIST.add(someBadgeId)
        }
    }

    // Collection Complete
    Log('SyncBadges', `Collected ${BADGE_WHITELIST.size} from ${body.data.length} place(s)`)
}

interface APIResponse {
    data: Array<{ id: number }>
}