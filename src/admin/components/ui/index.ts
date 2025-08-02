import * as avatarComponents from "./avatar"
import * as buttonComponents from "./button"
import * as cardComponents from "./card"
import * as checkboxComponents from "./checkbox"
import * as dropdownMenuComponents from "./dropdown-menu"
import * as inputComponents from "./input"
import * as labelComponents from "./label"
import * as paginationComponents from "./pagination"
import * as selectComponents from "./select"
import * as separatorComponents from "./separator"
import * as sheetComponents from "./sheet"
import * as sidebarComponents from "./sidebar"
import * as skeletonComponents from "./skeleton"
import * as sonnerComponents from "./sonner"
import * as textareaComponents from "./textarea"
import * as tooltipComponents from "./tooltip"

export const ui = {
  ...avatarComponents,
  ...buttonComponents,
  ...cardComponents,
  ...checkboxComponents,
  ...dropdownMenuComponents,
  ...inputComponents,
  ...labelComponents,
  ...paginationComponents,
  ...selectComponents,
  ...separatorComponents,
  ...sheetComponents,
  ...sidebarComponents,
  ...skeletonComponents,
  ...sonnerComponents,
  ...textareaComponents,
  ...tooltipComponents,
} as const
