import 'core-js/stable/object/from-entries'
import { createSelector } from 'reselect'
import { AppState } from 'state'
import { OracleNode } from '../../../config'

export const upcaseOracles = (
  state: AppState,
): Record<OracleNode['address'], OracleNode['name']> => {
  /**
   * In v2 of the contract, oracles' list has oracle addresses,
   * but in v3 - node addresses.
   */

  return Object.entries(state.aggregator.oracleNodes).reduce(
    (accumulator: Record<string, string>, [oracleAddress, oracle]) => {
      accumulator[oracleAddress] = oracle.name
      oracle.nodeAddress.forEach(nodeAddress => {
        accumulator[nodeAddress] = oracle.name
      })

      return accumulator
    },
    {},
  )
}

const oracleList = (state: AppState) => state.aggregator.oracleList
const oracleAnswers = (state: AppState) => state.aggregator.oracleAnswers
const pendingAnswerId = (state: AppState) => state.aggregator.pendingAnswerId

const oracles = createSelector(
  [oracleList, upcaseOracles],
  (
    list: Array<OracleNode['address']>,
    upcasedOracles: Record<OracleNode['address'], OracleNode['name']>,
  ) => {
    if (!list) return []
    const result = list
      .map(address => {
        return {
          address,
          name: upcasedOracles[address] || 'Unknown',
          type: 'oracle',
        }
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return result
  },
)

interface OracleAnswer {
  answerFormatted: string
  answer: number
  answerId: number
  sender: string
  meta: {
    blockNumer: number
    transactionHash: string
    timestamp: number
    gasPrice: string
  }
}

const latestOraclesState = createSelector(
  [oracles, oracleAnswers, pendingAnswerId],
  (list, answers: OracleAnswer[], pendingAnswerId) => {
    if (!list) return []

    const data = list.map((o: any, id: any) => {
      const state =
        answers &&
        answers.find(
          (r: any) => r.sender.toUpperCase() === o.address.toUpperCase(),
        )

      const isFulfilled = state && state.answerId >= pendingAnswerId
      return { ...o, ...state, id, isFulfilled }
    })

    return data
  },
)

export { latestOraclesState }
