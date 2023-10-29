
const AsyncFn = async _ => {
  return await Promise.resolve('async')
}

module.exports = _ => AsyncFn
