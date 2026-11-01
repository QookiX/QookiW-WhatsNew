export function BootScreen({ label = '正在预热烤箱' }: { label?: string }) {
  return (
    <div className="boot">
      <div className="boot__inner">
        <p className="boot__label">
          <i className="boot__pulse" />
          {label}
        </p>
        <div className="skeleton" style={{ height: 76, borderRadius: 22 }} />
        <div className="skeleton" style={{ height: 34, width: '62%' }} />
        <div className="skeleton" style={{ height: 34, width: '44%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 10 }}>
          <div className="skeleton" style={{ height: 148, borderRadius: 18 }} />
          <div className="skeleton" style={{ height: 148, borderRadius: 18 }} />
        </div>
      </div>
    </div>
  )
}
