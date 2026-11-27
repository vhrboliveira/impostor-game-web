import { describe, expect, it } from 'vitest'
import { describeError } from './errorMessages'
import { ApiError } from './roomApi'
import { describeServerError } from './serverErrors'

const fallback = 'Algo deu errado. Tente novamente.'

describe('error texts', () => {
  // Codes are looked up in plain objects: inherited keys must not resolve to a member of
  // Object.prototype.
  it('ignores codes that are only inherited object keys', () => {
    for (const code of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(describeError(new ApiError(400, code))).toBe(fallback)
      expect(describeServerError(code)).toBe(fallback)
    }
  })

  it('explains the rate limit and a wrong content type', () => {
    expect(describeError(new ApiError(429, 'rate_limited'))).not.toBe(fallback)
    expect(describeError(new ApiError(415, 'unsupported_media_type'))).not.toBe(fallback)
  })
})
