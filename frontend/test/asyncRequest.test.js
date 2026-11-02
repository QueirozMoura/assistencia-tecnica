import test from 'node:test'
import assert from 'node:assert/strict'
import { observeRequest } from '../src/utils/asyncRequest.js'

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

test('request commits a successful result once', async () => {
  const results = [], errors = []
  await observeRequest(async () => ({ id: 1 }), data => results.push(data), error => errors.push(error)).done
  assert.deepEqual(results, [{ id: 1 }])
  assert.deepEqual(errors, [])
})
test('request reports a rejection without committing data', async () => {
  const errors = []
  await observeRequest(async () => { throw new Error('fixture-error') }, () => assert.fail('Unexpected result'), error => errors.push(error.message)).done
  assert.deepEqual(errors, ['fixture-error'])
})
test('request handles a synchronous loader exception', async () => {
  const errors = []
  await observeRequest(() => { throw new Error('sync-error') }, () => assert.fail('Unexpected result'), error => errors.push(error.message)).done
  assert.deepEqual(errors, ['sync-error'])
})
test('unmounted request cannot update success or error state', async () => {
  for (const shouldReject of [false, true]) {
    const pending = deferred()
    const request = observeRequest(() => pending.promise, () => assert.fail('Updated after cleanup'), () => assert.fail('Error after cleanup'))
    request.cancel()
    if (shouldReject) pending.reject(new Error('old-error'))
    else pending.resolve({ old: true })
    await request.done
  }
})
test('old filters resolving after the current query cannot replace the current data', async () => {
  const previous = deferred(), current = deferred(), results = []
  const oldRequest = observeRequest(() => previous.promise, value => results.push(value), () => assert.fail('Unexpected error'))
  oldRequest.cancel()
  const newRequest = observeRequest(() => current.promise, value => results.push(value), () => assert.fail('Unexpected error'))
  current.resolve('current-filter')
  await newRequest.done
  previous.resolve('old-filter')
  await oldRequest.done
  assert.deepEqual(results, ['current-filter'])
})
test('a stale failure cannot replace a newer successful request with an error', async () => {
  const previous = deferred(), errors = [], results = []
  const oldRequest = observeRequest(() => previous.promise, value => results.push(value), error => errors.push(error))
  oldRequest.cancel()
  await observeRequest(async () => 'reloaded', value => results.push(value), error => errors.push(error)).done
  previous.reject(new Error('stale'))
  await oldRequest.done
  assert.deepEqual(results, ['reloaded'])
  assert.deepEqual(errors, [])
})
test('an explicit retry can recover after a failed request', async () => {
  const events = []
  await observeRequest(async () => { throw new Error('offline') }, value => events.push(value), error => events.push(error.message)).done
  await observeRequest(async () => [], value => events.push(value), error => events.push(error.message)).done
  assert.deepEqual(events, ['offline', []])
})
