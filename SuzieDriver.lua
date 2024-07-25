local HttpService = game:GetService("HttpService")
local RobloxProxy = require(game.ServerStorage.RobloxProxy)
local Options = {
	['BaseURL']  = 'http://localhost:1273',
	['Password'] = 'suzie',
	['GroupID']  = 10781692,
}

return {
	['BadgesAward'] = function(UserID: number, BadgeID: string)
		print(`[SUZIE] Syncing Award for User {UserID} and Badge {BadgeID}`)
		return pcall(function()
			HttpService:PostAsync(
				`{Options.BaseURL}/badges/award`,
				HttpService:JSONEncode({
					['userId']   = UserID,
					['badgeId']  = BadgeID
				}),
				Enum.HttpContentType.ApplicationJson,
				false,
				{Authorization = Options.Password}
			)
		end)
	end,
	
	['BadgesSync'] = function(UserID: number, BadgeIDs: {number}, RoleID: number)
		BadgeIDs = table.concat(BadgeIDs, ',') 
		print(`[SUZIE] Deep Syncing Award for User {UserID} and Badges {BadgeIDs}`)
		return pcall(function()
			HttpService:PostAsync(
				`{Options.BaseURL}/badges/sync`,
				HttpService:JSONEncode({
					['userId']   = UserID, 
					['roleId']   = RoleID, 
					['badgeIds'] = BadgeIDs
				}),
				Enum.HttpContentType.ApplicationJson,
				false,
				{Authorization = Options.Password}
			)
		end)
	end,	
}