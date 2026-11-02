// Ignore results after cleanup, including obsolete requests and unmounted views.
export function observeRequest(load, onSuccess, onError) {
  let active = true
  const done = (async () => {
    try {
      const data = await load()
      if (active) onSuccess(data)
    } catch (error) {
      if (active) onError(error)
    }
  })()
  return { done, cancel: () => { active = false } }
}
