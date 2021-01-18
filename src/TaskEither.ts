/**
 * ```ts
 * interface TaskEither<E, A> extends Task<Either<E, A>> {}
 * ```
 *
 * `TaskEither<E, A>` represents an asynchronous computation that either yields a value of type `A` or fails yielding an
 * error of type `E`. If you want to represent an asynchronous computation that never fails, please see `Task`.
 *
 * @since 2.0.0
 */
import { Alt2, Alt2C } from './Alt'
import { Applicative2, Applicative2C } from './Applicative'
import { apFirst_, Apply1, Apply2, apSecond_, apS_, ap_ } from './Apply'
import { Bifunctor2 } from './Bifunctor'
import { Compactable2C, compact_, separate_ } from './Compactable'
import * as E from './Either'
import * as ET from './EitherT'
import { Filterable2C, filterMap_, filter_, partitionMap_, partition_ } from './Filterable'
import { flow, identity, Lazy, pipe, Predicate, Refinement } from './function'
import { bindTo_, Functor2 } from './Functor'
import { IO } from './IO'
import { IOEither } from './IOEither'
import { bind_, chainFirst_, Monad2, Monad2C } from './Monad'
import { MonadIO2 } from './MonadIO'
import { MonadTask2, MonadTask2C } from './MonadTask'
import { MonadThrow2, MonadThrow2C } from './MonadThrow'
import { Monoid } from './Monoid'
import { Option } from './Option'
import { Pointed2 } from './Pointed'
import { Semigroup } from './Semigroup'
import * as T from './Task'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

import Either = E.Either
import Task = T.Task

/**
 * @category model
 * @since 2.0.0
 */
export interface TaskEither<E, A> extends Task<Either<E, A>> {}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 2.0.0
 */
export const left: <E = never, A = never>(e: E) => TaskEither<E, A> =
  /*#__PURE__*/
  ET.left_(T.Pointed)

/**
 * @category constructors
 * @since 2.0.0
 */
export const right: <E = never, A = never>(a: A) => TaskEither<E, A> =
  /*#__PURE__*/
  ET.right_(T.Pointed)

/**
 * @category constructors
 * @since 2.0.0
 */
export const rightTask: <E = never, A = never>(ma: Task<A>) => TaskEither<E, A> =
  /*#__PURE__*/
  ET.rightF_(T.Functor)

/**
 * @category constructors
 * @since 2.0.0
 */
export const leftTask: <E = never, A = never>(me: Task<E>) => TaskEither<E, A> =
  /*#__PURE__*/
  ET.leftF_(T.Functor)

/**
 * @category constructors
 * @since 2.0.0
 */
export const rightIO: <E = never, A = never>(ma: IO<A>) => TaskEither<E, A> =
  /*#__PURE__*/
  flow(T.fromIO, rightTask)

/**
 * @category constructors
 * @since 2.0.0
 */
export const leftIO: <E = never, A = never>(me: IO<E>) => TaskEither<E, A> =
  /*#__PURE__*/
  flow(T.fromIO, leftTask)

/**
 * @category constructors
 * @since 2.0.0
 */
export const fromIOEither: <E, A>(fa: IOEither<E, A>) => TaskEither<E, A> = T.fromIO

/**
 * Derivable from `MonadThrow`.
 *
 * @category constructors
 * @since 2.0.0
 */
export const fromEither: <E, A>(ma: E.Either<E, A>) => TaskEither<E, A> =
  /*#__PURE__*/
  E.fold(left, (a) => right(a))

/**
 * Derivable from `MonadThrow`.
 *
 * @category constructors
 * @since 2.0.0
 */
export const fromOption: <E>(onNone: Lazy<E>) => <A>(ma: Option<A>) => TaskEither<E, A> = (onNone) => (ma) =>
  ma._tag === 'None' ? left(onNone()) : right(ma.value)

/**
 * Derivable from `MonadThrow`.
 *
 * @category constructors
 * @since 2.0.0
 */
export const fromPredicate: {
  <E, A, B extends A>(refinement: Refinement<A, B>, onFalse: (a: A) => E): (a: A) => TaskEither<E, B>
  <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): (a: A) => TaskEither<E, A>
} = <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E) => (a: A) => (predicate(a) ? right(a) : left(onFalse(a)))

