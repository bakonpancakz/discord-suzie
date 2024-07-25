import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Log Message to console, errors can generally be ignored.
export function Log(service: string, message: string) {
    process.stdout.write(`${new Date().toISOString()} | ${service}: ${message}\n`)
}

// Asynchronous Protected Call
export async function pcall<T>(somePromise: T): Promise<[Awaited<T>, any]> {
    try {
        return [await somePromise, undefined]
    } catch (err) {
        return [undefined as any, err]
    }
}

// Sleep for x milliseconds
export async function sleep(t: number) {
    return new Promise<void>(r => setTimeout(() => r(), t))
}

// Options
config()
export const WEB_HOSTNAME = (process.env.WEB_HOSTNAME || '127.0.0.1')
export const WEB_PORT = (process.env.WEB_PORT || '1273')
export const WEB_PASS = (process.env.WEB_PASS || 'suzie')
export const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE
export const DATABASE = new PrismaClient()
export const BADGE_WHITELIST = new Set<number>()
export const ROLES_CACHE = new Map<number, number>()

/** ROBLOX Group ID */
export const GROUP_ID = 10781692

/** ROBLOX Group Roles */
export const GROUP_ROLES = {
    Newbie: 85526356,
    Beginner: 88722567,
    Intermediate: 88722568,
    Professional: 88722570,
    Completionist: 103110248,
    // Other Roles
    BugCatcher: 86196248,
    VIP: 85526370,
    AlumniMember: 85526373,
    ActiveMember: 85526374,
    GroupManager: 86347130,
    TheBoss: 63832311,
}

/* Roles that can participate in the Role Awards program */
export const ROLES_WHITELIST = new Set<number>([
    GROUP_ROLES.Newbie,
    GROUP_ROLES.Beginner,
    GROUP_ROLES.Intermediate,
    GROUP_ROLES.Professional,
    GROUP_ROLES.Completionist,
])