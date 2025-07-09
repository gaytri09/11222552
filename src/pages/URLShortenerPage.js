import { useState } from "react"
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material"
import { ContentCopy, Delete, Link as LinkIcon } from "@mui/icons-material"
import { useURL } from "../context/URLContext"
import { createShortenedURL, isURLExpired } from "../utils/urlUtils"
import { logInfo, logError } from "../utils/logger"

function URLForm({ onSubmit, disabled }) {
  const [formData, setFormData] = useState({
    originalUrl: "",
    customShortCode: "",
    validityMinutes: "",
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const newErrors = {}

    if (!formData.originalUrl.trim()) {
      newErrors.originalUrl = "URL is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      originalUrl: formData.originalUrl.trim(),
      customShortCode: formData.customShortCode.trim() || null,
      validityMinutes: formData.validityMinutes ? Number.parseInt(formData.validityMinutes, 10) : null,
    })

    setFormData({
      originalUrl: "",
      customShortCode: "",
      validityMinutes: "",
    })
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Shorten a New URL
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Original URL"
              value={formData.originalUrl}
              onChange={handleChange("originalUrl")}
              error={!!errors.originalUrl}
              helperText={errors.originalUrl}
              placeholder="https://example.com/very-long-url"
              disabled={disabled}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Custom Short Code (Optional)"
              value={formData.customShortCode}
              onChange={handleChange("customShortCode")}
              error={!!errors.customShortCode}
              helperText={errors.customShortCode || "3-20 alphanumeric characters"}
              placeholder="mycode123"
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Validity (Minutes)"
              value={formData.validityMinutes}
              onChange={handleChange("validityMinutes")}
              error={!!errors.validityMinutes}
              helperText={errors.validityMinutes || "Default: 30 minutes"}
              placeholder="30"
              disabled={disabled}
              inputProps={{ min: 1, max: 10080 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" size="large" disabled={disabled} startIcon={<LinkIcon />}>
              Shorten URL
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

function URLResultCard({ url, onDelete }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url.shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      logInfo("Short URL copied to clipboard", { shortCode: url.shortCode })
    } catch (error) {
      logError("Failed to copy URL to clipboard", error)
    }
  }

  const isExpired = isURLExpired(new Date(url.createdAt), url.validityMinutes)

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Original URL
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: "break-all", mb: 2 }}>
              {url.originalUrl}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Short URL
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  wordBreak: "break-all",
                  color: isExpired ? "text.disabled" : "primary.main",
                  textDecoration: isExpired ? "line-through" : "none",
                }}
              >
                {url.shortUrl}
              </Typography>
              <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                <IconButton size="small" onClick={handleCopy} disabled={isExpired}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <IconButton onClick={() => onDelete(url.id)} color="error" size="small">
            <Delete />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip label={isExpired ? "Expired" : "Active"} color={isExpired ? "error" : "success"} size="small" />
          <Chip label={`Expires: ${new Date(url.expiryDate).toLocaleString()}`} variant="outlined" size="small" />
          <Chip label={`Code: ${url.shortCode}`} variant="outlined" size="small" />
        </Box>
      </CardContent>
    </Card>
  )
}

export default function URLShortenerPage() {
  const { urls, loading, error, dispatch } = useURL()
  const [localError, setLocalError] = useState("")

  const handleCreateURL = async (formData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      setLocalError("")

      const activeUrls = urls.filter((url) => !isURLExpired(new Date(url.createdAt), url.validityMinutes))

      if (activeUrls.length >= 5) {
        throw new Error(
          "Maximum of 5 concurrent active URLs allowed. Please wait for some to expire or delete existing ones.",
        )
      }

      const newURL = createShortenedURL(formData.originalUrl, formData.customShortCode, formData.validityMinutes, urls)

      dispatch({ type: "ADD_URL", payload: newURL })
      logInfo("URL successfully shortened", { shortCode: newURL.shortCode })
    } catch (error) {
      const errorMessage = error.message || "Failed to create shortened URL"
      setLocalError(errorMessage)
      logError("Failed to create shortened URL", { error: errorMessage, formData })
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const handleDeleteURL = (urlId) => {
    const updatedUrls = urls.filter((url) => url.id !== urlId)
    dispatch({ type: "LOAD_DATA", payload: { urls: updatedUrls, statistics: {} } })
    logInfo("URL deleted", { urlId })
  }

  const activeUrls = urls.filter((url) => !isURLExpired(new Date(url.createdAt), url.validityMinutes))

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        URL Shortener
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Create shortened URLs with custom codes and validity periods. You can have up to 5 active URLs concurrently.
      </Typography>

      {(error || localError) && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => {
            setLocalError("")
            dispatch({ type: "CLEAR_ERROR" })
          }}
        >
          {error || localError}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Active URLs: {activeUrls.length}/5
      </Alert>

      <URLForm onSubmit={handleCreateURL} disabled={loading || activeUrls.length >= 5} />

      {urls.length > 0 && (
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Shortened URLs
          </Typography>

          {urls.map((url) => (
            <URLResultCard key={url.id} url={url} onDelete={handleDeleteURL} />
          ))}
        </Paper>
      )}
    </Box>
  )
}