/**
 * Transforms a `Promise` that may reject to a `Promise` that never rejects and returns an `Either` instead.
 *
 * Note: `f` should never `throw` errors, they are not caught.
 *
 * @example
 * import { left, right } from 'fp-ts/Either'
 * import { tryCatch } from 'fp-ts/TaskEither'
 *
 * tryCatch(() => Promise.resolve(1), String)().then(result => {
 *   assert.deepStrictEqual(result, right(1))
 * })
 * tryCatch(() => Promise.reject('error'), String)().then(result => {
 *   assert.deepStrictEqual(result, left('error'))
 * })
 *
 * @category constructors
 * @since 2.0.0
 */
export function tryCatch<E, A>(f: Lazy<Promise<A>>, onRejected: (reason: unknown) => E): TaskEither<E, A> {
  return () => f().then(E.right, (reason) => E.left(onRejected(reason)))
}

// -------------------------------------------------------------------------------------
// destructors
// -------------------------------------------------------------------------------------

/**
 * @category destructors
 * @since 2.0.0
 */
export const fold: <E, A, B>(
  onLeft: (e: E) => Task<B>,
  onRight: (a: A) => Task<B>
) => (ma: TaskEither<E, A>) => Task<B> =
  /*#__PURE__*/
  ET.fold_(T.Monad)

/**
 * @category destructors
 * @since 2.0.0
 */
export const getOrElse: <E, A>(onLeft: (e: E) => Task<A>) => (ma: TaskEither<E, A>) => Task<A> =
  /*#__PURE__*/
  ET.getOrElse_(T.Monad)

/**
 * Less strict version of [`getOrElse`](#getOrElse).
 *
 * @category destructors
 * @since 2.6.0
 */
export const getOrElseW: <E, B>(
  onLeft: (e: E) => Task<B>
) => <A>(ma: TaskEither<E, A>) => Task<A | B> = getOrElse as any

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

/**
 * Returns `ma` if is a `Right` or the value returned by `onLeft` otherwise.
 *
 * See also [alt](#alt).
 *
 * @example
 * import * as E from 'fp-ts/Either'
 * import { pipe } from 'fp-ts/function'
 * import * as TE from 'fp-ts/TaskEither'
 *
 * async function test() {
 *   const errorHandler = TE.orElse((error: string) => TE.right(`recovering from ${error}...`))
 *   assert.deepStrictEqual(await pipe(TE.right('ok'), errorHandler)(), E.right('ok'))
 *   assert.deepStrictEqual(await pipe(TE.left('ko'), errorHandler)(), E.right('recovering from ko...'))
 * }
 *
 * test()
 *
 * @category combinators
 * @since 2.0.0
 */
export const orElse: <E, A, M>(onLeft: (e: E) => TaskEither<M, A>) => (ma: TaskEither<E, A>) => TaskEither<M, A> =
  /*#__PURE__*/
  ET.orElse_(T.Monad)

/**
 * @category combinators
 * @since 2.0.0
 */
export const swap: <E, A>(ma: TaskEither<E, A>) => TaskEither<A, E> =
  /*#__PURE__*/
  ET.swap_(T.Functor)

/**
 * Less strict version of [`filterOrElse`](#filterOrElse).
 *
 * @since 2.9.0
 */
export const filterOrElseW: {
  <A, B extends A, E2>(refinement: Refinement<A, B>, onFalse: (a: A) => E2): <E1>(
    ma: TaskEither<E1, A>
  ) => TaskEither<E1 | E2, B>
  <A, E2>(predicate: Predicate<A>, onFalse: (a: A) => E2): <E1>(ma: TaskEither<E1, A>) => TaskEither<E1 | E2, A>
} = <A, E2>(predicate: Predicate<A>, onFalse: (a: A) => E2): (<E1>(ma: TaskEither<E1, A>) => TaskEither<E1 | E2, A>) =>
  chainW((a) => (predicate(a) ? right(a) : left(onFalse(a))))

/**
 * Derivable from `MonadThrow`.
 *
 * @category combinators
 * @since 2.0.0
 */
export const filterOrElse: {
  <E, A, B extends A>(refinement: Refinement<A, B>, onFalse: (a: A) => E): (ma: TaskEither<E, A>) => TaskEither<E, B>
  <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): (ma: TaskEither<E, A>) => TaskEither<E, A>
} = filterOrElseW

