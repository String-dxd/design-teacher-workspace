//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: ['.output/**', '.claude/**', '.nitro/**', '.tanstack/**'],
  },
]
