# WILD Child

This is the official Wild Child website/app starter, built using Next JS, Tailwind 4, GSAP and Payload CMS.

## Installation

1. Create a clone of this repo by clicking "Use This Template" in Github. This will create the new Wild Child site.
2. In the new repo in Github, click on "Code" and "Open with Github Desktop"
3. Clone the repo to your local machine and open the folder in Cursor.
4. run `npm i`
5. You will need to create a database and file storage for this site. Vercel has free tiers available for PostGres and Vercel Blob which should provide enough storage for a new site. They are also perfect for development.
6. Rename .env.example to .env and fill in each environment variable.

```yml
# Payload
    DATABASE_PROVIDER=vercel # or choose mongoose if using MongoDB
    DATABASE_URI=... # if using mongoose
    POSTGRES_URL=... # if using vercel - get this from the storage/postgres page o vercel (https://vercel.com/scrivos-projects/~/stores)
    PAYLOAD_SECRET=... # create a unique id for payload encryption (https://acte.ltd/utils/randomkeygen). Reuse in production as well.
    PAYLOAD_CONFIG_PATH=./src/payload/payload.config.ts # don't change this
    PAYLOAD_ADMIN_EMAIL=... # once you have created an account in your new app's admin, put the email and password here to enable auto-login during development to save you always having to log back in.
    PAYLOAD_ADMIN_PASSWORD=... # same
    PREVIEW_SECRET=... # create another unique id for previews (https://acte.ltd/utils/randomkeygen)

    # GSAP
    TOKEN=ee697198-7190-48fb-98df-b5aa34edf555 # keep this identical, it is tied to a paid GSAP account with full features.

    # Next
    NEXT_PUBLIC_URL=http://localhost:3000 # This should be localhost in development and your actual URL in production
    VERCEL_PROJECT_PRODUCTION_URL=... # production url
    BLOB_READ_WRITE_TOKEN=... # fetch from https://vercel.com/docs/storage/vercel-blob

    # Resend - #not required for development - only prod. Fetch from https://resend.com/
    RESEND_API_KEY=...
```

7. `npm run dev` will start the new website
8. Create a new user
9. Production - after setting up the site as a Vercel project, go to project settings and turn on functions -> Fluid Compute. It will improve front end performance. Also, on the functions page, open the Advanced Settings accordion and change the Function Region so that roundtrip durations are minimised. In developent, this should be Asia Pacific -> Sydney. On launch, set this to match the client's region, unless the client is on a paid plan in which case they can have more than one function location. If the client has a paid plan, scroll down to Functions CPU and choose Standard which provides a little more horsepower to the node.js function environment, making things a bit more snappy.

## Building the site

For the most part, Payload will come fully featured out of the box. It starts with collections for Pages, Services, Posts and Team Members.

### Steps involved for bringing a Figma design to Wild Child

1. Bring the Design System from Figma over to Tailwind. Navigate to the `src/(frontend)/css` folder. All frontend tailwind files live in here. The entry point is globals.css which is imported into the main layout of the site.

Most of the new Tailwind 4 information you need to understand lives in [the theme documentation](https://tailwindcss.com/docs/theme).

2. Core CSS Files:

- **base.css**: Used to style primitives (html element-level styles)
- **components.css**: Used to create traditional classes with lots of css rules (the old fashioned way). Only use components if absolutely necessary for readability and re-use. Don't use for creting new utility classes.
- **theme.css**: Main theme file for extending and modifying tailwind classes and tokens. Use theme.css for adding custom global variables, extending colors, adding spacing rules (container width, section padding etc).
- **typography.css**: All typography rules and variables managed from here. The @theme layer at the top of the file is used to add variables and classes specifically for global typography. The @base layer below is used to apply those variables and classes to typography primitives.
- **ui.css**: ShadCN variables. Will change in the future to accomodate our own, preferred design system.
- **utilities.css**: Used to add new, useful utility functions not already in Tailwind.

3. Building designs:

Wild Child is designed for a section-first approach to building websites. Every website has a `<header />`, `<main />` and `<footer />` that live inside the `<body />`. Wild Child is set up so that you can spend 90% of your time just building the sections from your design. Inside the `<main>` you will have stacked `<section>` elements that comprise the content of the website.

Payload CMS handles the templating - organising and building pages. This is acheieved by first building sections and then adding theme support for them in two places.

## Creating Section Blocks

1. Create a new folder inside `src/components/sections`. Give the folder the section name you want. Use kebab case for all folders.
2. Every section block needs 2 files - a config file and a React component. The convention is to call them `config.ts` and `Component.tsx` however this is not **_technically_** necessary.
3. After creating these files, start by modifying the config file. First, examine your Figma design and decide how much control the client would like to have over this section. **You want to decide on the fields that you will create which will allow the site user to modify designs**. This will likely include the obvious choices: a title (text field), content (rich-text), buttons (array block containing button attributes like url, text, variant). You may, however want to expose deeper levels of customisation that make components extremely flexible. For instance:

- Layout Options (left-right, right-left, stacked etc)
- Inclusion of optional elements (use a slider instead of card grid, background icon etc)
- Styling (Dark mode and light mode variants)
- Positioning of certain elements
- Animations

The choice is ours to create whatever editor experience best suits this client and their budget. 4. Build out the config file to represent the schema you want in your editor. Use the below as a guide.

```ts
import type { Block } from "payload"

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical"

export const SectionName: Block = {
  slug: "new-section-name", // Use kebab case, must be unique across the site
  admin: {
    group: "Hero Sections", // Use the admin group if you want this section to be grouped with other types (eg all hereos together)
  },
  interfaceName: "NewSectionBlock", // This is used by Payload to create the types for this section. They will be imported into your component.
  fields: [
    // fields are how we declare the data we want to be obtained from the admin. https://payloadcms.com/docs/fields/overview
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      label: false,
      required: true,
    },
  ],
}
```

4. Once you have built your config file, expose it to Payload by importing it into `src/components/sections/config.ts`. This will automatically add it to Payload.
5. You also need to import your section's Component into `src/components/sections/RenderSections.tsx`. This file maps slugs to React components.
6. Now, you are ready to build the Component. Your interfaceName will now exist inside payload.types.ts (automatically generated). This tells your component exactly how to work with the available data. Here is a blank starter component.

```tsx
import { cn } from "@/utilities/ui"
import RichText from "@/payload/components/rich-text"
import Image from "next/image"
import type { NewSectionBlock } from "@/payload/payload-types" // Note how this interface came from the config file.

export const NewSectionComponent: React.FC<NewSectionBlock> = props => {
  const { heading, content } = props // Notice that these are the exact fields we added to our fields array in the config file. We get what we ask for passed in as props.

  return (
    <section>
      <div className="container flex gap-8">
        <div className="flex flex-1 flex-col items-start gap-4">
          <h2>{heading}</h2>
          <div className="prose max-w-none">
            <RichText data={content} />
          </div>
        </div>
      </div>
    </section>
  )
}
```
