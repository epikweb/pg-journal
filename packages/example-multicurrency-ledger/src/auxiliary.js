const sleep = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration))

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x)

const buildReducer = (initialState, handlers) => (events) =>
  events.reduce((state, event) => {
    if (handlers[event.type]) {
      return handlers[event.type](state, event)
    }
    return state
  }, initialState)

module.exports = { sleep, pipe, buildReducer }
