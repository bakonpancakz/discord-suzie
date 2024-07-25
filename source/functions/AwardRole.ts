import { Log, ROLES_WHITELIST, GROUP_ID, BADGE_WHITELIST, ROLES_CACHE, GROUP_ROLES } from '../Constants'
import API from '../class/API'

// API returns more fields but theyre irrelevant...
interface APIResponse {
    data: Array<{
        group: { id: number }
        role: { id: number }
    }>
}

export default async function AwardRole(
    userID: number,
    badgesCollected: number,
    currentRoleId?: number
) {
    // Fetch Role from Cache
    if (!currentRoleId) currentRoleId = ROLES_CACHE.get(userID)

    // Fetch Role from ROBLOX API
    if (!currentRoleId) {
        currentRoleId = 0
        const [ok, body] = await API.fetch<APIResponse>(
            'GET', `https://groups.roblox.com/v1/users/${userID}/groups/roles`
        )
        if (!ok) {
            Log('AwardRole', `Cannot fetch roles for User (${userID})\n${body}`)
            return
        }

        // Find Group (Will be 0 if not in Group)
        const groupMembership = body.data.find(g => g.group.id === GROUP_ID)
        if (groupMembership) currentRoleId = groupMembership.role.id
    }

    // Is this role allowed to change?
    if (currentRoleId === 0) return
    if (!ROLES_WHITELIST.has(currentRoleId)) {
        Log('AwardRole', `User (${userID}) has an excluded Role (${currentRoleId})`)
        return
    }
    ROLES_CACHE.set(userID, currentRoleId)

    // Determine Role to Award
    let newRoleId = GROUP_ROLES.Newbie
    if (badgesCollected === BADGE_WHITELIST.size) newRoleId = GROUP_ROLES.Completionist
    else if (badgesCollected >= Math.floor(BADGE_WHITELIST.size * .8)) newRoleId = GROUP_ROLES.Professional
    else if (badgesCollected >= Math.floor(BADGE_WHITELIST.size * .5)) newRoleId = GROUP_ROLES.Intermediate
    else if (badgesCollected >= Math.floor(BADGE_WHITELIST.size * .2)) newRoleId = GROUP_ROLES.Beginner

    // Update Role (if neccessary)
    if (newRoleId !== currentRoleId) {
        const [ok, err] = await API.fetch<any>(
            'PATCH', `https://groups.roblox.com/v1/groups/${GROUP_ID}/users/${userID}`,
            { roleId: newRoleId }, 0
        )
        // All Done :3
        ok
            ? Log('AwardRole', `User (${userID}) was awarded a Role (${currentRoleId} => ${newRoleId}) (${badgesCollected})`)
            : Log('AwardRole', `Cannot Award Role to User (${userID})\n${err}`)
    }
} 