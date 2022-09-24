export const TestStatus = {
    UNKNOWN: 0,
    SUCCESS: 1,
    NONE: 2,
    RUNNING: 3,
    FAIL: 4
} as const

export type TestStatusType = typeof TestStatus[keyof typeof TestStatus]
