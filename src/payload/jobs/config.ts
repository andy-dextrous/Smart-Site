import { PayloadRequest } from "payload"

const jobs = {
  access: {
    run: ({ req }: { req: PayloadRequest }): boolean => {
      if (req.user) return true
      const authHeader = req.headers.get("authorization")
      return authHeader === `Bearer ${process.env.CRON_SECRET}`
    },
  },
  tasks: [],
}

export default jobs