/**
 * Converts a function returning a `Promise` to one returning a `TaskEither`.
 *
 * @category combinators
 * @since 2.5.0
 */
export function tryCatchK<E, A extends ReadonlyArray<unknown>, B>(
  f: (...a: A) => Promise<B>,
  onRejected: (reason: unknown) => E
): (...a: A) => TaskEither<E, B> {
  return (...a) => tryCatch(() => f(...a), onRejected)
}

/**
 * @category combinators
 * @since 2.4.0
 */
export function fromEitherK<E, A extends ReadonlyArray<unknown>, B>(
  f: (...a: A) => Either<E, B>
): (...a: A) => TaskEither<E, B> {
  return (...a) => fromEither(f(...a))
}

/**
 * @category combinators
 * @since 2.4.0
 */
export function fromIOEitherK<E, A extends ReadonlyArray<unknown>, B>(
  f: (...a: A) => IOEither<E, B>
): (...a: A) => TaskEither<E, B> {
  return (...a) => fromIOEither(f(...a))
}

/**
 * Less strict version of [`chainEitherK`](#chainEitherK).
 *
 * @category combinators
 * @since 2.6.1
 */
export const chainEitherKW: <E, A, B>(
  f: (a: A) => Either<E, B>
) => <D>(ma: TaskEither<D, A>) => TaskEither<D | E, B> = (f) => chainW(fromEitherK(f))

/**
 * @category combinators
 * @since 2.4.0
 */
export const chainEitherK: <E, A, B>(
  f: (a: A) => Either<E, B>
) => (ma: TaskEither<E, A>) => TaskEither<E, B> = chainEitherKW

/**
 * Less strict version of [`chainIOEitherK`](#chainIOEitherK).
 *
 * @category combinators
 * @since 2.6.1
 */
export const chainIOEitherKW: <E, A, B>(
  f: (a: A) => IOEither<E, B>
) => <D>(ma: TaskEither<D, A>) => TaskEither<D | E, B> = (f) => chainW(fromIOEitherK(f))

/**
 * @category combinators
 * @since 2.4.0
 */
export const chainIOEitherK: <E, A, B>(
  f: (a: A) => IOEither<E, B>
) => (ma: TaskEither<E, A>) => TaskEither<E, B> = chainIOEitherKW

// -------------------------------------------------------------------------------------
// non-pipeables
// -------------------------------------------------------------------------------------

const _map: Monad2<URI>['map'] = (fa, f) => pipe(fa, map(f))
/* istanbul ignore next */
const _bimap: Bifunctor2<URI>['bimap'] = (fa, f, g) => pipe(fa, bimap(f, g))
/* istanbul ignore next */
const _mapLeft: Bifunctor2<URI>['mapLeft'] = (fa, f) => pipe(fa, mapLeft(f))
const _apPar: Monad2<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa))
const _apSeq: Applicative2<URI>['ap'] = (fab, fa) =>
  pipe(
    fab,
    chain((f) => pipe(fa, map(f)))
  )
/* istanbul ignore next */
const _chain: Monad2<URI>['chain'] = (ma, f) => pipe(ma, chain(f))
/* istanbul ignore next */
const _alt: Alt2<URI>['alt'] = (fa, that) => pipe(fa, alt(that))

// -------------------------------------------------------------------------------------
// pipeables
// -------------------------------------------------------------------------------------

/**
 * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
 * use the type constructor `F` to represent some computational context.
 *
 * @category Functor
 * @since 2.0.0
 */
export const map: <A, B>(f: (a: A) => B) => <E>(fa: TaskEither<E, A>) => TaskEither<E, B> =
  /*#__PURE__*/
  ET.map_(T.Functor)

/**
 * Map a pair of functions over the two type arguments of the bifunctor.
 *
 * @category Bifunctor
 * @since 2.0.0
 */
export const bimap: <E, G, A, B>(f: (e: E) => G, g: (a: A) => B) => (fa: TaskEither<E, A>) => TaskEither<G, B> =
  /*#__PURE__*/
  ET.bimap_(T.Functor)

/**
 * Map a function over the first type argument of a bifunctor.
 *
 * @category Bifunctor
 * @since 2.0.0
 */
