import {StructureBuilder} from 'sanity/structure'
import {BookIcon, CogIcon, TranslateIcon, UserIcon} from '@sanity/icons'
import {JourneyPreview} from './components/JourneyPreview'

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
            .child((documentId) =>
              S.document()
                .documentId(documentId)
                .schemaType('journey')
                .views([
                  S.view.form().title('Edit'),
                  S.view
                    .component(JourneyPreview)
                    .options({baseUrl: 'https://ryansham.github.io/kfbg-audio-journey'})
                    .title('Staging Preview'),
                  S.view
                    .component(JourneyPreview)
                    .options({baseUrl: 'https://audio.kfbg.org'})
                    .title('Production Preview'),
                ])
            )
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
