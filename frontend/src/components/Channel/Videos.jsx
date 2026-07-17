import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { formatDuration } from '../../helpers/formatDuration.js'
import { timeAgo } from '../../helpers/timeAgo.js'
import { useLocation, useNavigate } from 'react-router-dom'
import { UploadVideo } from '../index.js'

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

const safeDecodeURIComponent = (value) => {
  if (!value) {
    return ''
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function Videos() {
  const navigate = useNavigate()
  const location = useLocation()
  const [uploadVideoModalPopup, setUploadVideoModalPopup] = useState(false)
  const [videos, setVideos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const pathSegment = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    return parts[0] || ''
  }, [location.pathname])

  const isOwnChannel = pathSegment === 'channel'
  const decodedChannelId = useMemo(
    () => (isOwnChannel ? '' : safeDecodeURIComponent(pathSegment)),
    [isOwnChannel, pathSegment]
  )

  useEffect(() => {
    const controller = new AbortController()
    const requestConfig = {
      ...AUTH_REQUEST_CONFIG,
      signal: controller.signal,
    }
    let isMounted = true

    const getResponseData = (response) => response?.data?.data ?? response?.data ?? null

    const fetchChannelVideos = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        let resolvedChannelId = decodedChannelId

        if (isOwnChannel) {
          const channelResponse = await axios.get('/api/v1/users/current-user', requestConfig)
          const channelData = getResponseData(channelResponse)
          resolvedChannelId = channelData?._id || ''
        }

        if (!resolvedChannelId) {
          if (isMounted) {
            setVideos([])
          }
          return
        }

        const channelVideosResponse = await axios.get(
          `/api/v1/videos/user/${encodeURIComponent(resolvedChannelId)}`,
          requestConfig
        )
        const channelVideos = getResponseData(channelVideosResponse)

        if (isMounted) {
          setVideos(Array.isArray(channelVideos) ? channelVideos : [])
        }
      } catch (error) {
        if (error?.code === 'ERR_CANCELED') {
          return
        }

        if (isMounted) {
          setVideos([])
          setErrorMessage('Failed to load channel videos.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchChannelVideos()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [decodedChannelId, isOwnChannel])

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          <div className="px-4 pb-4">
            {
              isLoading
              ? <h1>Loading...</h1>
              : null
            }
            {
              errorMessage
              ? <p className="pb-2 text-sm text-red-400">{errorMessage}</p>
              : null
            }
            {
              videos.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 pt-2">
                  {
                    videos.map((video) => (
                      <div
                      key={video._id}
                      onClick={() => navigate(`/watch/${encodeURIComponent(video._id)}`)}
                      className="w-full">
                        <div className="relative mb-2 w-full pt-[56%]">
                          <div className="absolute inset-0">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="h-full w-full" />
                          </div>
                          <span className="absolute bottom-1 right-1 inline-block rounded bg-black px-1.5 text-sm">{formatDuration(video.duration)}</span>
                        </div>
                        <h6 className="mb-1 font-semibold">{video.title}</h6>
                        <p className="flex text-sm text-gray-200">{video.views} Views · {timeAgo(video.createdAt)}</p>
                      </div>
                    ))
                  }
                </div>
              )
              : (
                <div className="flex justify-center p-4">
                  <div className="w-full max-w-sm text-center">
                    <p className="mb-3 w-full">
                      <span className="inline-flex rounded-full bg-[#E4D3FF] p-2 text-[#AE7AFF]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          aria-hidden="true"
                          className="w-6">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"></path>
                        </svg>
                      </span>
                    </p>
                    <h5 className="mb-2 font-semibold">No videos uploaded</h5>
                    <p>This page is yet to upload a video. Search another page in order to find more videos.</p>
                    {
                      isOwnChannel
                      && (
                        <button
                        onClick={() => setUploadVideoModalPopup(true)}
                        className="mt-4 inline-flex items-center gap-x-2 bg-[#ae7aff] px-3 py-2 font-semibold text-black">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            aria-hidden="true"
                            className="h-5 w-5">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"></path>
                          </svg>
                          New video
                        </button>
                      )
                    }
                  </div>
                </div>
              )
            }
          </div>
          {
            uploadVideoModalPopup && <UploadVideo videos={videos} setVideos={setVideos} />
          }
        </section>
      </div>
    </div>
  )
}

export default Videos