import { logInfo, logError, logWarning, logUtilityFunction, logCriticalError } from "./logger"

export function validateURL(url) {
  logUtilityFunction("validateURL", "called", `Validating URL: ${url}`)

  try {
    new URL(url)
    logUtilityFunction("validateURL", "success", "URL validation passed")
    return true
  } catch {
    logWarning("utils", `URL validation failed for: ${url}`)
    return false
  }
}

export function validateShortCode(shortCode) {
  logUtilityFunction("validateShortCode", "called", `Validating shortcode: ${shortCode}`)

  if (!shortCode) {
    logUtilityFunction("validateShortCode", "success", "Empty shortcode is valid (optional field)")
    return true
  }

  const regex = /^[a-zA-Z0-9]{3,20}$/
  const isValid = regex.test(shortCode)

  if (isValid) {
    logUtilityFunction("validateShortCode", "success", "Shortcode validation passed")
  } else {
    logWarning("utils", `Shortcode validation failed for: ${shortCode}`)
  }

  return isValid
}

export function generateShortCode(existingCodes = []) {
  logUtilityFunction("generateShortCode", "started", `Avoiding ${existingCodes.length} existing codes`)

  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  let attempts = 0
  const maxAttempts = 100

  do {
    result = ""
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    attempts++

    if (attempts > maxAttempts) {
      logCriticalError("utils", "Failed to generate unique short code after maximum attempts", `Attempts: ${attempts}`)
      throw new Error("Unable to generate unique short code")
    }
  } while (existingCodes.includes(result))

  logUtilityFunction("generateShortCode", "success", `Generated: ${result} in ${attempts} attempts`)
  return result
}

export function createShortenedURL(originalUrl, customShortCode, validityMinutes, existingUrls) {
  logUtilityFunction("createShortenedURL", "started", `Creating URL for: ${originalUrl}`)

  if (!validateURL(originalUrl)) {
    const error = "Invalid URL format"
    logError("utils", `URL creation failed: ${error} for ${originalUrl}`)
    throw new Error(error)
  }

  if (customShortCode && !validateShortCode(customShortCode)) {
    const error = "Invalid short code format. Use 3-20 alphanumeric characters."
    logError("utils", `URL creation failed: ${error} for shortcode: ${customShortCode}`)
    throw new Error(error)
  }
  const existingCodes = existingUrls.map((url) => url.shortCode)

  if (customShortCode && existingCodes.includes(customShortCode)) {
    const error = "Short code already exists. Please choose a different one."
    logWarning("utils", `URL creation failed: ${error} for shortcode: ${customShortCode}`)
    throw new Error(error)
  }
  const shortCode = customShortCode || generateShortCode(existingCodes)
  const validity = validityMinutes || 30
  const createdAt = new Date()

  const shortenedURL = {
    id: Date.now() + Math.random(),
    originalUrl,
    shortCode,
    shortUrl: `${window.location.origin}/s/${shortCode}`,
    validityMinutes: validity,
    createdAt,
    expiryDate: new Date(createdAt.getTime() + validity * 60 * 1000),
    isActive: true,
  }

  logInfo("utils", `Successfully created shortened URL: ${shortCode} for ${originalUrl}`)
  return shortenedURL
}

export function isURLExpired(createdAt, validityMinutes) {
  const now = new Date()
  const expiryTime = new Date(createdAt.getTime() + validityMinutes * 60 * 1000)
  const expired = now > expiryTime

  if (expired) {
    logInfo("utils", `URL expired check: URL has expired (created: ${createdAt}, validity: ${validityMinutes}min)`)
  }

  return expired
}
