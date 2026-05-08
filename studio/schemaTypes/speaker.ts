import {defineType, defineField} from 'sanity'
import {UserIcon} from '@sanity/icons'

export const speaker = defineType({
  name: 'speaker',
  title: 'Speaker',
  type: 'document',
  icon: UserIcon,
  preview: {
    select: {title: 'name_en', subtitle: 'title_en', media: 'photo'},
  },
  fields: [
    defineField({
      name: 'key',
      title: 'Key (URL-safe ID)',
      type: 'slug',
      description: 'e.g. stanley-chan — used to link journeys to this speaker',
      options: {source: 'name_en'},
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'name_en',
      title: 'Name (English)',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'name_tc',
      title: 'Name (繁中)',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'title_en',
      title: 'Title / Role (English)',
      type: 'string',
      description: 'e.g. Registered Educational Psychologist · Mindfulness Teacher',
    }),
    defineField({
      name: 'title_tc',
      title: 'Title / Role (繁中)',
      type: 'string',
    }),
    defineField({
      name: 'bio_en',
      title: 'Biography (English)',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'bio_tc',
      title: 'Biography (繁中)',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'organisation_en',
      title: 'Organisation (English)',
      type: 'string',
    }),
    defineField({
      name: 'organisation_tc',
      title: 'Organisation (繁中)',
      type: 'string',
    }),
    defineField({
      name: 'photo',
      title: 'Profile Photo',
      type: 'image',
      description: 'Recommended: 400×400px square JPEG',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt_en',
          title: 'Alt Text (English)',
          type: 'string',
          description: 'e.g. Dr. Stanley Chan, mindfulness teacher',
        }),
        defineField({
          name: 'alt_tc',
          title: 'Alt Text (繁中)',
          type: 'string',
        }),
      ],
    }),
  ],
})
