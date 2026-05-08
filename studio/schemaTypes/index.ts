import {journey} from './journey'
import {chapter} from './chapter'
import {speaker} from './speaker'
import {siteSettings} from './siteSettings'
import {uiStrings} from './uiStrings'

export const schemaTypes = [
  // Documents (appear in Studio sidebar)
  journey,
  speaker,
  siteSettings,
  uiStrings,
  // Object types (embedded, not standalone)
  chapter,
]
