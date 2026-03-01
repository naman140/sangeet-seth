import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { schemaTypes } from './schemas'

export default defineConfig({
    name: 'default',
    title: 'Sangeet Seth Blog',

    projectId: 'g9ebnag6',
    dataset: 'production',

    plugins: [deskTool()],

    schema: {
        types: schemaTypes,
    },
})
