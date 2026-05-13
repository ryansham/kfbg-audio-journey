import {useRef} from 'react'

interface DisplayedDoc {
  slug?: {current?: string}
  title_en?: string
}

interface JourneyPreviewProps {
  document: {
    displayed: DisplayedDoc
  }
  options?: {
    baseUrl: string
  }
}

export function JourneyPreview({document: {displayed}, options}: JourneyPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const slug = displayed?.slug?.current
  const baseUrl = options?.baseUrl ?? 'https://ryansham.github.io/kfbg-audio-journey'

  if (!slug) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#888',
        fontSize: '14px',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <span style={{fontSize: '32px'}}>🔍</span>
        <span>Save a slug first to enable preview.</span>
      </div>
    )
  }

  const url = `${baseUrl}/?journey=${slug}`

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      {/* URL bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        background: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}>
        <span style={{color: '#888'}}>🔗</span>
        <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#444'}}>
          {url}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            color: '#0066cc',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            padding: '2px 8px',
            border: '1px solid #0066cc',
            borderRadius: '4px',
          }}
        >
          Open ↗
        </a>
        <button
          onClick={() => {
            if (iframeRef.current) iframeRef.current.src = url
          }}
          style={{
            padding: '2px 8px',
            border: '1px solid #aaa',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ↺ Reload
        </button>
      </div>

      {/* iframe */}
      <iframe
        ref={iframeRef}
        src={url}
        style={{flex: 1, border: 'none', width: '100%'}}
        title={`Preview — ${slug}`}
      />
    </div>
  )
}
