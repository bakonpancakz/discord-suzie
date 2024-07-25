import { BADGE_WHITELIST, DATABASE, Log, pcall } from '../Constants'
import fs from 'fs'

const filename = 'BadgePullerResults.json'

export default async function BadgePullerFinish() {
    try {
        // Does File Exist?
        if (!fs.existsSync(filename)) {
            Log('BadgePuller', `File ${filename} does not exist!`)
            return
        }

        // Read and Parse File
        const rawJSON = JSON.parse(fs.readFileSync(filename, 'utf8'))
        if (rawJSON.BadgeIDs === undefined) throw `Missing Field: BadgeIDs`
        if (rawJSON.Collections === undefined) throw `Missing Field: Collections`

        // Validate Badge IDs
        const badgeIDs = new Array<number>()
        if (
            !Array.isArray(rawJSON?.BadgeIDs) ||
            !(rawJSON.BadgeIDs as Array<number>).every((id: number, i) => {
                if (typeof id !== 'number') throw `Badge ${id} at Index ${i}: Not a Number`
                if (!BADGE_WHITELIST.has(id)) throw `Badge ${id} at Index ${i}: Not Whitelisted`
                return badgeIDs.push(i)
            })
        ) throw 'Cannot Parse BadgeIDs'

        // Validate Collections
        if (typeof rawJSON.Collections !== 'object') throw 'Collections must be an Object'
        if (Array.isArray(rawJSON.Collections)) throw 'Collections cannot be an Array'
        for (const [someId, flags] of Object.entries<number>(rawJSON.Collections)) {
            // Validate Key and Value
            const userId = parseInt(someId)
            if (isNaN(userId)) throw `Key for ${someId} is Not a Number`
            if (typeof flags !== 'number') throw `Flags for ${someId} is Not a Number`

            // See if Badge was Collected
            for (let i = 0; i < badgeIDs.length; i++) {
                if ((flags & 1 << i) === 0) await pcall(
                    DATABASE.userBadges.create({
                        data: {
                            'robloxUserId': userId,
                            'robloxBadgeId': badgeIDs[i],
                        }
                    })
                )
            }
        }

    } catch (err) {
        Log('BadgePuller', `Error: ${err}`)
        return
    }

    // All Done ^_^
    Log('BadgePuller', `Entries Created. Call SyncRolesDB to update Roles.`)
}