export const mapLeft: <E, G>(f: (e: E) => G) => <A>(fa: TaskEither<E, A>) => TaskEither<G, A> =
  /*#__PURE__*/
  ET.mapLeft_(T.Functor)

/**
 * Apply a function to an argument under a type constructor.
 *
 * @category Apply
 * @since 2.0.0
 */
export const ap: <E, A>(fa: TaskEither<E, A>) => <B>(fab: TaskEither<E, (a: A) => B>) => TaskEither<E, B> =
  /*#__PURE__*/
  ET.ap_(T.ApplyPar)

/**
 * Less strict version of [`ap`](#ap).
 *
 * @category Apply
 * @since 2.8.0
 */
export const apW: <D, A>(
  fa: TaskEither<D, A>
) => <E, B>(fab: TaskEither<E, (a: A) => B>) => TaskEither<D | E, B> = ap as any

/**
 * Composes computations in sequence, using the return value of one computation to determine the next computation.
 *
 * @category Monad
 * @since 2.0.0
 */
export const chain: <E, A, B>(f: (a: A) => TaskEither<E, B>) => (ma: TaskEither<E, A>) => TaskEither<E, B> =
  /*#__PURE__*/
  ET.chain_(T.Monad)

/**
 * Less strict version of [`chain`](#chain).
 *
 * @category Monad
 * @since 2.6.0
 */
export const chainW: <E, A, B>(
  f: (a: A) => TaskEither<E, B>
) => <D>(ma: TaskEither<D, A>) => TaskEither<D | E, B> = chain as any

/**
 * Derivable from `Monad`.
 *
 * @category combinators
 * @since 2.0.0
 */
export const flatten: <E, A>(mma: TaskEither<E, TaskEither<E, A>>) => TaskEither<E, A> =
  /*#__PURE__*/
  chain(identity)

/**
 * Identifies an associative operation on a type constructor. It is similar to `Semigroup`, except that it applies to
 * types of kind `* -> *`.
 *
 * In case of `TaskEither` returns `fa` if is a `Right` or the value returned by `that` otherwise.
 *
 * See also [orElse](#orElse).
 *
 * @example
 * import * as E from 'fp-ts/Either'
 * import { pipe } from 'fp-ts/function'
 * import * as TE from 'fp-ts/TaskEither'
 *
 * async function test() {
 *   assert.deepStrictEqual(
 *     await pipe(
 *       TE.right(1),
 *       TE.alt(() => TE.right(2))
 *     )(),
 *     E.right(1)
 *   )
 *   assert.deepStrictEqual(
 *     await pipe(
 *       TE.left('a'),
 *       TE.alt(() => TE.right(2))
 *     )(),
 *     E.right(2)
 *   )
 *   assert.deepStrictEqual(
 *     await pipe(
 *       TE.left('a'),
 *       TE.alt(() => TE.left('b'))
 *     )(),
 *     E.left('b')
 *   )
 * }
 *
 * test()
 *
 * @category Alt
 * @since 2.0.0
 */
export const alt: <E, A>(that: Lazy<TaskEither<E, A>>) => (fa: TaskEither<E, A>) => TaskEither<E, A> =
  /*#__PURE__*/
  ET.alt_(T.Monad)

/**
 * Less strict version of [`alt`](#alt).
 *
 * @category Alt
 * @since 2.9.0
 */
export const altW: <E2, B>(
  that: Lazy<TaskEither<E2, B>>
) => <E1, A>(fa: TaskEither<E1, A>) => TaskEither<E1 | E2, A | B> = alt as any

/**
 * Wrap a value into the type constructor.
 *
 * Equivalent to [`right`](#right).
 *
 * @category Applicative
 * @since 2.0.0
 */
export const of: Pointed2<URI>['of'] = right

/**
 * @category MonadIO
 * @since 2.7.0
 */
export const fromIO: MonadIO2<URI>['fromIO'] = rightIO

/**
 * @category MonadTask
 * @since 2.7.0
 */
export const fromTask: MonadTask2<URI>['fromTask'] = rightTask

/**
 * @category MonadTask
 * @since 2.7.0
 */
export const throwError: MonadThrow2<URI>['throwError'] = left

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * @category instances
 * @since 2.0.0
 */
export const URI = 'TaskEither'

/**
 * @category instances
 * @since 2.0.0
 */
export type URI = typeof URI

