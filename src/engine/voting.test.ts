import { describe, expect, it } from 'vitest'
import { tallyVotes, type Vote } from './voting'

const members = ['john', 'gabriel', 'pablo']
const v = (memberId: string, destinationId: string, value: 1 | -1): Vote => ({ memberId, destinationId, value })

describe('tallyVotes', () => {
  it('ranks by net votes and names a clear leader', () => {
    const r = tallyVotes(['lisbon', 'krakow'], [v('john', 'lisbon', 1), v('gabriel', 'lisbon', 1), v('pablo', 'krakow', -1)], members, ['john', 'gabriel'])
    expect(r.ranking.map((t) => t.destinationId)).toEqual(['lisbon', 'krakow'])
    expect(r.leaderId).toBe('lisbon')
    expect(r.hasMajority).toBe(true)
    expect(r.pendingIds).toEqual(['pablo'])
  })

  it('reports a tie so the organizer picks', () => {
    const r = tallyVotes(['lisbon', 'porto'], [v('john', 'lisbon', 1), v('gabriel', 'porto', 1)], members, members)
    expect(r.leaderId).toBeNull()
    expect(r.tiedIds.sort()).toEqual(['lisbon', 'porto'])
  })

  it('uses match score only to order otherwise-equal destinations', () => {
    const r = tallyVotes(['a', 'b'], [], members, [], { a: 60, b: 80 })
    expect(r.ranking[0]!.destinationId).toBe('b')
    expect(r.leaderId).toBeNull() // no votes yet, no leader
  })

  it('ignores votes from non-members and unknown destinations', () => {
    const r = tallyVotes(['lisbon'], [v('stranger', 'lisbon', 1), v('john', 'paris', 1)], members, [])
    expect(r.ranking[0]!.up).toEqual([])
  })
})
