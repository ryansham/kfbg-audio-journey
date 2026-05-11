import {defineType, defineField} from 'sanity'
import {CogIcon} from '@sanity/icons'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  __experimental_actions: ['update', 'publish'],
  groups: [
    {name: 'identity', title: '🏷️ App Identity'},
    {name: 'home', title: '🏠 Home Screen'},
    {name: 'images', title: '🖼️ Icons & Images'},
    {name: 'seo', title: '📣 Social / SEO'},
    {name: 'notice', title: '📢 Notice Bar'},
    {name: 'colours', title: '🎨 Colours'},
    {name: 'analytics', title: '📊 Analytics'},
  ],
  fields: [
    // ── App Identity ──
    defineField({
      name: 'app_name_en',
      title: 'App Name (English)',
      type: 'string',
      group: 'identity',
      initialValue: 'KFBG Self-guided Audio Journey',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'app_name_tc',
      title: 'App Name (繁中)',
      type: 'string',
      group: 'identity',
      initialValue: '自助語音旅程',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'org_name_en',
      title: 'Organisation Name (English)',
      type: 'string',
      group: 'identity',
      initialValue: 'Kadoorie Farm and Botanic Garden',
    }),
    defineField({
      name: 'org_name_tc',
      title: 'Organisation Name (繁中)',
      type: 'string',
      group: 'identity',
      initialValue: '嘉道理農場暨植物園',
    }),

    // ── Home Screen Content ──
    defineField({
      name: 'home_tagline_en',
      title: 'Home Tagline (English)',
      type: 'string',
      group: 'home',
      initialValue: 'Step off the path. Slow down. Let the forest speak.',
    }),
    defineField({
      name: 'home_tagline_tc',
      title: 'Home Tagline (繁中)',
      type: 'string',
      group: 'home',
      initialValue: '放慢腳步，讓自然引路。',
    }),
    defineField({
      name: 'home_description_en',
      title: 'Home Description (English)',
      type: 'text',
      rows: 3,
      group: 'home',
    }),
    defineField({
      name: 'home_description_tc',
      title: 'Home Description (繁中)',
      type: 'text',
      rows: 3,
      group: 'home',
      initialValue: '每條步道設有多個聆聽站，帶領你與大地深連。',
    }),
    defineField({
      name: 'home_why_title_en',
      title: '"Why We Created This" Section Title (English)',
      type: 'string',
      group: 'home',
      initialValue: 'Why we created this journey',
    }),
    defineField({
      name: 'home_why_title_tc',
      title: '"Why We Created This" Section Title (繁中)',
      type: 'string',
      group: 'home',
      initialValue: '我們為何創作這段旅程',
    }),
    defineField({
      name: 'home_why_body_en',
      title: '"Why We Created This" Body Text (English)',
      type: 'text',
      rows: 4,
      group: 'home',
    }),
    defineField({
      name: 'home_why_body_tc',
      title: '"Why We Created This" Body Text (繁中)',
      type: 'text',
      rows: 4,
      group: 'home',
    }),

    // ── Icons & Images ──
    defineField({
      name: 'app_icon',
      title: 'PWA App Icon',
      type: 'image',
      group: 'images',
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
      group: 'images',
      description: 'Required: 1200×630px JPEG — shown when the app link is shared',
      fields: [
        defineField({name: 'alt_en', title: 'Alt Text (English)', type: 'string'}),
        defineField({name: 'alt_tc', title: 'Alt Text (繁中)', type: 'string'}),
      ],
    }),

    // ── Social / SEO ──
    defineField({
      name: 'og_title_en',
      title: 'Default Social Share Title (English)',
      type: 'string',
      group: 'seo',
      initialValue: 'KFBG Self-guided Audio Journey',
    }),
    defineField({
      name: 'og_title_tc',
      title: 'Default Social Share Title (繁中)',
      type: 'string',
      group: 'seo',
      initialValue: '嘉道理農場暨植物園 自助語音旅程',
    }),
    defineField({
      name: 'og_description_en',
      title: 'Default Social Share Description (English)',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),
    defineField({
      name: 'og_description_tc',
      title: 'Default Social Share Description (繁中)',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),
    defineField({
      name: 'og_url',
      title: 'App URL',
      type: 'url',
      group: 'seo',
      initialValue: 'https://audio.kfbg.org',
    }),

    // ── Notice Bar ──
    defineField({
      name: 'notice_bar_enabled',
      title: 'Show Notice Bar',
      type: 'boolean',
      group: 'notice',
      description: 'Toggle the dark announcement bar at the top of the home screen',
      initialValue: false,
    }),
    defineField({
      name: 'notice_bar_text_en',
      title: 'Notice Bar Text (English)',
      type: 'string',
      group: 'notice',
      hidden: ({document}) => !document?.notice_bar_enabled,
    }),
    defineField({
      name: 'notice_bar_text_tc',
      title: 'Notice Bar Text (繁中)',
      type: 'string',
      group: 'notice',
      hidden: ({document}) => !document?.notice_bar_enabled,
    }),
    defineField({
      name: 'notice_bar_link',
      title: 'Notice Bar Link (optional)',
      type: 'url',
      group: 'notice',
      hidden: ({document}) => !document?.notice_bar_enabled,
    }),

    // ── Colours ──
    defineField({
      name: 'color_primary',
      title: 'Primary Colour (Olive)',
      type: 'string',
      group: 'colours',
      description: 'Hex code, e.g. #4A5C3A',
      initialValue: '#4A5C3A',
    }),
    defineField({
      name: 'color_accent',
      title: 'Accent Colour (Gold)',
      type: 'string',
      group: 'colours',
      description: 'Hex code, e.g. #C4A96A',
      initialValue: '#C4A96A',
    }),
    defineField({
      name: 'color_background',
      title: 'Background Colour (Cream)',
      type: 'string',
      group: 'colours',
      description: 'Hex code, e.g. #F7F3EC',
      initialValue: '#F7F3EC',
    }),

    // ── Analytics ──
    defineField({
      name: 'ga_measurement_id',
      title: 'Google Analytics Measurement ID',
      type: 'string',
      group: 'analytics',
      description: 'e.g. G-XXXXXXXXXX — leave blank to disable',
    }),
  ],
})
