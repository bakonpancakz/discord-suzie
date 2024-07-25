import { BADGE_WHITELIST, DATABASE, GROUP_ID, Log, pcall, ROLES_CACHE, ROLES_WHITELIST } from '../Constants'
import { APIResponse, GroupMember, InventoryResponse } from './typings'
import AwardRole from '../functions/AwardRole'
import API from '../class/API'

/**
 * This is a long process, it requires making LOTS of Inventory related API Requests
 * and will take a long time to complete due to ratelimiting.
 */
export default async function SyncRolesAPI() {

    Log('SyncRolesAPI', 'Fetching Group Members')
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
            Log('SyncRolesAPI', `Cannot fetch Group Members\n${body}`)
            return SyncRolesAPI()
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


    Log('SyncRolesAPI', `Fetching Inventories for ${members.length} of ${memberCount} Members`)
    let progress = 1
    for await (const { userId, roleId } of members) {

        // Progess Report
        Log('SyncRolesAPI',
            `[${progress++}/${members.length}] ` +
            `Collecting Badges for User (${userId})`
        )

        // Count Collected Badges for User
        const [collectedCount, relevantCount] = await new Promise<[number, number]>(async ok => {
            cursor = ''
            let pageId = 1
            let countAll = 0
            let countRelevant = 0
            while (true) {
                // Send API Request
                const [ok, body] = await API.fetch<InventoryResponse>(
                    'GET',
                    `https://www.roblox.com/users/inventory/list-json` +
                    `?assetTypeId=21` +
                    `&cursor=${encodeURIComponent(cursor)}` +
                    `&itemsPerPage=100` +
                    `&pageNumber=${pageId}` +
                    `&userId=${userId}`,
                    undefined,
                    0
                )
                if (!ok) {
                    Log('SyncRolesAPI', `Cannot fetch Inventory\n${body}`)
                    break
                }
                if (typeof body.Data === 'string') {
                    Log('SyncRolesAPI', `Skipping User (${userId}) Reason: '${body.Data}'`)
                    break
                }

                // Collect Badges
                for (const someItem of body.Data.Items) {
                    countAll++
                    if (!BADGE_WHITELIST.has(someItem.Item.AssetId)) break
                    await pcall(
                        DATABASE.userBadges.create({
                            data: {
                                'robloxUserId': userId,
                                'robloxBadgeId': someItem.Item.AssetId,
                            }
                        })
                    )
                    countRelevant++
                }

                // Finish Early if theyre a completionist
                if (countRelevant === BADGE_WHITELIST.size) break

                // Fetch Next Page (if Required)
                if (body.Data.nextPageCursor) {
                    cursor = body.Data.nextPageCursor
                    pageId++
                    continue
                }
                break
            }
            ok([countAll, countRelevant])
        })

        // Skip if User has zero badges (usually a priavate inventory)
        if (collectedCount === 0) continue

        // Award User their appropriate Role
        AwardRole(userId, relevantCount, roleId)
    }

    // All done! ^_^
    Log('SyncRolesAPI', `Process Completed in ${((Date.now() - started) / 60000).toLocaleString()} minutes`)
}

