import {defineType, defineField} from 'sanity'
import {BookIcon} from '@sanity/icons'

export const journey = defineType({
  name: 'journey',
  title: 'Journey',
  type: 'document',
  icon: BookIcon,
  groups: [
    {name: 'identity', title: '🔖 Identity & Status', default: true},
    {name: 'content', title: '✍️ Content'},
    {name: 'images', title: '🖼️ Images & Map'},
    {name: 'seo', title: '📣 Social / SEO'},
    {name: 'coming_soon', title: '🔒 Coming Soon'},
    {name: 'completion', title: '✅ Completion'},
  ],
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
    // ── Identity & Status ──
    defineField({
      name: 'slug',
      title: 'Slug (URL-safe ID)',
      type: 'slug',
      group: 'identity',
      description: 'e.g. grounding-walk — used in URLs and file paths',
      options: {source: 'title_en'},
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'journey_number',
      title: 'Journey Number',
      type: 'number',
      group: 'identity',
      description: 'Controls display order on the home screen',
      validation: (R) => R.required().min(1),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'identity',
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
    defineField({
      name: 'speaker',
      title: 'Speaker / Guide',
      type: 'reference',
      group: 'identity',
      to: [{type: 'speaker'}],
    }),

    // ── Content ──
    defineField({
      name: 'title_en',
      title: 'Title (English)',
      type: 'string',
      group: 'content',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'title_tc',
      title: 'Title (繁中)',
      type: 'string',
      group: 'content',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'tagline_en',
      title: 'Tagline (English)',
      type: 'string',
      group: 'content',
      description: 'Short description shown on the home card',
    }),
    defineField({
      name: 'tagline_tc',
      title: 'Tagline (繁中)',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'label_en',
      title: 'Card Label (English)',
      type: 'string',
      group: 'content',
      description: 'e.g. Journey 01 · Available now',
      initialValue: 'Journey 01 · Available now',
    }),
    defineField({
      name: 'label_tc',
      title: 'Card Label (繁中)',
      type: 'string',
      group: 'content',
      description: 'e.g. 旅程 01 · 現已開放',
      initialValue: '旅程 01 · 現已開放',
    }),
    defineField({
      name: 'area_en',
      title: 'Area / Location Tag (English)',
      type: 'string',
      group: 'content',
      description: 'e.g. Lower Hillside — shown as badge on card image',
    }),
    defineField({
      name: 'area_tc',
      title: 'Area / Location Tag (繁中)',
      type: 'string',
      group: 'content',
      description: 'e.g. 下山區',
    }),
    defineField({
      name: 'stop_count',
      title: 'Number of Stops',
      type: 'number',
      group: 'content',
      description: 'Shown on the home card, e.g. 5',
    }),
    defineField({
      name: 'chapters',
      title: 'Chapters',
      type: 'array',
      group: 'content',
      of: [{type: 'chapter'}],
      description: 'Drag to reorder. Each chapter is one audio stop on the trail.',
    }),

    // ── Images & Map ──
    defineField({
      name: 'card_image',
      title: 'Home Screen Card Image',
      type: 'image',
      group: 'images',
      description: 'Recommended: 1600×900px (16:9)',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt_en', title: 'Alt Text (English)', type: 'string'}),
        defineField({name: 'alt_tc', title: 'Alt Text (繁中)', type: 'string'}),
      ],
    }),
    defineField({
      name: 'map_preview_image',
      title: 'Map Preview Image (thumbnail)',
      type: 'image',
      group: 'images',
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
      group: 'images',
      description: 'Shown when user taps the expand button — full KFBG map',
      options: {hotspot: false},
      fields: [
        defineField({name: 'alt_en', title: 'Alt Text (English)', type: 'string'}),
        defineField({name: 'alt_tc', title: 'Alt Text (繁中)', type: 'string'}),
      ],
    }),

    // ── Social / SEO ──
    defineField({
      name: 'og_title_en',
      title: 'Social Share Title (English)',
      type: 'string',
      group: 'seo',
      description: 'Shown when this journey link is shared — leave blank to use app default',
    }),
    defineField({
      name: 'og_title_tc',
      title: 'Social Share Title (繁中)',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'og_description_en',
      title: 'Social Share Description (English)',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),
    defineField({
      name: 'og_description_tc',
      title: 'Social Share Description (繁中)',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),

    // ── Coming Soon ──
    defineField({
      name: 'teaser_en',
      title: 'Coming Soon Teaser (English)',
      type: 'string',
      group: 'coming_soon',
      description: 'Shown when status is Coming Soon',
      hidden: ({document}) => document?.status !== 'coming_soon',
    }),
    defineField({
      name: 'teaser_tc',
      title: 'Coming Soon Teaser (繁中)',
      type: 'string',
      group: 'coming_soon',
      hidden: ({document}) => document?.status !== 'coming_soon',
    }),
    defineField({
      name: 'expected_date',
      title: 'Expected Launch Date',
      type: 'date',
      group: 'coming_soon',
      description: 'Optional — shown as e.g. "Spring 2025"',
      hidden: ({document}) => document?.status !== 'coming_soon',
    }),

    // ── Completion ──
    defineField({
      name: 'completion_emoji',
      title: 'Completion Emoji',
      type: 'string',
      group: 'completion',
      initialValue: '🌿',
    }),
    defineField({
      name: 'completion_en',
      title: 'Completion Message (English)',
      type: 'text',
      rows: 2,
      group: 'completion',
      initialValue: 'You have completed all stops. Take a breath before you return.',
    }),
    defineField({
      name: 'completion_tc',
      title: 'Completion Message (繁中)',
      type: 'text',
      rows: 2,
      group: 'completion',
      initialValue: '你已完成全部站點。在回程前，靜靜感受此刻的覺察。',
    }),
  ],
})
