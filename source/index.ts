import SyncRolesAPI from './commands/SyncRolesAPI'
import SyncRolesDB from './commands/SyncRolesDB'
import SyncBadges from './commands/SyncBadges'
import BadgePullerStart from './commands/BadgePullerStart'
import BadgePullerFinish from './commands/BadgePullerFinish'
import { Log } from './Constants'
import './Express'

// Collect User Input
process.stdin.on('data', c => {
    const givenCommand = c.toString().trim()
    switch (givenCommand) {
        case 'SyncBadges': return SyncBadges()
        case 'SyncRolesDB': return SyncRolesDB()
        case 'SyncRolesAPI': return SyncRolesAPI()
        case 'BadgePullerStart': return BadgePullerStart()
        case 'BadgePullerFinish': return BadgePullerFinish()
        default: return Log('CLI',
            `\nUnknown Command '${givenCommand}', available commands are:` +
            `\n- SyncRolesAPI: Sync Member roles with amount of collected badges from API` +
            `\n- SyncRolesDB: Sync Member roles with amount of collected badges from Database` +
            `\n- SyncBadges: Sync Badge Whitelist with Public Group Places` +
            `\n- BadgePullerStart: Gives you variables to use for BadgePuller.lua Script` +
            `\n- BadgePullerFinish: Updates Database with Values from BadgePuller.lua Script`
        )
    }
});

(async () => {
    Log('CLI', 'Type help to see a list of commands')
    await SyncBadges()
})()