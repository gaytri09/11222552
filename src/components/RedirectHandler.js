"use client"

import { useEffect, useState } from "react"
import { useParams, Navigate } from "react-router-dom"
import { Box, Typography, CircularProgress, Alert, Button } from "@mui/material"
import { useURL } from "../context/URLContext"
import { isURLExpired } from "../utils/urlUtils"
import { logInfo, logError, logWarning } from "../utils/logger"

export default function RedirectHandler() {
  const { shortCode } = useParams()
  const { urls, statistics, dispatch } = useURL()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        logInfo("Redirect attempt", { shortCode })

        const url = urls.find((u) => u.shortCode === shortCode)

        if (!url) {
          setError("Short URL not found")
          logWarning("Short URL not found", { shortCode })
          setLoading(false)
          return
        }

        if (isURLExpired(new Date(url.createdAt), url.validityMinutes)) {
          setError("This short URL has expired")
          logWarning("Attempted to access expired URL", { shortCode, expiryDate: url.expiryDate })
          setLoading(false)
          return
        }

        const clickData = {
          timestamp: new Date().toISOString(),
          source: document.referrer || "Direct",
          location: await getLocationInfo(),
          userAgent: navigator.userAgent,
          ip: "Unknown", 
        }

        const currentStats = statistics[shortCode] || { clicks: [] }
        const updatedStats = {
          ...currentStats,
          clicks: [...currentStats.clicks, clickData],
        }

        dispatch({
          type: "UPDATE_STATISTICS",
          payload: {
            shortCode,
            stats: updatedStats,
          },
        })

        logInfo("Click recorded and redirecting", {
          shortCode,
          originalUrl: url.originalUrl,
          clickData,
        })

        setRedirecting(true)

        setTimeout(() => {
          window.location.href = url.originalUrl
        }, 1000)
      } catch (error) {
        logError("Error during redirect", { shortCode, error: error.message })
        setError("An error occurred while processing the redirect")
        setLoading(false)
      }
    }

    if (urls.length > 0) {
      handleRedirect()
    } else {
      setTimeout(() => {
        if (urls.length === 0) {
          setError("Short URL not found")
          setLoading(false)
        }
      }, 1000)
    }
  }, [shortCode, urls, statistics, dispatch])

  const getLocationInfo = async () => {
    try {
      return "Unknown Location"
    } catch (error) {
      logError("Failed to get location info", error)
      return "Unknown Location"
    }
  }

  if (loading && !redirecting) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="h6">Processing redirect...</Typography>
      </Box>
    )
  }

  if (redirecting) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="h6">Redirecting you now...</Typography>
        <Typography variant="body2" color="text.secondary">
          If you are not redirected automatically, please check if pop-ups are blocked.
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            {error}
          </Typography>
          <Typography variant="body2">
            The short URL "{shortCode}" {error.includes("expired") ? "has expired" : "could not be found"}.
          </Typography>
        </Alert>

        <Button variant="contained" onClick={() => (window.location.href = "/shortener")}>
          Create New Short URL
        </Button>
      </Box>
    )
  }

  return <Navigate to="/shortener" replace />
}
