import {defineType, defineField} from 'sanity'
import {CogIcon} from '@sanity/icons'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  // Prevent creating more than one — this is a singleton
  __experimental_actions: ['update', 'publish'],
  fields: [
    // ── App Identity ──
    defineField({
      name: 'app_name_en',
      title: 'App Name (English)',
      type: 'string',
      initialValue: 'KFBG Self-guided Audio Journey',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'app_name_tc',
      title: 'App Name (繁中)',
      type: 'string',
      initialValue: '自助語音旅程',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'org_name_en',
      title: 'Organisation Name (English)',
      type: 'string',
      initialValue: 'Kadoorie Farm and Botanic Garden',
    }),
    defineField({
      name: 'org_name_tc',
      title: 'Organisation Name (繁中)',
      type: 'string',
      initialValue: '嘉道理農場暨植物園',
    }),

    // ── Icons & Images ──
    defineField({
      name: 'app_icon',
      title: 'PWA App Icon',
      type: 'image',
      description: 'Required: 512×512px square PNG with white background',
      fields: [
        defineField({name: 'alt_en', title: 'Alt Text (English)', type: 'string', initialValue: 'KFBG'}),
        defineField({name: 'alt_tc', title: 'Alt Text (繁中)', type: 'string', initialValue: 'KFBG'}),
      ],
    }),
    defineField({
      name: 'og_image',
      title: 'Social Share Image (OG Image)',
      type: 'image',
      description: 'Required: 1200×630px JPEG — shown when the app link is shared',
      fields: [
        defineField({name: 'alt_en', title: 'Alt Text (English)', type: 'string'}),
        defineField({name: 'alt_tc', title: 'Alt Text (繁中)', type: 'string'}),
      ],
    }),

    // ── Social / SEO (global defaults) ──
    defineField({
      name: 'og_title_en',
      title: 'Default Social Share Title (English)',
      type: 'string',
      initialValue: 'KFBG Self-guided Audio Journey',
    }),
    defineField({
      name: 'og_title_tc',
      title: 'Default Social Share Title (繁中)',
      type: 'string',
      initialValue: '嘉道理農場暨植物園 自助語音旅程',
    }),
    defineField({
      name: 'og_description_en',
      title: 'Default Social Share Description (English)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'og_description_tc',
      title: 'Default Social Share Description (繁中)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'og_url',
      title: 'App URL',
      type: 'url',
      initialValue: 'https://audio.kfbg.org',
    }),

    // ── Home Screen Content ──
    defineField({
      name: 'home_tagline_en',
      title: 'Home Tagline (English)',
      type: 'string',
      initialValue: 'Step off the path. Slow down. Let the forest speak.',
    }),
    defineField({
      name: 'home_tagline_tc',
      title: 'Home Tagline (繁中)',
      type: 'string',
      initialValue: '放慢腳步，讓自然引路。',
    }),
    defineField({
      name: 'home_description_en',
      title: 'Home Description (English)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'home_description_tc',
      title: 'Home Description (繁中)',
      type: 'text',
      rows: 3,
      initialValue: '每條步道設有多個聆聽站，帶領你與大地深連。',
    }),
    defineField({
      name: 'home_why_title_en',
      title: '"Why We Created This" Section Title (English)',
      type: 'string',
      initialValue: 'Why we created this journey',
    }),
    defineField({
      name: 'home_why_title_tc',
      title: '"Why We Created This" Section Title (繁中)',
      type: 'string',
      initialValue: '我們為何創作這段旅程',
    }),
    defineField({
      name: 'home_why_body_en',
      title: '"Why We Created This" Body Text (English)',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'home_why_body_tc',
      title: '"Why We Created This" Body Text (繁中)',
      type: 'text',
      rows: 4,
    }),

    // ── Notice Bar ──
    defineField({
      name: 'notice_bar_enabled',
      title: 'Show Notice Bar',
      type: 'boolean',
      description: 'Toggle the dark announcement bar at the top of the home screen',
      initialValue: false,
    }),
    defineField({
      name: 'notice_bar_text_en',
      title: 'Notice Bar Text (English)',
      type: 'string',
      hidden: ({document}) => !document?.notice_bar_enabled,
    }),
    defineField({
      name: 'notice_bar_text_tc',
      title: 'Notice Bar Text (繁中)',
      type: 'string',
      hidden: ({document}) => !document?.notice_bar_enabled,
    }),
    defineField({
      name: 'notice_bar_link',
      title: 'Notice Bar Link (optional)',
      type: 'url',
      hidden: ({document}) => !document?.notice_bar_enabled,
    }),

    // ── Colours ──
    defineField({
      name: 'color_primary',
      title: 'Primary Colour (Olive)',
      type: 'string',
      description: 'Hex code, e.g. #4A5C3A',
      initialValue: '#4A5C3A',
    }),
    defineField({
      name: 'color_accent',
      title: 'Accent Colour (Gold)',
      type: 'string',
      description: 'Hex code, e.g. #C4A96A',
      initialValue: '#C4A96A',
    }),
    defineField({
      name: 'color_background',
      title: 'Background Colour (Cream)',
      type: 'string',
      description: 'Hex code, e.g. #F7F3EC',
      initialValue: '#F7F3EC',
    }),

    // ── Analytics ──
    defineField({
      name: 'ga_measurement_id',
      title: 'Google Analytics Measurement ID',
      type: 'string',
      description: 'e.g. G-XXXXXXXXXX — leave blank to disable',
    }),
  ],
})
