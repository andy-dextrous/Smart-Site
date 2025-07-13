export const infoGridDefault = {
  heading: "How We Turn<br /><span>Strategy Into Results</span>",
  description: {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              text: "Our five-step model helps you move from insight to execution with clarity and confidence. Whether it's AI, operations, or cloud, we tailor solutions that scale and evolve with your business.",
            },
          ],
        },
      ],
    },
  },
  backgroundColorScheme: "dark" as const,
  gridColumns: "4" as const,
  processSteps: [
    {
      title: "Discover",
      description:
        "We begin with deep listening and immersion into your business to understand your goals, challenges, and potential.",
    },
    {
      title: "Strategize",
      description:
        "Together, we frame outcomes and align priorities, designing a roadmap that balances ambition with precision.",
    },
    {
      title: "Build",
      description:
        "Through our hybrid teams, we execute solutions that fuse strategy with smart technology.",
    },
    {
      title: "Elevate",
      description:
        "We continuously optimize and adapt, ensuring every solution evolves with your business and delivers sustained value.",
    },
  ],
}
