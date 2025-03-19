import { onCleanup } from 'minicomp'


export const useWorker = (script) => {
  const worker = new Worker(script)
  onCleanup(() => worker.terminate())

  return worker
}
