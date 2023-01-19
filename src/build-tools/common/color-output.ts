export function redError(message: string) {
  console.error("\x1b[31m%s\x1b[0m", message);
}
export function greenInfo(message: string) {
  console.info("\x1b[32m%s\x1b[0m", message);
}
export function cyanInfo(message: string) {
  console.info("\x1b[36m%s\x1b[0m", message);
}
