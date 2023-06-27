// import sum from "hash-sum"
// import fjsh from "fast-json-stable-hash"
import hash from "f-hash"

export function getFingerprint(input: unknown): unknown {
  // return hash(input)
  // return fjsh.hash(input)
  // return sum(input)
  return JSON.stringify(input)
}
