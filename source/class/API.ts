import { Log, pcall, ROBLOX_COOKIE, sleep } from '../Constants'

export default new (class API {

    private tokenCSRF: string | undefined
    private tokenCookie = ROBLOX_COOKIE

    // Test Cookie by fetching Account Pin Status
    constructor() {
        if (!this.tokenCookie) {
            Log('API', 'Missing ROBLOX Security Cookie')
            process.exit(1)
        }
        this
            .fetch('GET', 'https://auth.roblox.com/v1/account/pin')
            .then(([success, errors]) => {
                if (!success) {
                    Log('API', 'Invalid Cookie Provided\n' + errors)
                    process.exit(1)
                }
                Log('API', 'Cookie Validated')
            })
    }

    /**
     * Makes a Request to the ROBLOX API, returns two variables.
     * First Variable is a boolean indicating success
     * Second Variable is either a Response (if true) or String with Error Messages (if false)
     */
    public fetch<T>(method: string, url: string, body?: any, maxRetryAttempts = 3) {
        return new Promise<[boolean, T]>(async done => {

            // Generate Request
            const headers = new Headers()
            if (this.tokenCookie) headers.set('cookie', `.ROBLOSECURITY=${this.tokenCookie};`)
            if (this.tokenCSRF) headers.set('x-csrf-token', this.tokenCSRF)
            if (body) {
                headers.set('content-type', 'application/json')
                body = JSON.stringify(body)
            }
            let retryAttempts = 1
            let retryErrors = new Array<string>(
                `Request URL: ${method} ${url}`,
                `Request Body: ${body}`,
            )

            // Request Loop
            while (true) {
                // Send Fetch Request 
                const [resp, err] = await pcall(fetch(url, { method, headers, body }))
                if (err || !resp.ok) {

                    // Collect Error Message
                    const respBody = resp ? await resp.text() : `${err}`
                    retryErrors.push(`${resp.status} ${resp.statusText} - ${respBody}`)

                    // Sleep on Ratelimit
                    // Attempts to pull from headers but defaults to 3 seconds if unavailable
                    if (resp?.status === 429) {
                        await sleep(parseInt(resp.headers.get('x-ratelimit-reset') || '3') * 1_000)
                        continue
                    }

                    // Attempt to Recover from a Possible CSRF Error
                    if (resp?.status === 403) {

                        // Purposely make a Bad Request so we dont get logged out and retrieve
                        // a CSRF token in return as the server will give us one either way
                        const [resp2, err2] = await pcall(
                            fetch('https://auth.roblox.com/v2/logout', {
                                method: 'POST',
                                headers: {
                                    'Cookie': `.ROBLOSECURITY=${this.tokenCookie};`,
                                    'Referer': 'https://www.roblox.com',
                                }
                            })
                        )
                        if (resp2.ok || err2) {
                            done([false, retryErrors.join('\n') as T])
                            break
                        }

                        // Store Token
                        this.tokenCSRF = resp2.headers.get('x-csrf-token') as string
                        headers.set('x-csrf-token', this.tokenCSRF)
                        await sleep(1000)
                        continue
                    }

                    // Collect Generic Error and Retry
                    if (retryAttempts >= maxRetryAttempts) {
                        done([false, retryErrors.join('\n') as T])
                        break
                    }
                    retryAttempts++
                    await sleep(3000)
                    continue
                }

                // Parse Response Body
                try {
                    body = resp.headers.get('content-type')?.startsWith('application/json')
                        ? await resp.json()
                        : await resp.text()
                } catch (err) {
                    body = undefined
                }

                // Return Results
                done([true, body])
                break
            }

        })
    }

})