import { DATABASE, GROUP_ID, Log, pcall, ROLES_CACHE, ROLES_WHITELIST } from '../Constants'
import { APIResponse, GroupMember } from './typings'
import AwardRole from '../functions/AwardRole'
import API from '../class/API'

/**
 * Syncs the Group Roles with Collected Badges Record in Database
 */
export default async function SyncRolesDB() {

    Log('SyncRolesDB', 'Fetching Group Members')
    let cursor = ''
    let memberCount = 0
    const started = Date.now()
    const members = new Array<{
        userId: number
        roleId: number
    }>()
    while (true) {
        // Send API Request
        const [ok, body] = await API.fetch<APIResponse<Array<GroupMember>>>(
            'GET', `https://groups.roblox.com/v1/groups/${GROUP_ID}/users?limit=100&cursor=${cursor}`
        )
        if (!ok) {
            Log('SyncRolesDB', `Cannot fetch Group Members\n${body}`)
            return SyncRolesDB()
        }

        // Collect Members
        for (const someMember of body.data) {
            memberCount++
            if (!ROLES_WHITELIST.has(someMember.role.id)) {
                ROLES_CACHE.set(someMember.user.userId, someMember.role.id)
                continue
            }
            members.push({
                'userId': someMember.user.userId,
                'roleId': someMember.role.id,
            })
        }

        // Fetch Next Page (if Required)
        if (body.nextPageCursor) {
            cursor = body.nextPageCursor
            continue
        }
        break
    }

    Log('SyncRoleDB', `Syncing ${members.length}/${memberCount} Members`)
    for await (const { userId, roleId } of members) {
        const [collectedBadges, countError] = await pcall(
            DATABASE.userBadges.count({
                where: {
                    robloxUserId: userId,
                }
            })
        )
        if (countError) {
            Log('SyncRolesDB', `Count Error: ${countError}`)
            continue
        }

        // Award User Role
        await AwardRole(userId, collectedBadges, roleId)
    }

    // All done! ^_^
    Log('SyncRolesDB', `Process Completed in ${((Date.now() - started) / 60000).toLocaleString()} minutes`)
}