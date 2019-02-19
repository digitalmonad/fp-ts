import { Bounded } from './Bounded'
import { compose, Endomorphism, identity, concat } from './function'
import {
  fold as foldSemigroup,
  getDictionarySemigroup,
  getDualSemigroup,
  getFunctionSemigroup,
  getJoinSemigroup,
  getMeetSemigroup,
  Semigroup,
  semigroupAll,
  semigroupAny,
  semigroupProduct,
  semigroupString,
  semigroupSum,
  semigroupVoid,
  getStructSemigroup,
  getTupleSemigroup
} from './Semigroup'

/**
 * @typeclass
 * @since 1.0.0
 */
export interface Monoid<A> extends Semigroup<A> {
  readonly empty: A
}

/**
 * @since 1.0.0
 */
export const fold = <A>(M: Monoid<A>): ((as: Array<A>) => A) => {
  return foldSemigroup(M)(M.empty)
}

/**
 * @since 1.0.0
 */
export const getTupleMonoid = <A, B>(MA: Monoid<A>, MB: Monoid<B>): Monoid<[A, B]> => {
  return {
    ...getTupleSemigroup(MA, MB),
    empty: [MA.empty, MB.empty]
  }
}

/**
 * Use {@link getTupleMonoid} instead
 * @since 1.0.0
 * @deprecated
 */
export const getProductMonoid = <A, B>(MA: Monoid<A>, MB: Monoid<B>): Monoid<[A, B]> => {
  return getTupleMonoid(MA, MB)
}

/**
 * @since 1.0.0
 */
export const getDualMonoid = <A>(M: Monoid<A>): Monoid<A> => {
  return {
    ...getDualSemigroup(M),
    empty: M.empty
  }
}

/**
 * Boolean monoid under conjunction
 * @since 1.0.0
 */
export const monoidAll: Monoid<boolean> = {
  ...semigroupAll,
  empty: true
}

/**
 * Boolean monoid under disjunction
 * @since 1.0.0
 */
export const monoidAny: Monoid<boolean> = {
  ...semigroupAny,
  empty: false
}

const emptyArray: Array<any> = []

/**
 * @since 1.0.0
 */
export const unsafeMonoidArray: Monoid<Array<any>> = {
  concat,
  empty: emptyArray
}

/**
 * `Monoid` under array concatenation
 *
 * @since 1.0.0
 */
export const getArrayMonoid = <A = never>(): Monoid<Array<A>> => {
  return unsafeMonoidArray
}

const emptyObject = {}

/**
 * Use {@link Record}'s `getMonoid`
 * @since 1.4.0
 * @deprecated
 */
export function getDictionaryMonoid<K extends string, A>(S: Semigroup<A>): Monoid<Record<K, A>>
export function getDictionaryMonoid<A>(S: Semigroup<A>): Monoid<{ [key: string]: A }>
export function getDictionaryMonoid<A>(S: Semigroup<A>): Monoid<{ [key: string]: A }> {
  return {
    // tslint:disable-next-line: deprecation
    ...getDictionarySemigroup(S),
    empty: emptyObject
  }
}

/**
 * Number monoid under addition
 * @since 1.0.0
 */
export const monoidSum: Monoid<number> = {
  ...semigroupSum,
  empty: 0
}

/**
 * Number monoid under multiplication
 * @since 1.0.0
 */
export const monoidProduct: Monoid<number> = {
  ...semigroupProduct,
  empty: 1
}

/**
 * @since 1.0.0
 */
export const monoidString: Monoid<string> = {
  ...semigroupString,
  empty: ''
}

/**
 * @since 1.0.0
 */
export const monoidVoid: Monoid<void> = {
  ...semigroupVoid,
  empty: undefined
}

/**
 * @since 1.0.0
 */
export const getFunctionMonoid = <M>(M: Monoid<M>) => <A = never>(): Monoid<(a: A) => M> => {
  return {
    ...getFunctionSemigroup(M)<A>(),
    empty: () => M.empty
  }
}

/**
 * @since 1.0.0
 */
export const getEndomorphismMonoid = <A = never>(): Monoid<Endomorphism<A>> => {
  return {
    concat: compose,
    empty: identity
  }
}

/**
 * @since 1.14.0
 */
export const getStructMonoid = <O extends { [key: string]: any }>(
  monoids: { [K in keyof O]: Monoid<O[K]> }
): Monoid<O> => {
  const empty: any = {}
  for (const key of Object.keys(monoids)) {
    empty[key] = monoids[key].empty
  }
  return {
    ...getStructSemigroup<O>(monoids),
    empty
  }
}

/**
 * Use {@link getStructMonoid} instead
 * @since 1.0.0
 * @deprecated
 */
export const getRecordMonoid = <O extends { [key: string]: any }>(
  monoids: { [K in keyof O]: Monoid<O[K]> }
): Monoid<O> => {
  return getStructMonoid(monoids)
}

/**
 * @since 1.9.0
 */
export const getMeetMonoid = <A>(B: Bounded<A>): Monoid<A> => {
  return {
    ...getMeetSemigroup(B),
    empty: B.top
  }
}

/**
 * @since 1.9.0
 */
export const getJoinMonoid = <A>(B: Bounded<A>): Monoid<A> => {
  return {
    ...getJoinSemigroup(B),
    empty: B.bottom
  }
}
