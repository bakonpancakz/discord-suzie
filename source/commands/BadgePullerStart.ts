import { BADGE_WHITELIST, GROUP_ID, Log, ROLES_CACHE, ROLES_WHITELIST } from '../Constants'
import { APIResponse, GroupMember } from './typings'
import API from '../class/API'
import fs from 'fs'

export default async function BadgePullerStart() {
    Log('BadgePuller', 'Preparing Script...')

    // Fetch Group Members
    let cursor = ''
    const groupMembers = new Array<number>()
    while (true) {
        // Send API Request
        const [ok, body] = await API.fetch<APIResponse<Array<GroupMember>>>(
            'GET', `https://groups.roblox.com/v1/groups/${GROUP_ID}/users?limit=100&cursor=${cursor}`
        )
        if (!ok) {
            Log('SyncRolesDB', `Cannot fetch Group Members\n${body}`)
            return
        }

        // Collect Members
        for (const someMember of body.data) {
            if (!ROLES_WHITELIST.has(someMember.role.id)) {
                ROLES_CACHE.set(someMember.user.userId, someMember.role.id)
                continue
            }
            groupMembers.push(someMember.user.userId)
        }

        // Fetch Next Page (if Required)
        if (body.nextPageCursor) {
            cursor = body.nextPageCursor
            continue
        }
        break
    }

    // Write Script to Disk
    fs.writeFileSync('BadgePuller.lua', LuaScript
        .replace('<USERID>', groupMembers.join(','))
        .replace('<BADGEID>', Array.from(BADGE_WHITELIST).join(','))
        .trim()
    )
    Log('BadgePuller',
        '\nPlease follow these steps:\n' +
        '1. Run the BadgePuller.lua script (written to disk) in ROBLOX Studio.\n' +
        '2. Copy the Output into a new file named BadgePullerResults.json\n' +
        `3. Run the Command 'BadgePullerFinish'`
    )
}

const LuaScript = `
local UserIDs  = string.split('<USERID>', ',')
local BadgeIDs = string.split('<BADGEID>', ',')
local BadgeService = game:GetService('BadgeService')
local HttpService  = game:GetService('HttpService')
local Started  = os.time()
local Results  = {}

print('[BADGEPULLER] Running Script... A sound will play when complete.')

-- Count Amount of Users for Progress
local TotalUsers = 0
for _ in pairs(UserIDs) do
	TotalUsers = TotalUsers + 1
end

-- Collect Badges for Users
for v, UserID in pairs(UserIDs) do 
	local Collected = 0
	Results[UserID] = 0	
	for i, BadgeID in pairs(BadgeIDs) do
		BadgeIDs[i] = tonumber(BadgeID)
		BadgeID = BadgeIDs[i]
		while true  do
			local OwnsBadge = false
			local OK, Error = pcall(function()
				OwnsBadge = BadgeService:UserHasBadgeAsync(UserID, BadgeID)
			end)
			if OK then
				if OwnsBadge then
					Results[UserID] = bit32.bor(Results[UserID], bit32.lshift(1, i))
					Collected = Collected + 1
				end
				break	
			else
				print(\`{UserID}:{BadgeID}\`, Error)
				task.wait(3)
			end
		end
	end
	print(\`[BADGEPULLER] User ID {UserID} has collected {Collected} Badges ({v}/{TotalUsers})\`)
end

-- Play Sound
local PlayerService = game:GetService('Players')
for _, SomePlayer: Player in PlayerService:GetPlayers() do
	local ScreenInstance  = Instance.new('ScreenGui', SomePlayer.PlayerGui)
	local SoundInstance   = Instance.new('Sound', ScreenInstance)
	SoundInstance.SoundId = 'rbxassetid://6432593850'
	SoundInstance:Play()
end

-- Script Output
print(
	\`[BADGEPULLER] Finished in {math.round((os.time() - Started)/60)} minutes. \`..
	\`Please take this JSON and place it into a new file named 'BadgePullerResults.json' and run the command 'BadgePullerFinish' \`..
	\`Tip: You can right click the output to copy the output.\`
)
print(HttpService:JSONEncode({
	Collections = Results,
	BadgeIDs = BadgeIDs 
}))
`