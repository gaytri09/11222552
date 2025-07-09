class LoggingMiddleware {
  constructor() {
    this.apiEndpoint = "http://20.244.56.144/evaluation-service/logs"
    this.stack = "frontend"
    this.requestQueue = []
    this.isProcessing = false
    this.initializeLogging()
  }

  initializeLogging() {
    console.log("[LOGGING MIDDLEWARE] Initialized for URL Shortener Assessment")
    this.Log("frontend", "info", "middleware", "Logging middleware initialized successfully")
  }

  async Log(stack, level, packageName, message) {
    if (!this.validateLogParameters(stack, level, packageName, message)) {
      console.error("[LOGGING MIDDLEWARE] Invalid log parameters")
      return false
    }

    const logEntry = {
      stack: stack.toLowerCase(),
      level: level.toLowerCase(),
      package: packageName.toLowerCase(),
      message: message,
    }

    this.logToConsole(logEntry)

    try {
      const success = await this.sendToAPI(logEntry)
      if (success) {
        console.log(`[LOGGING MIDDLEWARE] Log sent successfully: ${message}`)
      }
      return success
    } catch (error) {
      console.error("[LOGGING MIDDLEWARE] Failed to send log:", error.message)
      return false
    }
  }

  validateLogParameters(stack, level, packageName, message) {
    const validStacks = ["frontend", "backend"]
    if (!validStacks.includes(stack.toLowerCase())) {
      console.error(`[LOGGING MIDDLEWARE] Invalid stack: ${stack}. Must be 'frontend' or 'backend'`)
      return false
    }
    const validLevels = ["debug", "info", "warn", "error", "fatal"]
    if (!validLevels.includes(level.toLowerCase())) {
      console.error(`[LOGGING MIDDLEWARE] Invalid level: ${level}. Must be one of: ${validLevels.join(", ")}`)
      return false
    }

    const frontendPackages = ["component", "hook", "page", "state", "style"]
    const sharedPackages = ["auth", "config", "middleware", "utils"]
    const validPackages = [...frontendPackages, ...sharedPackages]

    if (stack.toLowerCase() === "frontend" && !validPackages.includes(packageName.toLowerCase())) {
      console.error(
        `[LOGGING MIDDLEWARE] Invalid package for frontend: ${packageName}. Must be one of: ${validPackages.join(", ")}`,
      )
      return false
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      console.error("[LOGGING MIDDLEWARE] Message is required and must be a non-empty string")
      return false
    }

    return true
  }

  async sendToAPI(logEntry) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logEntry),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`[LOGGING MIDDLEWARE] API Response:`, result)
        return true
      } else {
        console.error(`[LOGGING MIDDLEWARE] API Error: ${response.status} - ${response.statusText}`)
        return false
      }
    } catch (error) {
      console.error("[LOGGING MIDDLEWARE] Network error:", error.message)
      return false
    }
  }

  logToConsole(logEntry) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.package}] ${logEntry.message}`

    switch (logEntry.level) {
      case "debug":
        console.debug(logMessage)
        break
      case "info":
        console.info(logMessage)
        break
      case "warn":
        console.warn(logMessage)
        break
      case "error":
      case "fatal":
        console.error(logMessage)
        break
      default:
        console.log(logMessage)
    }
  }

  debug(packageName, message) {
    return this.Log("frontend", "debug", packageName, message)
  }

  info(packageName, message) {
    return this.Log("frontend", "info", packageName, message)
  }

  warn(packageName, message) {
    return this.Log("frontend", "warn", packageName, message)
  }

  error(packageName, message) {
    return this.Log("frontend", "error", packageName, message)
  }

  fatal(packageName, message) {
    return this.Log("frontend", "fatal", packageName, message)
  }
  logComponentAction(componentName, action, details = "") {
    const message = `${componentName}: ${action}${details ? " - " + details : ""}`
    return this.info("component", message)
  }

  logPageNavigation(pageName, action = "visited") {
    const message = `Page ${action}: ${pageName}`
    return this.info("page", message)
  }

  logStateChange(stateName, oldValue, newValue) {
    const message = `State change in ${stateName}: ${oldValue} -> ${newValue}`
    return this.info("state", message)
  }

  logHookUsage(hookName, action, context = "") {
    const message = `Hook ${hookName} ${action}${context ? " - " + context : ""}`
    return this.debug("hook", message)
  }

  logUtilityFunction(functionName, action, result = "") {
    const message = `Utility ${functionName} ${action}${result ? " - " + result : ""}`
    return this.debug("utils", message)
  }

  logError(packageName, errorMessage, errorContext = "") {
    const message = `Error: ${errorMessage}${errorContext ? " - Context: " + errorContext : ""}`
    return this.error(packageName, message)
  }

  logCriticalError(packageName, errorMessage, errorContext = "") {
    const message = `Critical Error: ${errorMessage}${errorContext ? " - Context: " + errorContext : ""}`
    return this.fatal(packageName, message)
  }
}
const logger = new LoggingMiddleware()

export const Log = (stack, level, packageName, message) => {
  return logger.Log(stack, level, packageName, message)
}
export const logDebug = (packageName, message) => logger.debug(packageName, message)
export const logInfo = (packageName, message) => logger.info(packageName, message)
export const logWarning = (packageName, message) => logger.warn(packageName, message)
export const logError = (packageName, message) => logger.error(packageName, message)
export const logFatal = (packageName, message) => logger.fatal(packageName, message)

export const logComponentAction = (componentName, action, details) =>
  logger.logComponentAction(componentName, action, details)

export const logPageNavigation = (pageName, action) => logger.logPageNavigation(pageName, action)

export const logStateChange = (stateName, oldValue, newValue) => logger.logStateChange(stateName, oldValue, newValue)

export const logHookUsage = (hookName, action, context) => logger.logHookUsage(hookName, action, context)

export const logUtilityFunction = (functionName, action, result) =>
  logger.logUtilityFunction(functionName, action, result)

export const logErrorWithContext = (packageName, errorMessage, errorContext) =>
  logger.logError(packageName, errorMessage, errorContext)

export const logCriticalError = (packageName, errorMessage, errorContext) =>
  logger.logCriticalError(packageName, errorMessage, errorContext)

export default logger
