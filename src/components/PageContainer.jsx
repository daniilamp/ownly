/**
 * PageContainer Component
 * Wrapper for internal pages with consistent styling
 */

export default function PageContainer({ children, title, subtitle, icon: Icon }) {
  return (
    <div className="relative z-10 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        {(title || subtitle) && (
          <div className="mb-12 animate-fadeIn">
            <div className="flex items-center gap-4 mb-4">
              {Icon && (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.25)' }}>
                  <Icon className="w-6 h-6" style={{ color: '#B794F6' }} />
                </div>
              )}
              <h1 className="text-4xl font-bold" style={{ color: '#F0EAFF' }}>
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="text-lg" style={{ color: 'rgba(240,234,255,0.5)' }}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="animate-fadeIn">
          {children}
        </div>
      </div>
    </div>
  );
}
