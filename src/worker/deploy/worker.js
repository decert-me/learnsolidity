import { Provider } from '@remix-project/remix-simulator';

let provider = null
self.onmessage = (e) => {
  const data = e.data
  switch (data.cmd) {
    case 'init':
    {
      provider = new Provider({ fork: data.fork })
      if (provider) provider.init().then()
      break
    }
    case 'sendAsync':
    {
      console.log(provider);
      if (provider) {
        provider.sendAsync(data.query, (error, result) => {
          self.postMessage({
            cmd: 'sendAsyncResult',
            error,
            result,
            stamp: data.stamp
          })
        })
      } else {
        self.postMessage({
          cmd: 'sendAsyncResult',
          error: 'Provider not instantiated',
          result: null,
          stamp: data.stamp
        })
      }

      break
    }
  }
}