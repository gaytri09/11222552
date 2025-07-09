"use client"

import { createContext, useContext, useReducer, useEffect } from "react"
import { logInfo, logStateChange, logHookUsage, logErrorWithContext, logCriticalError } from "../utils/logger"

const URLContext = createContext()

const initialState = {
  urls: [],
  statistics: {},
  loading: false,
  error: null,
}

function urlReducer(state, action) {
  logStateChange("URLContext", `${action.type}_BEFORE`, JSON.stringify(state))

  let newState
  switch (action.type) {
    case "SET_LOADING":
      newState = { ...state, loading: action.payload }
      break
    case "SET_ERROR":
      newState = { ...state, error: action.payload, loading: false }
      break
    case "ADD_URL":
      newState = {
        ...state,
        urls: [...state.urls, action.payload],
        loading: false,
        error: null,
      }
      break
    case "UPDATE_STATISTICS":
      newState = {
        ...state,
        statistics: {
          ...state.statistics,
          [action.payload.shortCode]: action.payload.stats,
        },
      }
      break
    case "LOAD_DATA":
      newState = {
        ...state,
        urls: action.payload.urls || [],
        statistics: action.payload.statistics || {},
      }
      break
    case "CLEAR_ERROR":
      newState = { ...state, error: null }
      break
    default:
      newState = state
  }

  logStateChange("URLContext", `${action.type}_AFTER`, JSON.stringify(newState))
  return newState
}

export function URLProvider({ children }) {
  logHookUsage("URLProvider", "initialized", "Context provider setup")

  const [state, dispatch] = useReducer(urlReducer, initialState)

  useEffect(() => {
    logHookUsage("URLProvider", "useEffect", "Loading data from localStorage")

    try {
      const savedUrls = localStorage.getItem("urlShortener_urls")
      const savedStats = localStorage.getItem("urlShortener_statistics")

      if (savedUrls || savedStats) {
        dispatch({
          type: "LOAD_DATA",
          payload: {
            urls: savedUrls ? JSON.parse(savedUrls) : [],
            statistics: savedStats ? JSON.parse(savedStats) : {},
          },
        })
        logInfo("state", "Data loaded from localStorage successfully")
      }
    } catch (error) {
      logErrorWithContext("state", "Failed to load data from localStorage", error.message)
    }
  }, [])

  useEffect(() => {
    logHookUsage("URLProvider", "useEffect", "Saving data to localStorage")

    try {
      localStorage.setItem("urlShortener_urls", JSON.stringify(state.urls))
      localStorage.setItem("urlShortener_statistics", JSON.stringify(state.statistics))
      logInfo("state", "Data saved to localStorage successfully")
    } catch (error) {
      logErrorWithContext("state", "Failed to save data to localStorage", error.message)
    }
  }, [state.urls, state.statistics])

  const value = {
    ...state,
    dispatch,
  }

  return <URLContext.Provider value={value}>{children}</URLContext.Provider>
}

export function useURL() {
  logHookUsage("useURL", "called", "Custom hook accessed")

  const context = useContext(URLContext)
  if (!context) {
    logCriticalError("hook", "useURL must be used within a URLProvider", "Context not found")
    throw new Error("useURL must be used within a URLProvider")
  }
  return context
}
