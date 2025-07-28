import type { Form } from "@/admin/payload/payload-types"

export const primaryContactForm = (): Omit<Form, "updatedAt" | "id" | "createdAt"> => {
  return {
    title: "Primary Contact Form",
    fields: [
      {
        blockType: "text",
        name: "fullname",
        label: "Name",
        width: 100,
        required: true,
      },
      {
        blockType: "email",
        name: "email",
        label: "Email",
        width: 100,
        required: true,
      },
      {
        blockType: "phone",
        name: "phone",
        label: "Phone Number",
        width: 100,
      },
      {
        blockType: "textarea",
        name: "message",
        label: "Message",
        width: 100,
        required: true,
      },
    ],
    submitButtonLabel: "Send Message",
    confirmationType: "message",
    confirmationMessage: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Thank you for your message! We'll get back to you soon.",
                type: "text",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1,
            textFormat: 0,
            textStyle: "",
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    },
    emails: [
      {
        emailTo: "andrew@wildcreative.com.au",
        subject: "New Contact Form Submission",
        message: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "You have received a new contact form submission:",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
                textFormat: 0,
                textStyle: "",
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "{{*}}",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: null,
                format: "",
                indent: 0,
                type: "paragraph",
                version: 1,
                textFormat: 0,
                textStyle: "",
              },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        },
      },
    ],
  }
}
