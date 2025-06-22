import { PipelineStage, ProcessingResult, ProcessingStatus, Venue } from '../types/index.js'

/**
 * Main recommendation pipeline orchestrator
 * Manages the entire process from Reddit data to final recommendations
 */
export class RecommendationPipeline {
  constructor(options = {}) {
    this.options = {
      qualityThreshold: options.qualityThreshold || 40,
      maxRecommendations: options.maxRecommendations || 50,
      enableParallelProcessing: options.enableParallelProcessing || true,
      timeoutMs: options.timeoutMs || 30000,
      retryAttempts: options.retryAttempts || 2,
      ...options
    }
    
    this.stages = []
    this.metrics = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageProcessingTime: 0,
      stageMetrics: new Map()
    }
    
    this.fallbackHandlers = new Map()
    this.qualityCheckers = []
  }

  /**
   * Add a processing stage to the pipeline
   */
  addStage(stage) {
    if (!(stage instanceof PipelineStage)) {
      throw new Error('Stage must be an instance of PipelineStage')
    }
    
    this.stages.push(stage)
    this.metrics.stageMetrics.set(stage.name, {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageProcessingTime: 0
    })
    
    console.log(`📋 Pipeline: Added stage "${stage.name}"`)
    return this
  }

  /**
   * Add a fallback handler for a specific stage
   */
  addFallbackHandler(stageName, handler) {
    this.fallbackHandlers.set(stageName, handler)
    console.log(`🔄 Pipeline: Added fallback handler for "${stageName}"`)
    return this
  }

  /**
   * Add a quality checker function
   */
  addQualityChecker(checker) {
    this.qualityCheckers.push(checker)
    return this
  }

  /**
   * Execute the entire pipeline
   */
  async execute(input) {
    const startTime = Date.now()
    console.log(`🚀 Pipeline: Starting execution with ${this.stages.length} stages`)
    
    try {
      this.metrics.totalRuns++
      
      let currentData = input
      const stageResults = []
      
      // Execute each stage in sequence
      for (const stage of this.stages) {
        const stageResult = await this.executeStage(stage, currentData)
        stageResults.push(stageResult)
        
        if (stageResult.isFailed()) {
          console.warn(`⚠️ Pipeline: Stage "${stage.name}" failed, checking for fallback...`)
          
          // Try fallback handler
          const fallbackResult = await this.executeFallback(stage.name, currentData)
          if (fallbackResult) {
            console.log(`✅ Pipeline: Fallback successful for "${stage.name}"`)
            currentData = fallbackResult
            continue
          }
          
          // If no fallback or fallback failed, stop pipeline
          throw new Error(`Pipeline failed at stage "${stage.name}": ${stageResult.errors.join(', ')}`)
        }
        
        currentData = stageResult.data
      }
      
      // Run quality checks on final output
      const qualityResults = await this.runQualityChecks(currentData)
      
      // Filter results based on quality threshold
      const filteredResults = this.filterByQuality(currentData)
      
      const totalTime = Date.now() - startTime
      this.updateMetrics(true, totalTime)
      
      console.log(`✅ Pipeline: Execution completed successfully in ${totalTime}ms`)
      console.log(`📊 Pipeline: Generated ${filteredResults.length} high-quality recommendations`)
      
      return {
        success: true,
        data: filteredResults,
        metadata: {
          processingTime: totalTime,
          stageResults,
          qualityResults,
          originalCount: Array.isArray(currentData) ? currentData.length : 0,
          filteredCount: filteredResults.length,
          pipeline: this.getPipelineInfo()
        }
      }
      
    } catch (error) {
      const totalTime = Date.now() - startTime
      this.updateMetrics(false, totalTime)
      
      console.error(`❌ Pipeline: Execution failed after ${totalTime}ms:`, error)
      
      return {
        success: false,
        error: error.message,
        metadata: {
          processingTime: totalTime,
          failedAt: error.stage || 'unknown',
          pipeline: this.getPipelineInfo()
        }
      }
    }
  }

  /**
   * Execute a single stage with timeout and retry logic
   */
  async executeStage(stage, input) {
    const stageMetrics = this.metrics.stageMetrics.get(stage.name)
    stageMetrics.totalRuns++
    
    let lastError = null
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Pipeline: Executing stage "${stage.name}" (attempt ${attempt}/${this.options.retryAttempts})`)
        
        const result = await Promise.race([
          stage.process(input),
          this.createTimeoutPromise(this.options.timeoutMs, stage.name)
        ])
        
        if (result.isSuccess()) {
          stageMetrics.successfulRuns++
          return result
        } else {
          lastError = new Error(`Stage failed: ${result.errors.join(', ')}`)
        }
        
      } catch (error) {
        lastError = error
        console.warn(`⚠️ Pipeline: Stage "${stage.name}" attempt ${attempt} failed:`, error.message)
        
        if (attempt < this.options.retryAttempts) {
          await this.delay(1000 * attempt) // Exponential backoff
        }
      }
    }
    
    stageMetrics.failedRuns++
    const result = new ProcessingResult(ProcessingStatus.FAILED)
    result.setError(lastError.message)
    return result
  }

  /**
   * Execute fallback handler for a failed stage
   */
  async executeFallback(stageName, input) {
    const fallbackHandler = this.fallbackHandlers.get(stageName)
    if (!fallbackHandler) {
      return null
    }
    
    try {
      console.log(`🔄 Pipeline: Executing fallback for "${stageName}"`)
      return await fallbackHandler(input)
    } catch (error) {
      console.error(`❌ Pipeline: Fallback failed for "${stageName}":`, error)
      return null
    }
  }

  /**
   * Run quality checks on the final output
   */
  async runQualityChecks(data) {
    const results = []
    
    for (const checker of this.qualityCheckers) {
      try {
        const result = await checker(data)
        results.push(result)
      } catch (error) {
        console.warn(`⚠️ Pipeline: Quality check failed:`, error)
        results.push({ passed: false, error: error.message })
      }
    }
    
    return results
  }

  /**
   * Filter results based on quality threshold
   */
  filterByQuality(data) {
    if (!Array.isArray(data)) {
      return data
    }
    
    const filtered = data.filter(item => {
      if (item instanceof Venue) {
        return item.confidenceScore >= this.options.qualityThreshold
      }
      
      if (item.venue instanceof Venue) {
        return item.venue.confidenceScore >= this.options.qualityThreshold
      }
      
      if (typeof item.confidenceScore === 'number') {
        return item.confidenceScore >= this.options.qualityThreshold
      }
      
      return true // Keep items without quality scores
    })
    
    console.log(`🎯 Pipeline: Filtered ${data.length} items to ${filtered.length} high-quality items`)
    return filtered.slice(0, this.options.maxRecommendations)
  }

  /**
   * Create a timeout promise
   */
  createTimeoutPromise(timeoutMs, stageName) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Stage "${stageName}" timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  }

  /**
   * Delay utility for retry logic
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Update pipeline metrics
   */
  updateMetrics(success, processingTime) {
    if (success) {
      this.metrics.successfulRuns++
    } else {
      this.metrics.failedRuns++
    }
    
    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalRuns - 1) + processingTime
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalRuns
  }

  /**
   * Get pipeline information for debugging
   */
  getPipelineInfo() {
    return {
      stageCount: this.stages.length,
      stageNames: this.stages.map(s => s.name),
      options: this.options,
      metrics: this.getMetrics()
    }
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    const stageMetrics = {}
    this.metrics.stageMetrics.forEach((metrics, stageName) => {
      stageMetrics[stageName] = {
        ...metrics,
        successRate: metrics.totalRuns > 0 ? (metrics.successfulRuns / metrics.totalRuns) * 100 : 0
      }
    })
    
    return {
      overall: {
        totalRuns: this.metrics.totalRuns,
        successfulRuns: this.metrics.successfulRuns,
        failedRuns: this.metrics.failedRuns,
        successRate: this.metrics.totalRuns > 0 ? (this.metrics.successfulRuns / this.metrics.totalRuns) * 100 : 0,
        averageProcessingTime: this.metrics.averageProcessingTime
      },
      stages: stageMetrics
    }
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageProcessingTime: 0,
      stageMetrics: new Map()
    }
    
    this.stages.forEach(stage => {
      this.metrics.stageMetrics.set(stage.name, {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageProcessingTime: 0
      })
      
      // Reset stage metrics too
      stage.metrics = {
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0,
        averageProcessingTime: 0
      }
    })
    
    console.log('📊 Pipeline: Metrics reset')
  }
}

/**
 * Pipeline builder utility for easier configuration
 */
export class PipelineBuilder {
  constructor() {
    this.pipeline = new RecommendationPipeline()
  }

  withOptions(options) {
    this.pipeline.options = { ...this.pipeline.options, ...options }
    return this
  }

  addStage(stage) {
    this.pipeline.addStage(stage)
    return this
  }

  addFallback(stageName, handler) {
    this.pipeline.addFallbackHandler(stageName, handler)
    return this
  }

  addQualityCheck(checker) {
    this.pipeline.addQualityChecker(checker)
    return this
  }

  build() {
    return this.pipeline
  }
}

export default RecommendationPipeline 