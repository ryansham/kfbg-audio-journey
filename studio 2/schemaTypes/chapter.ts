import {defineType, defineField} from 'sanity'

// Chapter is an object type — embedded as an array inside Journey
export const chapter = defineType({
  name: 'chapter',
  title: 'Chapter',
  type: 'object',
  preview: {
    select: {
      title: 'short_title_tc',
      subtitle: 'location_tc',
      media: 'image',
    },
    prepare({title, subtitle, media}) {
      return {title: title || 'Untitled chapter', subtitle, media}
    },
  },
  fields: [
    // ── Identity ──
    defineField({
      name: 'chapter_number',
      title: 'Chapter Number',
      type: 'number',
      validation: (R) => R.required().min(1).max(20),
    }),
    defineField({
      name: 'visible',
      title: 'Visible',
      type: 'boolean',
      description: 'Uncheck to hide this chapter without deleting it',
      initialValue: true,
    }),
    defineField({
      name: 'location_en',
      title: 'Location Name (English)',
      type: 'string',
      description: 'e.g. Plaza',
    }),
    defineField({
      name: 'location_tc',
      title: 'Location Name (繁中)',
      type: 'string',
      description: 'e.g. 廣場',
    }),
    defineField({
      name: 'short_title_en',
      title: 'Short Title (English)',
      type: 'string',
      description: 'Used in player bar — e.g. The Beginning',
    }),
    defineField({
      name: 'short_title_tc',
      title: 'Short Title (繁中)',
      type: 'string',
      description: 'e.g. 連結之始',
    }),
    defineField({
      name: 'full_title_en',
      title: 'Full Title (English)',
      type: 'string',
      description: 'e.g. The Beginning: Entering the Garden',
    }),
    defineField({
      name: 'full_title_tc',
      title: 'Full Title (繁中)',
      type: 'string',
      description: 'e.g. 連結之始：進入園區與五感體驗',
    }),

    // ── Image ──
    defineField({
      name: 'image',
      title: 'Chapter Photo',
      type: 'image',
      description: 'Recommended: 1200×675px (16:9)',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt_en',
          title: 'Alt Text (English)',
          type: 'string',
        }),
        defineField({
          name: 'alt_tc',
          title: 'Alt Text (繁中)',
          type: 'string',
        }),
      ],
    }),

    // ── Audio ──
    defineField({
      name: 'audio_url',
      title: 'Audio URL',
      type: 'url',
      description: 'Full URL to the MP3 file on the KFBG server, e.g. https://audio.kfbg.org/audio/grounding-walk/grounding-walk-ch01.mp3',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'audio_duration_seconds',
      title: 'Audio Duration (seconds)',
      type: 'number',
      description: 'e.g. 391 for 6:31 — lets the app show duration before the file loads',
    }),

    // ── Content ──
    defineField({
      name: 'description_en',
      title: 'Description (English)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'description_tc',
      title: 'Description (繁中)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'practice_en',
      title: '正念練習 / Mindful Practice (English)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'practice_tc',
      title: '正念練習 / Mindful Practice (繁中)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'transcript_tc',
      title: 'Audio Transcript (繁中)',
      type: 'text',
      rows: 8,
      description: 'Transcript is displayed in Chinese only in the app',
    }),
  ],
})
