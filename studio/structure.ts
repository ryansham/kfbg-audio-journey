import {StructureBuilder} from 'sanity/structure'
import {BookIcon, CogIcon, TranslateIcon, UserIcon} from '@sanity/icons'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('KFBG Audio Journey')
    .items([
      // ── Journeys ──
      S.listItem()
        .title('Journeys')
        .icon(BookIcon)
        .child(
          S.documentTypeList('journey')
            .title('All Journeys')
            .defaultOrdering([{field: 'journey_number', direction: 'asc'}])
        ),

      S.divider(),

      // ── Speakers ──
      S.listItem()
        .title('Speakers')
        .icon(UserIcon)
        .child(S.documentTypeList('speaker').title('All Speakers')),

      S.divider(),

      // ── Singletons ──
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings')
        ),

      S.listItem()
        .title('UI Strings')
        .icon(TranslateIcon)
        .child(
          S.document()
            .schemaType('uiStrings')
            .documentId('uiStrings')
            .title('UI Strings (All interface text EN + 繁中)')
        ),
    ])
