export interface APIResponse<T> {
    previousPageCursor: string | null
    nextPageCursor: string | null
    data: T
}
export interface GroupMember {
    user: { userId: number }
    role: { id: number }
}

export interface InventoryResponse {
    IsValid: boolean
    Data: string | {
        nextPageCursor: string
        Items: Array<{
            Item: {
                AssetId: number
            }
        }>
    }
}