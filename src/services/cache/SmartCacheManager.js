/**
 * Smart Cache Manager
 * Phase 3: Intelligent caching with TTL, priority-based eviction, and performance optimization
 */

export class SmartCacheManager {
  constructor(options = {}) {
    this.options = {
      maxSize: 1000, // Maximum number of cache entries
      defaultTTL: 3600000, // 1 hour default TTL
      cleanupInterval: 300000, // 5 minutes cleanup interval
      enableCompression: true,
      enableMetrics: true,
      priorityLevels: {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
        CRITICAL: 4
      },
      ...options
    }

    // Cache storage
    this.cache = new Map()
    this.accessTimes = new Map()
    this.priorities = new Map()
    this.sizes = new Map()

    // Metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      totalSize: 0,
      lastCleanup: Date.now()
    }

    // Start periodic cleanup
    this.startCleanupTimer()
    
    console.log('💾 SmartCacheManager: Intelligent caching system initialized')
  }

  /**
   * Store data in cache with intelligent metadata
   */
  async set(key, data, options = {}) {
    const cacheOptions = {
      ttl: this.options.defaultTTL,
      priority: this.options.priorityLevels.MEDIUM,
      compress: this.options.enableCompression,
      tags: [],
      ...options
    }

    try {
      // Prepare cache entry
      const entry = {
        data: cacheOptions.compress ? this.compressData(data) : data,
        timestamp: Date.now(),
        ttl: cacheOptions.ttl,
        priority: cacheOptions.priority,
        tags: cacheOptions.tags,
        accessCount: 0,
        compressed: cacheOptions.compress
      }

      // Calculate size
      const size = this.calculateSize(entry)
      
      // Check if we need to make space
      if (this.cache.size >= this.options.maxSize) {
        await this.evictLeastImportant(size)
      }

      // Store in cache
      this.cache.set(key, entry)
      this.accessTimes.set(key, Date.now())
      this.priorities.set(key, cacheOptions.priority)
      this.sizes.set(key, size)

      // Update metrics
      this.metrics.totalSize += size
      
      console.log(`💾 SmartCacheManager: Cached "${key}" (${size} bytes, TTL: ${cacheOptions.ttl}ms, Priority: ${cacheOptions.priority})`)
      
      return true
    } catch (error) {
      console.error(`❌ SmartCacheManager: Failed to cache "${key}":`, error.message)
      return false
    }
  }

  /**
   * Retrieve data from cache with intelligent access tracking
   */
  async get(key) {
    this.metrics.totalRequests++

    if (!this.cache.has(key)) {
      this.metrics.misses++
      return null
    }

    const entry = this.cache.get(key)
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key)
      this.metrics.misses++
      return null
    }

    // Update access metadata
    entry.accessCount++
    this.accessTimes.set(key, Date.now())
    this.metrics.hits++

    // Decompress if needed
    const data = entry.compressed ? this.decompressData(entry.data) : entry.data
    
    console.log(`💾 SmartCacheManager: Cache hit for "${key}" (access count: ${entry.accessCount})`)
    return data
  }

  /**
   * Delete specific cache entry
   */
  delete(key) {
    if (this.cache.has(key)) {
      const size = this.sizes.get(key) || 0
      this.cache.delete(key)
      this.accessTimes.delete(key)
      this.priorities.delete(key)
      this.sizes.delete(key)
      this.metrics.totalSize -= size
      
      console.log(`💾 SmartCacheManager: Deleted "${key}" (freed ${size} bytes)`)
      return true
    }
    return false
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    if (!this.cache.has(key)) return false
    
    const entry = this.cache.get(key)
    if (this.isExpired(entry)) {
      this.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Get cache entry with metadata
   */
  getWithMetadata(key) {
    if (!this.has(key)) return null
    
    const entry = this.cache.get(key)
    const data = entry.compressed ? this.decompressData(entry.data) : entry.data
    
    return {
      data,
      metadata: {
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        priority: entry.priority,
        accessCount: entry.accessCount,
        tags: entry.tags,
        size: this.sizes.get(key),
        age: Date.now() - entry.timestamp
      }
    }
  }

  /**
   * Update TTL for existing cache entry
   */
  updateTTL(key, newTTL) {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)
      entry.ttl = newTTL
      entry.timestamp = Date.now() // Reset timestamp
      console.log(`💾 SmartCacheManager: Updated TTL for "${key}" to ${newTTL}ms`)
      return true
    }
    return false
  }

  /**
   * Update priority for existing cache entry
   */
  updatePriority(key, newPriority) {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)
      entry.priority = newPriority
      this.priorities.set(key, newPriority)
      console.log(`💾 SmartCacheManager: Updated priority for "${key}" to ${newPriority}`)
      return true
    }
    return false
  }

  /**
   * Clear cache entries by tags
   */
  clearByTags(tags) {
    const tagsToMatch = Array.isArray(tags) ? tags : [tags]
    let cleared = 0
    
    for (const [key, entry] of this.cache) {
      if (entry.tags.some(tag => tagsToMatch.includes(tag))) {
        this.delete(key)
        cleared++
      }
    }
    
    console.log(`💾 SmartCacheManager: Cleared ${cleared} entries by tags: ${tagsToMatch.join(', ')}`)
    return cleared
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    let cleared = 0
    const now = Date.now()
    
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.delete(key)
        cleared++
      }
    }
    
    this.metrics.lastCleanup = now
    console.log(`💾 SmartCacheManager: Cleared ${cleared} expired entries`)
    return cleared
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size
    this.cache.clear()
    this.accessTimes.clear()
    this.priorities.clear()
    this.sizes.clear()
    this.metrics.totalSize = 0
    
    console.log(`💾 SmartCacheManager: Cleared all ${size} entries`)
    return size
  }

  /**
   * Intelligent eviction based on priority, access patterns, and age
   */
  async evictLeastImportant(spaceNeeded = 0) {
    const candidates = []
    
    // Collect eviction candidates with scores
    for (const [key, entry] of this.cache) {
      const score = this.calculateEvictionScore(key, entry)
      candidates.push({ key, score, size: this.sizes.get(key) || 0 })
    }
    
    // Sort by eviction score (lower = more likely to evict)
    candidates.sort((a, b) => a.score - b.score)
    
    let freedSpace = 0
    let evicted = 0
    
    // Evict until we have enough space
    for (const candidate of candidates) {
      if (freedSpace >= spaceNeeded && this.cache.size < this.options.maxSize * 0.9) {
        break
      }
      
      this.delete(candidate.key)
      freedSpace += candidate.size
      evicted++
      this.metrics.evictions++
    }
    
    console.log(`💾 SmartCacheManager: Evicted ${evicted} entries, freed ${freedSpace} bytes`)
    return evicted
  }

  /**
   * Calculate eviction score (lower = more likely to evict)
   */
  calculateEvictionScore(key, entry) {
    const now = Date.now()
    const age = now - entry.timestamp
    const timeSinceAccess = now - (this.accessTimes.get(key) || entry.timestamp)
    
    // Base score components
    let score = 0
    
    // Priority weight (higher priority = higher score = less likely to evict)
    score += entry.priority * 25
    
    // Access frequency weight
    score += Math.min(entry.accessCount * 5, 50)
    
    // Recency weight (recently accessed = higher score)
    score += Math.max(0, 100 - (timeSinceAccess / 60000)) // Decay over minutes
    
    // Age penalty (older = lower score)
    score -= Math.min(age / 60000, 50) // Penalty grows over minutes
    
    // Size penalty (larger = lower score)
    const size = this.sizes.get(key) || 0
    score -= Math.min(size / 1000, 25) // Penalty for larger entries
    
    return Math.max(0, score)
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(entry) {
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Calculate approximate size of cache entry
   */
  calculateSize(entry) {
    try {
      const jsonString = JSON.stringify(entry)
      return jsonString.length * 2 // Rough estimate (2 bytes per character)
    } catch {
      return 1000 // Default size if calculation fails
    }
  }

  /**
   * Compress data (placeholder - would use actual compression library)
   */
  compressData(data) {
    // In a real implementation, this would use a compression library like lz-string
    // For now, just return the data as-is
    return data
  }

  /**
   * Decompress data (placeholder)
   */
  decompressData(data) {
    // In a real implementation, this would decompress the data
    return data
  }

  /**
   * Start periodic cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.clearExpired()
    }, this.options.cleanupInterval)
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      evictions: this.metrics.evictions,
      totalRequests: this.metrics.totalRequests,
      totalSize: this.metrics.totalSize,
      averageSize: this.cache.size > 0 ? Math.round(this.metrics.totalSize / this.cache.size) : 0,
      lastCleanup: this.metrics.lastCleanup,
      timeSinceCleanup: Date.now() - this.metrics.lastCleanup
    }
  }

  /**
   * Get cache entries by priority
   */
  getEntriesByPriority(priority) {
    const entries = []
    
    for (const [key, entry] of this.cache) {
      if (entry.priority === priority) {
        entries.push({
          key,
          data: entry.compressed ? this.decompressData(entry.data) : entry.data,
          metadata: {
            timestamp: entry.timestamp,
            ttl: entry.ttl,
            accessCount: entry.accessCount,
            tags: entry.tags
          }
        })
      }
    }
    
    return entries
  }

  /**
   * Optimize cache by rebalancing priorities
   */
  optimizeCache() {
    console.log('🔧 SmartCacheManager: Starting cache optimization')
    
    // Clear expired entries first
    const expiredCleared = this.clearExpired()
    
    // Rebalance priorities based on access patterns
    let rebalanced = 0
    for (const [key, entry] of this.cache) {
      const newPriority = this.calculateOptimalPriority(entry)
      if (newPriority !== entry.priority) {
        this.updatePriority(key, newPriority)
        rebalanced++
      }
    }
    
    console.log(`✅ SmartCacheManager: Optimization complete - cleared ${expiredCleared} expired, rebalanced ${rebalanced} priorities`)
    
    return {
      expiredCleared,
      rebalanced,
      finalSize: this.cache.size
    }
  }

  /**
   * Calculate optimal priority based on access patterns
   */
  calculateOptimalPriority(entry) {
    const { priorityLevels } = this.options
    
    // High access count = higher priority
    if (entry.accessCount > 10) return priorityLevels.HIGH
    if (entry.accessCount > 5) return priorityLevels.MEDIUM
    
    // Recent access = higher priority
    const age = Date.now() - entry.timestamp
    if (age < 300000) return priorityLevels.MEDIUM // 5 minutes
    
    return priorityLevels.LOW
  }

  /**
   * Export cache state for debugging
   */
  exportState() {
    const state = {
      entries: [],
      stats: this.getStats(),
      options: this.options
    }
    
    for (const [key, entry] of this.cache) {
      state.entries.push({
        key,
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        priority: entry.priority,
        accessCount: entry.accessCount,
        tags: entry.tags,
        size: this.sizes.get(key),
        age: Date.now() - entry.timestamp,
        expired: this.isExpired(entry)
      })
    }
    
    return state
  }
} 