declare module './HKT' {
  interface URItoKind2<E, A> {
    readonly [URI]: TaskEither<E, A>
  }
}

/**
 * Semigroup returning the left-most non-`Left` value. If both operands are `Right`s then the inner values are
 * concatenated using the provided `Semigroup`
 *
 * @category instances
 * @since 2.0.0
 */
export function getSemigroup<E, A>(S: Semigroup<A>): Semigroup<TaskEither<E, A>> {
  return T.getSemigroup(E.getSemigroup(S))
}

/**
 * Semigroup returning the left-most `Left` value. If both operands are `Right`s then the inner values
 * are concatenated using the provided `Semigroup`
 *
 * @category instances
 * @since 2.0.0
 */
export function getApplySemigroup<E, A>(S: Semigroup<A>): Semigroup<TaskEither<E, A>> {
  return T.getSemigroup(E.getApplySemigroup(S))
}

/**
 * @category instances
 * @since 2.0.0
 */
export function getApplyMonoid<E, A>(M: Monoid<A>): Monoid<TaskEither<E, A>> {
  return {
    concat: getApplySemigroup<E, A>(M).concat,
    empty: right(M.empty)
  }
}

/**
 * @category instances
 * @since 2.7.0
 */
export function getApplicativeTaskValidation<E>(A: Apply1<T.URI>, S: Semigroup<E>): Applicative2C<URI, E> {
  const ap = ap_(A, E.getApplicativeValidation(S))
  return {
    URI,
    _E: undefined as any,
    map: _map,
    ap: (fab, fa) => pipe(fab, ap(fa)),
    of
  }
}

/**
 * @category instances
 * @since 2.7.0
 */
export function getAltTaskValidation<E>(S: Semigroup<E>): Alt2C<URI, E> {
  const alt = ET.altValidation_(T.Monad, S)
  return {
    URI,
    _E: undefined as any,
    map: _map,
    alt: (fa, that) => pipe(fa, alt(that))
  }
}

// TODO: remove in v3
/**
 * @category instances
 * @since 2.0.0
 */
export function getTaskValidation<E>(
  SE: Semigroup<E>
): Monad2C<URI, E> & Bifunctor2<URI> & Alt2C<URI, E> & MonadTask2C<URI, E> & MonadThrow2C<URI, E> {
  const applicativeTaskValidation = getApplicativeTaskValidation(T.ApplicativePar, SE)
  const altTaskValidation = getAltTaskValidation(SE)
  return {
    URI,
    _E: undefined as any,
    map: _map,
    ap: applicativeTaskValidation.ap,
    of,
    chain: _chain,
    bimap: _bimap,
    mapLeft: _mapLeft,
    alt: altTaskValidation.alt,
    fromIO,
    fromTask,
    throwError
  }
}

/**
 * @category instances
 * @since 2.10.0
 */
export const getCompactable = <E>(M: Monoid<E>): Compactable2C<URI, E> => {
  const C: Compactable2C<E.URI, E> & Functor2<E.URI> = { ...E.getCompactable(M), ...E.Functor }
  return {
    URI,
    _E: undefined as any,
    compact: compact_(T.Functor, C),
    separate: separate_(T.Functor, C)
  }
}

/**
 * @category instances
 * @since 2.1.0
 */
export function getFilterable<E>(M: Monoid<E>): Filterable2C<URI, E> {
  const F = E.getFilterable(M)
  const C = getCompactable(M)

  const filter = filter_(T.Functor, F)
  const filterMap = filterMap_(T.Functor, F)
  const partition = partition_(T.Functor, F)
  const partitionMap = partitionMap_(T.Functor, F)
  return {
    URI,
    _E: undefined as any,
    map: _map,
    compact: C.compact,
    separate: C.separate,
    filter: <A>(fa: TaskEither<E, A>, predicate: Predicate<A>) => pipe(fa, filter(predicate)),
    filterMap: (fa, f) => pipe(fa, filterMap(f)),
    partition: <A>(fa: TaskEither<E, A>, predicate: Predicate<A>) => pipe(fa, partition(predicate)),
    partitionMap: (fa, f) => pipe(fa, partitionMap(f))
  }
}

/**
 * @category instances
 * @since 2.7.0
 */
export const Functor: Functor2<URI> = {
  URI,
  map: _map
}

/**
 * @category instances
 * @since 2.10.0
 */
