import './grid/index.js'
import './nav/index.js'
import { setDevMode, isDevMode, loadDevEnv } from './util/dev-mode.js'
import { configure } from './config.js'


const DEFAULT_BASE_URL = 'https://dp5ho7dvg88z2.cloudfront.net'
const grid = document.querySelector('controlled-grid')

if (isDevMode()) {
  loadDevEnv().then(config => {
    configure(config)
    const envBaseURL = config['S3_PUBLISH_URL_BASE']
    const envBucket = config['S3_PUBLISH_BUCKET']
    const envBucketURL = envBucket && `https://${envBucket}.s3.amazonaws.com`

    if (!envBaseURL && !envBucket) {
      console.warn('No S3_PUBLISH_URL_BASE or S3_PUBLISH_BUCKET found in env, falling back to prod default.')
    }

    const baseURL = envBaseURL ?? envBucketURL ?? DEFAULT_BASE_URL
    grid.setAttribute('base-url', baseURL)
  })
} else {
  grid.setAttribute('base-url', DEFAULT_BASE_URL)
}

window.setDevMode = setDevMode
