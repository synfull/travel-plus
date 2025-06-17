export default function ItinerarySkeleton() {
    return (
      <div className="min-h-screen bg-dark-900">
        {/* Header Skeleton */}
        <header className="border-b border-white/10 bg-dark-900/80 backdrop-blur-md">
          <div className="container-custom py-4">
            <div className="flex items-center justify-between">
              <div className="skeleton h-8 w-32 rounded-lg" />
              <div className="flex items-center gap-4">
                <div className="skeleton h-10 w-10 rounded-lg" />
                <div className="skeleton h-10 w-10 rounded-lg" />
              </div>
            </div>
          </div>
        </header>
  
        {/* Hero Skeleton */}
        <section className="relative h-80 overflow-hidden">
          <div className="skeleton absolute inset-0" />
          <div className="relative z-10 container-custom py-20">
            <div className="skeleton h-12 w-3/4 mb-4 rounded-lg" />
            <div className="skeleton h-6 w-1/2 mb-6 rounded-lg" />
            <div className="flex gap-6">
              <div className="skeleton h-6 w-24 rounded-lg" />
              <div className="skeleton h-6 w-24 rounded-lg" />
              <div className="skeleton h-6 w-24 rounded-lg" />
            </div>
          </div>
        </section>
  
        {/* Content Skeleton */}
        <main className="container-custom py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Cards */}
              <div className="glass-card p-6">
                <div className="skeleton h-8 w-48 mb-4 rounded-lg" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg bg-white/5">
                      <div className="skeleton h-6 w-3/4 mb-2 rounded-lg" />
                      <div className="skeleton h-4 w-1/2 mb-2 rounded-lg" />
                      <div className="flex gap-2">
                        <div className="skeleton h-6 w-32 rounded-full" />
                        <div className="skeleton h-6 w-32 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
  
              {/* Highlights */}
              <div className="glass-card p-6">
                <div className="skeleton h-8 w-48 mb-4 rounded-lg" />
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="skeleton w-10 h-10 rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="skeleton h-5 w-full mb-2 rounded-lg" />
                        <div className="skeleton h-4 w-3/4 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
  
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="glass-card p-6">
                <div className="skeleton h-6 w-32 mb-4 rounded-lg" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-14 w-full rounded-xl" />
                  ))}
                </div>
              </div>
  
              {/* Weather Widget */}
              <div className="glass-card p-6">
                <div className="skeleton h-6 w-40 mb-4 rounded-lg" />
                <div className="text-center">
                  <div className="skeleton h-16 w-16 mx-auto mb-2 rounded-full" />
                  <div className="skeleton h-8 w-20 mx-auto mb-2 rounded-lg" />
                  <div className="skeleton h-4 w-32 mx-auto rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }