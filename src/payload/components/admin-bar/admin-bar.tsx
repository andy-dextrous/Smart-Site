// "use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCollections } from "@/lib/queries/collections"
import { getSettings } from "@/lib/queries/globals"
import { ChevronDown } from "lucide-react"
// import React, { useEffect, useState } from "react"
import React from "react"
import type { PayloadAdminBarProps, PayloadMeUser } from "./types.ts"

const dummyUser = {
  id: "12345",
  email: "dev@email.com",
}

export const PayloadAdminBar: React.FC<PayloadAdminBarProps> = props => {
  const {
    id: docID,
    adminPath = "/admin",
    apiPath = "/api",
    authCollectionSlug = "users",
    className,
    collectionLabels = {
      plural: "Users",
      singular: "User",
    },
    collectionSlug,
    devMode,
    preview,
    onPreviewExit,
    cmsURL = "http://localhost:3000",
  } = props

  // const [user, setUser] = useState<PayloadMeUser | null>()
  // const [siteName, setSiteName] = useState<string>("My Site")
  // const [collections, setCollections] = useState<any[]>([])

  // // Fetch all collections for the "+ New" dropdown
  // useEffect(() => {
  //   const fetchCollections = async () => {
  //     try {
  //       const collectionsData = await getCollections()
  //       // Transform the data to match the expected format for the dropdown
  //       const formattedCollections = collectionsData.map(collection => ({
  //         slug: collection.slug,
  //         labels: {
  //           singular: collection.slug.charAt(0).toUpperCase() + collection.slug.slice(1),
  //         },
  //       }))
  //       setCollections(formattedCollections)
  //     } catch (err) {
  //       console.warn("Failed to fetch collections:", err)
  //     }
  //   }

  //   void fetchCollections()
  // }, [])

  // Fetch site name from settings
  // useEffect(() => {
  //   const fetchSettings = async () => {
  //     try {
  //       const settings = await getSettings()
  //       if (settings?.general?.siteName) {
  //         setSiteName(settings.general.siteName)
  //       }
  //     } catch (err) {
  //       console.warn("Failed to fetch settings:", err)
  //     }
  //   }

  //   void fetchSettings()
  // }, [])

  // useEffect(() => {
  //   const fetchMe = async () => {
  //     try {
  //       const meRequest = await fetch(`${cmsURL}${apiPath}/${authCollectionSlug}/me`, {
  //         credentials: "include",
  //         method: "get",
  //       })
  //       const meResponse = await meRequest.json()
  //       const { user } = meResponse

  //       if (user) {
  //         setUser(user)
  //       } else {
  //         if (devMode !== true) {
  //           setUser(null)
  //         } else {
  //           setUser(dummyUser)
  //         }
  //       }
  //     } catch (err) {
  //       console.warn(err)
  //       if (devMode === true) {
  //         setUser(dummyUser)
  //       }
  //     }
  //   }

  //   void fetchMe()
  // }, [cmsURL, adminPath, apiPath, devMode])

  // const clearCache = async () => {
  //   try {
  //     const res = await fetch(`/api/revalidate`, {
  //       method: "GET",
  //     })

  //     if (!res.ok) {
  //       console.error("Failed to clear cache")
  //     } else {
  //       console.log("Cache cleared successfully")
  //     }
  //   } catch (error) {
  //     console.error("Error clearing cache:", error)
  //   }
  // }

  // if (user) {
  //   const { id: userID, email } = user

  //   return (
  //     <div
  //       className={`fixed top-0 left-0 z-[99999] flex w-full items-center gap-2 bg-[#18181a] px-4 py-2 font-sans text-sm text-white ${className || ""}`}
  //     >
  //       {/* Dashboard Link */}
  //       <a
  //         href={`${cmsURL}${adminPath}`}
  //         className="mr-4 flex h-5 flex-shrink-0 items-center text-white no-underline"
  //       >
  //         Dashboard
  //       </a>

  //       {/* Site Name Dropdown */}
  //       <DropdownMenu>
  //         <DropdownMenuTrigger className="flex items-center gap-1 text-white">
  //           {/* <span>{siteName}</span> */}
  //           <ChevronDown className="h-4 w-4" />
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent className="border-[unset] bg-[#18181a]">
  //           <DropdownMenuItem asChild className="text-white">
  //             <a href={`${cmsURL}${adminPath}`}>Dashboard</a>
  //           </DropdownMenuItem>
  //           <DropdownMenuItem asChild className="text-white">
  //             <a href={`${cmsURL}${adminPath}/globals/header`}>Header</a>
  //           </DropdownMenuItem>
  //           <DropdownMenuItem asChild className="text-white">
  //             <a href={`${cmsURL}${adminPath}/globals/footer`}>Footer</a>
  //           </DropdownMenuItem>
  //           <DropdownMenuItem asChild className="text-white">
  //             <a href={`${cmsURL}${adminPath}/globals/settings`}>Settings</a>
  //           </DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>

  //       {/* New Content Dropdown */}
  //       <DropdownMenu>
  //         <DropdownMenuTrigger className="ml-4 flex items-center gap-1 text-white">
  //           <span>+ New</span>
  //           <ChevronDown className="h-4 w-4" />
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent className="border-[unset] bg-[#18181a]">
  //           {collections.map(collection => (
  //             <DropdownMenuItem key={collection.slug} asChild className="text-white">
  //               <a href={`${cmsURL}${adminPath}/collections/${collection.slug}/create`}>
  //                 {collection.labels?.singular || collection.slug}
  //               </a>
  //             </DropdownMenuItem>
  //           ))}
  //         </DropdownMenuContent>
  //       </DropdownMenu>

  //       <div className="ml-auto flex items-center gap-4">
  //         {/* Edit Page Button */}
  //         {collectionSlug && docID && (
  //           <a
  //             href={`${cmsURL}${adminPath}/collections/${collectionSlug}/${docID}`}
  //             className="text-white no-underline"
  //           >
  //             {`Edit ${collectionLabels?.singular || "page"}`}
  //           </a>
  //         )}

  //         {/* Clear Cache Button */}
  //         <button
  //           onClick={clearCache}
  //           className="cursor-pointer border-none bg-transparent text-white"
  //         >
  //           Clear Cache
  //         </button>

  //         {/* Preview Exit */}
  //         {preview && (
  //           <button
  //             onClick={onPreviewExit}
  //             className="cursor-pointer border-none bg-transparent text-white"
  //           >
  //             Exit preview mode
  //           </button>
  //         )}

  //         {/* User Profile */}
  //         <a
  //           href={`${cmsURL}${adminPath}/collections/${authCollectionSlug}/${userID}`}
  //           rel="noopener noreferrer"
  //           target="_blank"
  //           className="overflow-hidden text-ellipsis whitespace-nowrap text-white no-underline"
  //         >
  //           {email || "Profile"}
  //         </a>

  //         {/* Logout */}
  //         <a
  //           href={`${cmsURL}${adminPath}/logout`}
  //           rel="noopener noreferrer"
  //           target="_blank"
  //           className="text-white no-underline"
  //         >
  //           Logout
  //         </a>
  //       </div>
  //     </div>
  //   )
  // }

  return null
}
