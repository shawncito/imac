function SVAHand({ color = '#F05A24' }: { color?: string }) {
  return (
    <svg viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
      {/* 4 fingers */}
      <rect x="4"  y="2"  width="13" height="36" rx="6.5" fill={color}/>
      <rect x="21" y="2"  width="13" height="36" rx="6.5" fill={color}/>
      <rect x="38" y="2"  width="13" height="36" rx="6.5" fill={color}/>
      <rect x="55" y="2"  width="13" height="36" rx="6.5" fill={color}/>
      {/* Outer palm arc */}
      <path d="M1 30 Q36 72 79 30" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none"/>
      {/* Inner smile arc */}
      <path d="M26 52 Q36 63 54 52" stroke={color} strokeWidth="7" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function SVAHandIcon({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-[#6B21E8] flex items-center justify-center ${className}`}>
      <SVAHand color="#F05A24" />
    </div>
  )
}

export function SVAHandRaw({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="4"  y="2"  width="13" height="36" rx="6.5" fill="#F05A24"/>
      <rect x="21" y="2"  width="13" height="36" rx="6.5" fill="#F05A24"/>
      <rect x="38" y="2"  width="13" height="36" rx="6.5" fill="#F05A24"/>
      <rect x="55" y="2"  width="13" height="36" rx="6.5" fill="#F05A24"/>
      <path d="M1 30 Q36 72 79 30" stroke="#F05A24" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M26 52 Q36 63 54 52" stroke="#F05A24" strokeWidth="7" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function SVALogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SVAHandRaw className="w-9 h-8 flex-shrink-0" />
      <div className="flex flex-col leading-tight">
        <span className="text-white font-bold text-[11px] tracking-[0.12em] uppercase">
          Servicio Voluntario
        </span>
        <span className="text-[#F05A24] font-bold text-[11px] tracking-[0.12em] uppercase">
          Adventista
        </span>
      </div>
    </div>
  )
}
