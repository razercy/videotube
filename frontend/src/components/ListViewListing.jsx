import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatDuration } from '../helpers/formatDuration.js'
import { timeAgo } from '../helpers/timeAgo.js'

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

const DEFAULT_OWNER = {
  avatar: '',
  username: '',
  fullName: '',
}

const safeDecodeURIComponent = (value) => {
  if (!value) {
    return ''
  }

  try {
    return decodeURIComponent(value)
  } catch (error) {
    return value
  }
}

function ListViewListing() {
  const { search_query } = useParams()
  const [videos, setVideos] = useState([])
  const [ownersById, setOwnersById] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const decodedSearchQuery = safeDecodeURIComponent(search_query)

  useEffect(() => {
    const controller = new AbortController()
    const requestConfig = {
      ...AUTH_REQUEST_CONFIG,
      signal: controller.signal,
    }
    let isMounted = true

    const getResponseData = (response) => response?.data?.data ?? response?.data ?? null

    const fetchOwnersById = async (ownerIds) => {
      const ids = [...new Set(ownerIds.filter(Boolean))]

      if (ids.length === 0) {
        return {}
      }

      const ownerResponses = await Promise.all(
        ids.map(async (ownerId) => {
          try {
            const ownerResponse = await axios.get(
              `/api/v1/users/${encodeURIComponent(ownerId)}`,
              requestConfig
            )
            return [ownerId, getResponseData(ownerResponse)]
          } catch (error) {
            return [ownerId, null]
          }
        })
      )

      return ownerResponses.reduce((acc, [ownerId, ownerData]) => {
        if (ownerData) {
          acc[ownerId] = ownerData
        }
        return acc
      }, {})
    }

    const fetchVideos = async () => {
      setIsLoading(true)
      setErrorMessage('')

      if (!decodedSearchQuery) {
        if (isMounted) {
          setVideos([])
          setOwnersById({})
          setIsLoading(false)
        }
        return
      }

      try {
        const videosResponse = await axios.get('/api/v1/videos', {
          ...requestConfig,
          params: {
            page: 1,
            limit: 10,
            query: decodedSearchQuery,
            sortBy: '$natural',
            sortType: 1,
          },
        })

        const resolvedVideos = getResponseData(videosResponse)
        const fetchedVideos = Array.isArray(resolvedVideos) ? resolvedVideos : []
        const ownerMap = await fetchOwnersById(fetchedVideos.map((video) => video?.owner))

        if (isMounted) {
          setVideos(fetchedVideos)
          setOwnersById(ownerMap)
        }
      } catch (error) {
        if (error?.code === 'ERR_CANCELED') {
          return
        }

        if (isMounted) {
          setVideos([])
          setOwnersById({})
          setErrorMessage('Failed to load videos.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchVideos()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [decodedSearchQuery])

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
          <div className="flex flex-col gap-4 p-4">
            {
              videos.map((video) => {
                const ownerProfile = ownersById[video.owner] || DEFAULT_OWNER

                return (
                <div key={video._id || video.videoFile || video.title} className="w-full max-w-3xl gap-x-4 md:flex">
                  <div className="relative mb-2 w-full md:mb-0 md:w-5/12">
                    <div className="w-full pt-[56%]">
                      <div className="absolute inset-0">
                        <img
                          src={video?.thumbnail || ''}
                          alt={video?.title || ''}
                          className="h-full w-full" />
                      </div>
                      <span className="absolute bottom-1 right-1 inline-block rounded bg-black px-1.5 text-sm">{formatDuration(video?.duration || 0)}</span>
                    </div>
                  </div>
                  <div className="flex gap-x-2 md:w-7/12">
                    <div className="h-10 w-10 shrink-0 md:hidden">
                      <img
                        src={ownerProfile?.avatar || ''}
                        alt={ownerProfile?.username || ''}
                        className="h-full w-full rounded-full" />
                    </div>
                    <div className="w-full">
                      <h6 className="mb-1 font-semibold md:max-w-[75%]">{video?.title || ''}</h6>
                      <p className="flex text-sm text-gray-200 sm:mt-3">{video?.views || 0} Views · {video?.createdAt ? timeAgo(video.createdAt) : ''}</p>
                      <div className="flex items-center gap-x-4">
                        <div className="mt-2 hidden h-10 w-10 shrink-0 md:block">
                          <img
                            src={ownerProfile?.avatar || ''}
                            alt={ownerProfile?.username || ''}
                            className="h-full w-full rounded-full" />
                        </div>
                        <p className="text-sm text-gray-200">{ownerProfile?.fullName || ''}</p>
                      </div>
                      <p className="mt-2 hidden text-sm md:block">{video?.description || ''}</p>
                    </div>
                  </div>
                </div>
              )})
            }
          </div>
        </section>
      </div>
    </div>
  )
}

export default ListViewListing