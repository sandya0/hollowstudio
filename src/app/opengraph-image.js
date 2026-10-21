import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Hollo Studio | Web Design and Development'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const anton = await readFile(join(process.cwd(), 'public/fonts/Anton-Regular.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#1a1a1a',
          color: '#F2F0EF',
          fontFamily: 'Anton',
          textTransform: 'uppercase',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 4, color: '#9A9A9A' }}>
          hollostudio.site
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 190, lineHeight: 0.9, letterSpacing: -3 }}>
            Hollo Studio
          </div>
          <div style={{ display: 'flex', fontSize: 44, marginTop: 28, color: '#FF4B33' }}>
            Web Design and Development
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Anton', data: anton, style: 'normal', weight: 400 }],
    }
  )
}