export const Pointed: Pointed2<URI> = {
  URI,
  map: _map,
  of
}

/**
 * @category instances
 * @since 2.10.0
 */
export const ApplyPar: Apply2<URI> = {
  URI,
  map: _map,
  ap: _apPar
}

/**
 * Combine two effectful actions, keeping only the result of the first.
 *
 * Derivable from `Apply`.
 *
 * @category combinators
 * @since 2.0.0
 */
export const apFirst =
  /*#__PURE__*/
  apFirst_(ApplyPar)

/**
 * Combine two effectful actions, keeping only the result of the second.
 *
 * Derivable from `Apply`.
 *
 * @category combinators
 * @since 2.0.0
 */
export const apSecond =
  /*#__PURE__*/
  apSecond_(ApplyPar)

/**
 * @category instances
 * @since 2.7.0
 */
export const ApplicativePar: Applicative2<URI> = {
  URI,
  map: _map,
  ap: _apPar,
  of
}

/**
 * @category instances
 * @since 2.10.0
 */
export const ApplySeq: Apply2<URI> = {
  URI,
  map: _map,
  ap: _apSeq
}

/**
 * @category instances
 * @since 2.7.0
 */
export const ApplicativeSeq: Applicative2<URI> = {
  URI,
  map: _map,
  ap: _apSeq,
  of
}

/**
 * @category instances
 * @since 2.10.0
 */
export const Monad: Monad2<URI> = {
  URI,
  map: _map,
  ap: _apPar,
  of,
  chain: _chain
}

/**
 * Composes computations in sequence, using the return value of one computation to determine the next computation and
 * keeping only the result of the first.
 *
 * Derivable from `Monad`.
 *
 * @category combinators
 * @since 2.0.0
 */
export const chainFirst: <E, A, B>(f: (a: A) => TaskEither<E, B>) => (ma: TaskEither<E, A>) => TaskEither<E, A> =
  /*#__PURE__*/
  chainFirst_(Monad)

/**
 * Less strict version of [`chainFirst`](#chainFirst).
 *
 * Derivable from `Monad`.
 *
 * @category combinators
 * @since 2.8.0
 */
export const chainFirstW: <E, A, B>(
  f: (a: A) => TaskEither<E, B>
) => <D>(ma: TaskEither<D, A>) => TaskEither<D | E, A> = chainFirst as any

/**
 * @category instances
 * @since 2.7.0
 */
export const Bifunctor: Bifunctor2<URI> = {
  URI,
  bimap: _bimap,
  mapLeft: _mapLeft
}

/**
 * @category instances
 * @since 2.7.0
 */
export const Alt: Alt2<URI> = {
  URI,
  map: _map,
  alt: _alt
}

// TODO: remove in v3
/**
 * @category instances
 * @since 2.0.0
 */
export const taskEither: Monad2<URI> & Bifunctor2<URI> & Alt2<URI> & MonadTask2<URI> & MonadThrow2<URI> = {
  URI,
  bimap: _bimap,
  mapLeft: _mapLeft,
  map: _map,
  of,
  ap: _apPar,
  chain: _chain,
  alt: _alt,
  fromIO,
  fromTask,
  throwError
}

// TODO: remove in v3
/**
 * Like `TaskEither` but `ap` is sequential
 *
 * @category instances
 * @since 2.0.0
 */
export const taskEitherSeq: typeof taskEither = {
  URI,
  bimap: _bimap,
  mapLeft: _mapLeft,
  map: _map,
  of,
  ap: _apSeq,
  chain: _chain,
  alt: _alt,
  fromIO,
  fromTask,
  throwError
}

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

/**
 * Convert a node style callback function to one returning a `TaskEither`
 *
 * **Note**. If the function `f` admits multiple overloadings, `taskify` will pick last one. If you want a different
 * behaviour, add an explicit type annotation
 *
 * ```ts
 * // readFile admits multiple overloadings
 *
 * // const readFile: (a: string) => TaskEither<NodeJS.ErrnoException, Buffer>
 * const readFile = taskify(fs.readFile)
 *
 * const readFile2: (filename: string, encoding: string) => TaskEither<NodeJS.ErrnoException, Buffer> = taskify(
 *   fs.readFile
 * )
 * ```
 *
 * @example
 * import { taskify } from 'fp-ts/TaskEither'
 * import * as fs from 'fs'
 *
 * // const stat: (a: string | Buffer) => TaskEither<NodeJS.ErrnoException, fs.Stats>
 * const stat = taskify(fs.stat)
 * assert.strictEqual(stat.length, 0)
 *
 * @since 2.0.0
 */
