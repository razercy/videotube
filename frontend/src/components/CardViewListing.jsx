import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { formatDuration } from '../helpers/formatDuration'
import { timeAgo } from '../helpers/timeAgo'

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

function CardViewListing() {
  const authStatus = useSelector((state) => state.auth.status)
  const authUserData = useSelector((state) => state.auth.userData)
  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const requestConfig = {
      ...AUTH_REQUEST_CONFIG,
      signal: controller.signal,
    }
    let isMounted = true

    const getResponseData = (response) => response?.data?.data ?? response?.data ?? null

    const fetchHistory = async () => {
      setIsLoading(true)
      setErrorMessage('')

      if (!authStatus) {
        if (isMounted) {
          setVideos([])
          setIsLoading(false)
        }
        return
      }

      try {
        const videosResponse = await axios.get('/api/v1/users/history', requestConfig)
        const resolvedVideos = getResponseData(videosResponse)

        if (isMounted) {
          setVideos(Array.isArray(resolvedVideos) ? resolvedVideos : [])
        }
      } catch (error) {
        if (error?.code === 'ERR_CANCELED') {
          return
        }

        if (isMounted) {
          setVideos([])
          setErrorMessage('Failed to load videos.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchHistory()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [authStatus, authUserData?._id])

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          {
            isLoading
            ? <h1>Loading...</h1>
            : null
          }
          {
            errorMessage
            ? <p className="px-4 pb-2 text-sm text-red-400">{errorMessage}</p>
            : null
          }
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 p-4">
            {
              videos.map((video) => (
                <div key={video._id || video.videoFile || video.title} className="w-full">
                  <div className="relative mb-2 w-full pt-[56%]">
                    <div className="absolute inset-0">
                      <img
                        src={video?.thumbnail || ''}
                        alt={video?.title || ''}
                        className="h-full w-full" />
                    </div>
                    <span className="absolute bottom-1 right-1 inline-block rounded bg-black px-1.5 text-sm">{formatDuration(video?.duration || 0)}</span>
                  </div>
                  <div className="flex gap-x-2">
                    <div className="h-10 w-10 shrink-0">
                      <img
                        src={video?.owner?.avatar || ''}
                        alt={video?.owner?.username || ''}
                        className="h-full w-full rounded-full" />
                    </div>
                    <div className="w-full">
                      <h6 className="mb-1 font-semibold">{video?.title || ''}</h6>
                      <p className="flex text-sm text-gray-200">{video?.views || 0} Views · {video?.createdAt ? timeAgo(video.createdAt) : ''}</p>
                      <p className="text-sm text-gray-200">{video?.owner?.fullName || ''}</p>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </section>
      </div>
    </div>
  )
}

export default CardViewListing