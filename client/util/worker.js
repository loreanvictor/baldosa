import { onCleanup } from 'https://esm.sh/minicomp'


export const useWorker = (script) => {
  const worker = new Worker(script)
  onCleanup(() => worker.terminate())

  return worker
}
