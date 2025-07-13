import * as buttonComponents from "./button"
import * as cardComponents from "./card"
import * as checkboxComponents from "./checkbox"
import * as dropdownMenuComponents from "./dropdown-menu"
import * as inputComponents from "./input"
import * as labelComponents from "./label"
import * as paginationComponents from "./pagination"
import * as selectComponents from "./select"
import * as sonnerComponents from "./sonner"
import * as textareaComponents from "./textarea"

export const ui = {
	...buttonComponents,
	...cardComponents,
	...checkboxComponents,
	...dropdownMenuComponents,
	...inputComponents,
	...labelComponents,
	...paginationComponents,
	...selectComponents,
	...sonnerComponents,
	...textareaComponents,
} as const
