import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api.js'

const LoadingContext = createContext({
  isLoading: false,
  setIsLoading: () => {}
})

export function LoadingProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0)

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      setLoadingCount(c => c + 1)
      return config
    })

    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        setLoadingCount(c => Math.max(0, c - 1))
        return response
      },
      (error) => {
        setLoadingCount(c => Math.max(0, c - 1))
        return Promise.reject(error)
      }
    )

    return () => {
      api.interceptors.request.eject(requestInterceptor)
      api.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  return (
    <LoadingContext.Provider value={{ isLoading: loadingCount > 0 }}>
      {children}
    </LoadingContext.Provider>
  )
}

export const useLoading = () => useContext(LoadingContext)
