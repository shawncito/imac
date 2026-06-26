import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function DesktopGate() {
  const [isDesktop, setIsDesktop] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isDesktop) return
    const url = 'https://imac.rlp.lat/'
    QRCode.toDataURL(url, {
      width: 180,
      margin: 2,
      color: { dark: '#14110b', light: '#F4F1EB' },
    }).then(setQrDataUrl)
  }, [isDesktop])

  if (!isDesktop) return null

  return (
    <div className="desktop-gate">
      <div className="desktop-gate__card">
        {/* Phone illustration */}
        <div className="desktop-gate__phone" aria-hidden>
          <div className="dg-phone-body">
            <div className="dg-phone-notch" />
            <div className="dg-phone-screen">
              <div className="dg-phone-shimmer" />
              <div className="dg-phone-shimmer dg-phone-shimmer--sm" />
              <div className="dg-phone-shimmer dg-phone-shimmer--xs" />
            </div>
          </div>
          <div className="dg-phone-home" />
        </div>

        <div className="desktop-gate__body">
          <span className="desktop-gate__kicker">Diseñado para móvil</span>
          <h2 className="desktop-gate__title">Escanea con tu<br/>celular</h2>
          <p className="desktop-gate__sub">
            Esta app funciona mejor en tu teléfono.<br/>
            Abre la cámara y apunta al código.
          </p>

          {qrDataUrl && (
            <div className="desktop-gate__qr">
              <img src={qrDataUrl} alt="QR para abrir en celular" width={180} height={180} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
