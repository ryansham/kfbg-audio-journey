import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

const sharedConfig = {
  projectId: 'bw3aid78',
  plugins: [
    structureTool({structure}),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
}

export default defineConfig([
  {
    ...sharedConfig,
    name: 'production',
    title: 'Production',
    dataset: 'production',
    basePath: '/production',
  },
  {
    ...sharedConfig,
    name: 'staging',
    title: 'Staging',
    dataset: 'staging',
    basePath: '/staging',
  },
])
