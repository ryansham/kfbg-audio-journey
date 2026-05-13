import {defineType, defineField} from 'sanity'
import {BookIcon} from '@sanity/icons'

export const journey = defineType({
  name: 'journey',
  title: 'Journey',
  type: 'document',
  icon: BookIcon,
  preview: {
    select: {
      title: 'title_tc',
      subtitle: 'status',
      media: 'card_image',
    },
    prepare({title, subtitle, media}) {
      const statusLabel: Record<string, string> = {
        published: '🟢 Published',
        coming_soon: '🟡 Coming Soon',
        hidden: '⚫ Hidden',
      }
      return {
        title: title || 'Untitled Journey',
        subtitle: statusLabel[subtitle] || subtitle,
        media,
      }
    },
  },
  fields: [
    // ── Identity ──
    defineField({
      name: 'slug',
      title: 'Slug (URL-safe ID)',
      type: 'slug',
      description: 'e.g. grounding-walk — used in URLs and file paths',
      options: {source: 'title_en'},
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'journey_number',
      title: 'Journey Number',
      type: 'number',
      description: 'Controls display order on the home screen',
      validation: (R) => R.required().min(1),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: '🟢 Published — fully live and accessible', value: 'published'},
          {title: '🟡 Coming Soon — visible but locked', value: 'coming_soon'},
          {title: '⚫ Hidden — not shown in app', value: 'hidden'},
        ],
        layout: 'radio',
      },
      initialValue: 'hidden',
      validation: (R) => R.required(),
    }),

    // ── Content ──
    defineField({
      name: 'title_en',
      title: 'Title (English)',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'title_tc',
      title: 'Title (繁中)',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'tagline_en',
      title: 'Tagline (English)',
      type: 'string',
      description: 'Short description shown on the home card',
    }),
    defineField({
      name: 'tagline_tc',
      title: 'Tagline (繁中)',
      type: 'string',
    }),
    defineField({
      name: 'label_en',
      title: 'Card Label (English)',
      type: 'string',
      description: 'e.g. Journey 01 · Available now',
      initialValue: 'Journey 01 · Available now',
    }),
    defineField({
      name: 'label_tc',
      title: 'Card Label (繁中)',
      type: 'string',
      description: 'e.g. 旅程 01 · 現已開放',
      initialValue: '旅程 01 · 現已開放',
    }),
    defineField({
      name: 'area_en',
      title: 'Area / Location Tag (English)',
      type: 'string',
      description: 'e.g. Lower Hillside — shown as badge on card image',
    }),
    defineField({
      name: 'area_tc',
      title: 'Area / Location Tag (繁中)',
      type: 'string',
      description: 'e.g. 下山區',
    }),
    defineField({
      name: 'stop_count',
      title: 'Number of Stops',
      type: 'number',
      description: 'Shown on the home card, e.g. 5',
    }),

    // ── Images ──
    defineField({
      name: 'card_image',
      title: 'Home Screen Card Image',
      type: 'image',
      description: 'Recommended: 1600×900px (16:9)',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt_en', title: 'Alt Text (English)', type: 'string'}),
        defineField({name: 'alt_tc', title: 'Alt Text (繁中)', type: 'string'}),
      ],
    }),

    // ── Social / SEO (per journey) ──
    defineField({
      name: 'og_title_en',
      title: 'Social Share Title (English)',
      type: 'string',
      description: 'Shown when this journey link is shared — leave blank to use app default',
    }),
    defineField({
      name: 'og_title_tc',
      title: 'Social Share Title (繁中)',
      type: 'string',
    }),
    defineField({
      name: 'og_description_en',
      title: 'Social Share Description (English)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'og_description_tc',
      title: 'Social Share Description (繁中)',
      type: 'text',
      rows: 2,
    }),

    // ── Coming Soon teaser ──
    defineField({
      name: 'teaser_en',
      title: 'Coming Soon Teaser (English)',
      type: 'string',
      description: 'Shown when status is Coming Soon',
      hidden: ({document}) => document?.status !== 'coming_soon',
    }),
    defineField({
      name: 'teaser_tc',
      title: 'Coming Soon Teaser (繁中)',
      type: 'string',
      hidden: ({document}) => document?.status !== 'coming_soon',
    }),
    defineField({
      name: 'expected_date',
      title: 'Expected Launch Date',
      type: 'date',
      description: 'Optional — shown as e.g. "Spring 2025"',
      hidden: ({document}) => document?.status !== 'coming_soon',
    }),

    // ── Completion card ──
    defineField({
      name: 'completion_emoji',
      title: 'Completion Emoji',
      type: 'string',
      initialValue: '🌿',
    }),
    defineField({
      name: 'completion_en',
      title: 'Completion Message (English)',
      type: 'text',
      rows: 2,
      initialValue: 'You have completed all stops. Take a breath before you return.',
    }),
    defineField({
      name: 'completion_tc',
      title: 'Completion Message (繁中)',
      type: 'text',
      rows: 2,
      initialValue: '你已完成全部站點。在回程前，靜靜感受此刻的覺察。',
    }),

    // ── Attribution ──
    defineField({
      name: 'attribution_en',
      title: 'Attribution Line (English)',
      type: 'text',
      rows: 2,
      description: 'Shown above the speaker profile — e.g. "This audio content was co‑designed by KFBG and Dr. Stanley Chan..."',
      initialValue: 'This audio content was co‑designed by KFBG and Dr. Stanley Chan, with voice guidance provided by Dr. Stanley Chan.',
    }),
    defineField({
      name: 'attribution_tc',
      title: 'Attribution Line (繁中)',
      type: 'text',
      rows: 2,
      initialValue: '本語音內容，由KFBG及陳鑑忠博士共同設計，並由陳鑑忠博士作聲音導航。',
    }),

    // ── Relationships ──
    defineField({
      name: 'speaker',
      title: 'Speaker / Guide',
      type: 'reference',
      to: [{type: 'speaker'}],
    }),
    defineField({
      name: 'map_preview_image',
      title: 'Map Preview Image (thumbnail)',
      type: 'image',
      description: 'Shown in the in-app map panel — e.g. lower hillside area',
      options: {hotspot: false},
      fields: [
        defineField({name: 'alt_en', title: 'Alt Text (English)', type: 'string'}),
        defineField({name: 'alt_tc', title: 'Alt Text (繁中)', type: 'string'}),
      ],
    }),
    defineField({
      name: 'map_full_image',
      title: 'Map Full Image (fullscreen expand)',
      type: 'image',
      description: 'Shown when user taps the expand button — full KFBG map',
      options: {hotspot: false},
      fields: [
        defineField({name: 'alt_en', title: 'Alt Text (English)', type: 'string'}),
        defineField({name: 'alt_tc', title: 'Alt Text (繁中)', type: 'string'}),
      ],
    }),

    // ── Chapters ──
    defineField({
      name: 'chapters',
      title: 'Chapters',
      type: 'array',
      of: [{type: 'chapter'}],
      description: 'Drag to reorder. Each chapter is one audio stop on the trail.',
    }),
  ],
})
