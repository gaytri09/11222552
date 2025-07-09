"use client"

import { useState, useEffect } from "react"
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material"
import { ExpandMore, Timeline, Link as LinkIcon, Analytics } from "@mui/icons-material"
import { useURL } from "../context/URLContext"
import { isURLExpired } from "../utils/urlUtils"
import { logInfo } from "../utils/logger"

function StatisticsCard({ title, value, icon, color = "primary" }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
          <Box>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function ClickDetailsTable({ clicks }) {
  if (!clicks || clicks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No clicks recorded yet
      </Typography>
    )
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>Source</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>User Agent</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clicks.map((click, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(click.timestamp).toLocaleString()}</TableCell>
              <TableCell>{click.source || "Direct"}</TableCell>
              <TableCell>{click.location || "Unknown"}</TableCell>
              <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                {click.userAgent ? click.userAgent.substring(0, 50) + "..." : "Unknown"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function URLStatisticsAccordion({ url, stats }) {
  const isExpired = isURLExpired(new Date(url.createdAt), url.validityMinutes)
  const clickCount = stats?.clicks?.length || 0

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {url.shortCode}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
              {url.originalUrl}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Chip label={`${clickCount} clicks`} size="small" color="primary" variant="outlined" />
            <Chip label={isExpired ? "Expired" : "Active"} size="small" color={isExpired ? "error" : "success"} />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              URL Details
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Short URL: <strong>{url.shortUrl}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: <strong>{new Date(url.createdAt).toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expires: <strong>{new Date(url.expiryDate).toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Validity: <strong>{url.validityMinutes} minutes</strong>
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Click Statistics
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Clicks: <strong>{clickCount}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                First Click:{" "}
                <strong>
                  {stats?.clicks?.length > 0 ? new Date(stats.clicks[0].timestamp).toLocaleString() : "No clicks yet"}
                </strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last Click:{" "}
                <strong>
                  {stats?.clicks?.length > 0
                    ? new Date(stats.clicks[stats.clicks.length - 1].timestamp).toLocaleString()
                    : "No clicks yet"}
                </strong>
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Detailed Click Data
            </Typography>
            <ClickDetailsTable clicks={stats?.clicks || []} />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}

export default function StatisticsPage() {
  const { urls, statistics } = useURL()
  const [summary, setSummary] = useState({
    totalUrls: 0,
    activeUrls: 0,
    expiredUrls: 0,
    totalClicks: 0,
  })

  useEffect(() => {
    logInfo("Statistics page loaded", { urlCount: urls.length })

    const now = new Date()
    let totalClicks = 0
    let activeCount = 0
    let expiredCount = 0

    urls.forEach((url) => {
      const isExpired = isURLExpired(new Date(url.createdAt), url.validityMinutes)
      if (isExpired) {
        expiredCount++
      } else {
        activeCount++
      }

      const urlStats = statistics[url.shortCode]
      if (urlStats?.clicks) {
        totalClicks += urlStats.clicks.length
      }
    })

    setSummary({
      totalUrls: urls.length,
      activeUrls: activeCount,
      expiredUrls: expiredCount,
      totalClicks,
    })
  }, [urls, statistics])

  if (urls.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Statistics
        </Typography>
        <Alert severity="info">
          No URLs have been created yet. Go to the Shortener page to create your first shortened URL.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        URL Statistics
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Detailed analytics and click tracking for all your shortened URLs.
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard title="Total URLs" value={summary.totalUrls} icon={<LinkIcon />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard title="Active URLs" value={summary.activeUrls} icon={<Timeline />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard title="Expired URLs" value={summary.expiredUrls} icon={<Timeline />} color="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard title="Total Clicks" value={summary.totalClicks} icon={<Analytics />} color="info" />
        </Grid>
      </Grid>

      {/* Detailed Statistics */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Detailed URL Statistics
        </Typography>

        <Box sx={{ mt: 2 }}>
          {urls.map((url) => (
            <URLStatisticsAccordion key={url.id} url={url} stats={statistics[url.shortCode]} />
          ))}
        </Box>
      </Paper>
    </Box>
  )
}
