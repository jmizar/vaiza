export type VoteValue = 1 | -1

export interface Vote {
  memberId: string
  destinationId: string
  value: VoteValue
}

export interface Tally {
  destinationId: string
  up: string[]
  down: string[]
  net: number
}

export interface VotingResult {
  /** Ranked best first: net votes, then most 👍, then match score. */
  ranking: Tally[]
  /** Top destination when it clearly leads (no tie at the top). */
  leaderId: string | null
  /** Destinations tied for first place (2+ means the organizer must pick). */
  tiedIds: string[]
  /** Docs' "natural majority": more 👍 than 👎 and at least 2 👍. */
  hasMajority: boolean
  /** Members who confirmed their vote vs still to vote. */
  votedIds: string[]
  pendingIds: string[]
}

export function tallyVotes(
  candidateIds: string[],
  votes: Vote[],
  memberIds: string[],
  confirmedIds: string[],
  matchScore: Record<string, number> = {},
): VotingResult {
  const tallies = new Map<string, Tally>(candidateIds.map((id) => [id, { destinationId: id, up: [], down: [], net: 0 }]))
  for (const v of votes) {
    const t = tallies.get(v.destinationId)
    if (!t || !memberIds.includes(v.memberId)) continue
    ;(v.value === 1 ? t.up : t.down).push(v.memberId)
    t.net += v.value
  }

  const ranking = [...tallies.values()].sort(
    (a, b) => b.net - a.net || b.up.length - a.up.length || (matchScore[b.destinationId] ?? 0) - (matchScore[a.destinationId] ?? 0),
  )

  const top = ranking[0]
  const tiedIds = top ? ranking.filter((t) => t.net === top.net && t.up.length === top.up.length).map((t) => t.destinationId) : []
  const anyVotes = votes.length > 0

  return {
    ranking,
    leaderId: top && anyVotes && tiedIds.length === 1 ? top.destinationId : null,
    tiedIds: anyVotes && tiedIds.length > 1 ? tiedIds : [],
    hasMajority: !!top && top.up.length > top.down.length && top.up.length >= 2,
    votedIds: memberIds.filter((id) => confirmedIds.includes(id)),
    pendingIds: memberIds.filter((id) => !confirmedIds.includes(id)),
  }
}
