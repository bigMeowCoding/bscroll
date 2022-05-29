export function extend(target, source) {
  for (let i in source) {
    target[i] = source[i];
  }
}
