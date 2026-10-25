/*************************************************************************/
/*  ROUTING MODULE - MAIN EXPORTS
/*************************************************************************/

// URI Engine - Core routing functionality
export {
  routingEngine,
  validateURI,
  type URIConflictResult,
  setRoutingPayloadAccessor,
} from "@/website/routing/uri-engine"

// URI Index Manager - Index maintenance and population
export {
  updateURI,
  deleteURI,
  checkURIConflict,
  regenerateURIs,
  setRoutingIndexPayloadAccessor,
  type URIIndexUpdate,
  type PopulationStats,
} from "@/website/routing/index-manager"