export function taskify<L, R>(f: (cb: (e: L | null | undefined, r?: R) => void) => void): () => TaskEither<L, R>
export function taskify<A, L, R>(
  f: (a: A, cb: (e: L | null | undefined, r?: R) => void) => void
): (a: A) => TaskEither<L, R>
export function taskify<A, B, L, R>(
  f: (a: A, b: B, cb: (e: L | null | undefined, r?: R) => void) => void
): (a: A, b: B) => TaskEither<L, R>
export function taskify<A, B, C, L, R>(
  f: (a: A, b: B, c: C, cb: (e: L | null | undefined, r?: R) => void) => void
): (a: A, b: B, c: C) => TaskEither<L, R>
export function taskify<A, B, C, D, L, R>(
  f: (a: A, b: B, c: C, d: D, cb: (e: L | null | undefined, r?: R) => void) => void
): (a: A, b: B, c: C, d: D) => TaskEither<L, R>
export function taskify<A, B, C, D, E, L, R>(
  f: (a: A, b: B, c: C, d: D, e: E, cb: (e: L | null | undefined, r?: R) => void) => void
): (a: A, b: B, c: C, d: D, e: E) => TaskEither<L, R>
export function taskify<L, R>(f: Function): () => TaskEither<L, R> {
  return function () {
    const args = Array.prototype.slice.call(arguments)
    return () =>
      new Promise((resolve) => {
        const cbResolver = (e: L, r: R) => (e != null ? resolve(E.left(e)) : resolve(E.right(r)))
        f.apply(null, args.concat(cbResolver))
      })
  }
}

/**
 * Make sure that a resource is cleaned up in the event of an exception (\*). The release action is called regardless of
 * whether the body action throws (\*) or returns.
 *
 * (\*) i.e. returns a `Left`
 *
 * Derivable from `MonadThrow`.
 *
 * @since 2.0.0
 */
export const bracket = <E, A, B>(
  acquire: TaskEither<E, A>,
  use: (a: A) => TaskEither<E, B>,
  release: (a: A, e: Either<E, B>) => TaskEither<E, void>
): TaskEither<E, B> =>
  pipe(
    acquire,
    chain((a) =>
      pipe(
        pipe(use(a), T.map(E.right)),
        chain((e) =>
          pipe(
            release(a, e),
            chain(() => (E.isLeft(e) ? left(e.left) : of(e.right)))
          )
        )
      )
    )
  )

// -------------------------------------------------------------------------------------
// do notation
// -------------------------------------------------------------------------------------

/**
 * @since 2.9.0
 */
export const Do: TaskEither<never, {}> =
  /*#__PURE__*/
  of({})

/**
 * @since 2.8.0
 */
export const bindTo =
  /*#__PURE__*/
  bindTo_(Functor)

/**
 * @since 2.8.0
 */
export const bind =
  /*#__PURE__*/
  bind_(Monad)

/**
 * @since 2.8.0
 */
export const bindW: <N extends string, A, D, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => TaskEither<D, B>
) => <E>(fa: TaskEither<E, A>) => TaskEither<D | E, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> = bind as any

// -------------------------------------------------------------------------------------
// pipeable sequence S
// -------------------------------------------------------------------------------------

/**
 * @since 2.8.0
 */
export const apS =
  /*#__PURE__*/
  apS_(ApplyPar)

/**
 * @since 2.8.0
 */
export const apSW: <A, N extends string, D, B>(
  name: Exclude<N, keyof A>,
  fb: TaskEither<D, B>
) => <E>(fa: TaskEither<E, A>) => TaskEither<D | E, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> = apS as any

// -------------------------------------------------------------------------------------
// array utils
// -------------------------------------------------------------------------------------

/**
 * @since 2.9.0
 */
export const traverseArrayWithIndex: <A, B, E>(
  f: (index: number, a: A) => TaskEither<E, B>
) => (arr: ReadonlyArray<A>) => TaskEither<E, ReadonlyArray<B>> = (f) => (arr) =>
  pipe(arr, T.traverseArrayWithIndex(f), T.map(E.sequenceArray))

