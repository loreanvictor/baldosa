import { IMG_SIZES, BLUR_MAP } from '../../render/image/constants.js'
import { PICSUM_IDS } from './imgids.js'
import { COLORS, TITLES, SUBTITLES } from './strings.js'


export const createPicsumMockRepo = () => {
  const data = new Map()
  data.set('0,0',
    {
      x: 0, y: 0,
      background: '#EFA73E',
      image: { i: 'https://loreanvictor.github.io/baldosa/sign.png' },
    }
  )

  for (let i = -500; i <= 500; i++) {
    for (let j = -500; j <= 500; j++) {
      if (Math.abs(i) <= 1 && Math.abs(j) <= 1 && i * j === 0) {
        continue
      }
      
      if (Math.random() > 0.95) {
        continue
      }
      
      const post = {
        x: i, y: j,
        title: TITLES[Math.floor(Math.random() * TITLES.length)],
        subtitle: SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)],
        image: { },
      }

      const imgrand = `${i+500}-${j+500}`
      const idx = Math.floor(Math.random() * PICSUM_IDS.length)
      const imgid = PICSUM_IDS[idx];
      Object.keys(IMG_SIZES).forEach(size => {
        post.image[size] = `https://picsum.photos/id/${imgid}/${IMG_SIZES[size]}?r=${imgrand}`
          + (BLUR_MAP[size] ? `&blur=${BLUR_MAP[size]}` : '')
      })
      
      if (Math.random() > 0.8) {
        delete post['title']
        delete post['subtitle']
      } else if (Math.random() > 0.7) {
        if (Math.random() > 0.5) {
          post['title'] = post['subtitle']
        }
        
        delete post['subtitle'];
      } else if (Math.random() > 0.9) {
        delete post['image']
        post['background'] = COLORS[Math.floor(Math.random() * COLORS.length)]
        post['color'] = '#000'
      }
      
      data.set(`${i},${j}`, post)
    }
  }
  
  return {
    get: (x, y) => data.get(`${x},${y}`),
    listen: () => () => {}
  }
}
