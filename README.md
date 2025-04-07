## Notes

- In general, you will use the Local API for all payload interactions on the server side.
- You can often do this using req.payload which is passed in to most functions (hooks, validations etc)
- Otherwise, import it using:

```tsx
import { getPayload } from "payload"
import config from "@payload-config"

const payload = await getPayload({ config })
```

- Payload has a group property on collections which simply combines collections into a dropdown.