/**
 * this function has the same behavior of `A.traverse(TE.taskEither)` but it's stack safe and performs better
 *
 * *this function run all tasks in parallel and does not bail out, for sequential version use `traverseSeqArray`*
 *
 * @example
 *
 * import * as TE from 'fp-ts/TaskEither'
 * import * as A from 'fp-ts/Array'
 * import { right } from 'fp-ts/Either'
 * import { pipe } from 'fp-ts/function'
 *
 * const PostRepo = {
 *  findById : (id: number) => TE.of({id, title: ''})
 * }
 *
 * const findAllPosts = (ids:number[]) => pipe(ids, TE.traverseArray(PostRepo.findById))
 *
 * async function test() {
 *   const ids = A.range(0, 10)
 *
 *   assert.deepStrictEqual(
 *     await findAllPosts(ids)(),
 *     right(
 *       pipe(
 *         ids,
 *         A.map((id) => ({ id, title: ''}))
 *       )
 *     )
 *   )
 * }
 *
 * test()
 *
 * @since 2.9.0
 */
export const traverseArray: <A, B, E>(
  f: (a: A) => TaskEither<E, B>
) => (arr: ReadonlyArray<A>) => TaskEither<E, ReadonlyArray<B>> = (f) => traverseArrayWithIndex((_, a) => f(a))

/**
 * this function has the same behavior of `A.sequence(TE.taskEither)` but it's stack safe and performs better
 *
 * *this function run all tasks in parallel and does not bail out, for sequential version use `sequenceSeqArray`*
 *
 * @example
 *
 * import * as TE from 'fp-ts/TaskEither'
 * import * as A from 'fp-ts/Array'
 * import { right } from 'fp-ts/Either'
 * import { pipe } from 'fp-ts/function'
 *
 * const PostRepo = {
 *  findById : (id: number) => TE.of({id, title: ''})
 * }
 *
 * const findAllPosts = (ids:number[]) => pipe(ids, A.map(PostRepo.findById), TE.sequenceArray)
 *
 * async function test() {
 *   const ids = A.range(0, 10)
 *
 *   assert.deepStrictEqual(
 *     await findAllPosts(ids)(),
 *     right(
 *       pipe(
 *         ids,
 *         A.map((id) => ({ id, title: ''}))
 *       )
 *     )
 *   )
 * }
 *
 * test()
 *
 * @since 2.9.0
 */
export const sequenceArray: <A, E>(arr: ReadonlyArray<TaskEither<E, A>>) => TaskEither<E, ReadonlyArray<A>> =
  /*#__PURE__*/
  traverseArray(identity)

/**
 * @since 2.9.0
 */
export const traverseSeqArrayWithIndex: <A, B, E>(
  f: (index: number, a: A) => TaskEither<E, B>
) => (arr: ReadonlyArray<A>) => TaskEither<E, ReadonlyArray<B>> = (f) => (arr) => async () => {
  // tslint:disable-next-line: readonly-array
  const result = []
  for (let i = 0; i < arr.length; i++) {
    const e = await f(i, arr[i])()
    if (E.isLeft(e)) {
      return e
    }
    result.push(e.right)
  }

  return E.right(result)
}

/**
 * this function has the same behavior of `A.traverse(TE.taskEitherSeq)` but it's stack safe and performs better
 *
 * *this function run all tasks in sequential order and bails out on left side of either, for parallel version use `traverseArray`*
 *
 * @since 2.9.0
 */
export const traverseSeqArray: <A, B, E>(
  f: (a: A) => TaskEither<E, B>
) => (arr: ReadonlyArray<A>) => TaskEither<E, ReadonlyArray<B>> = (f) => traverseSeqArrayWithIndex((_, a) => f(a))

/**
 * this function has the same behavior of `A.sequence(TE.taskEitherSeq)` but it's stack safe and performs better
 *
 * *this function run all tasks in sequential order and bails out on left side of either, for parallel version use `sequenceArray`*
 *
 * @since 2.9.0
 */
export const sequenceSeqArray: <A, E>(arr: ReadonlyArray<TaskEither<E, A>>) => TaskEither<E, ReadonlyArray<A>> =
  /*#__PURE__*/
  traverseSeqArray(identity)
