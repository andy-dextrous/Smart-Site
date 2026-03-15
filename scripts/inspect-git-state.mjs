import { spawnSync } from "child_process"

/*************************************************************************/
/*  GIT COMMANDS
/*************************************************************************/

function runGit(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  })

  if (result.status !== 0) {
    return ""
  }

  return result.stdout.trim()
}

function readAheadBehind(upstream, cwd) {
  if (!upstream) {
    return { ahead: 0, behind: 0 }
  }

  const counts = runGit(["rev-list", "--left-right", "--count", `${upstream}...HEAD`], cwd)

  if (!counts) {
    return { ahead: 0, behind: 0 }
  }

  const [behind = "0", ahead = "0"] = counts.split(/\s+/)

  return {
    ahead: Number(ahead) || 0,
    behind: Number(behind) || 0,
  }
}

/*************************************************************************/
/*  STATE INSPECTION
/*************************************************************************/

export function inspectGitState(cwd = process.cwd()) {
  const root = runGit(["rev-parse", "--show-toplevel"], cwd)

  if (!root) {
    return {
      isRepository: false,
      dirty: false,
      branch: "",
      upstream: "",
      ahead: 0,
      behind: 0,
      head: "",
    }
  }

  const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"], cwd)
  const upstream = runGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], cwd)
  const head = runGit(["rev-parse", "HEAD"], cwd)
  const status = runGit(["status", "--porcelain"], cwd)
  const { ahead, behind } = readAheadBehind(upstream, cwd)

  return {
    isRepository: true,
    dirty: Boolean(status),
    branch,
    upstream,
    ahead,
    behind,
    head,
  }
}

/*************************************************************************/
/*  WARNING FORMAT
/*************************************************************************/

export function describeGitWarnings(state) {
  const warnings = []

  if (!state.isRepository) {
    return warnings
  }

  if (state.dirty) {
    warnings.push("Git worktree has uncommitted changes.")
  }

  if (state.behind > 0) {
    warnings.push(`Current branch is behind upstream by ${state.behind} commit(s).`)
  }

  if (state.ahead > 0) {
    warnings.push(`Current branch has ${state.ahead} unpushed commit(s).`)
  }

  if (!state.upstream) {
    warnings.push("Current branch has no upstream tracking branch.")
  }

  return warnings
}
