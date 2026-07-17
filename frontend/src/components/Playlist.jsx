import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { timeAgo } from '../helpers/timeAgo.js'
import { formatDuration } from '../helpers/formatDuration.js'

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

const DEFAULT_CHANNEL = {
  _id: '',
  avatar: '',
  fullName: '',
  username: '',
}

function Playlist() {
  const authUserData = useSelector((state) => state.auth.userData)
  const { list } = useParams()

  const [playlist, setPlaylist] = useState(null)
  const [channel, setChannel] = useState(DEFAULT_CHANNEL)
  const [videos, setVideos] = useState([])
  const [ownersById, setOwnersById] = useState({})
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const decodedList = list ? decodeURIComponent(list) : ''
  const isLikedRoute = decodedList === 'LL'

  const totalViews = useMemo(
    () => videos.reduce((sum, video) => sum + (Number(video?.views) || 0), 0),
    [videos]
  )

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

    const fetchPlaylistData = async () => {
      setIsLoadingPlaylist(true)
      setErrorMessage('')

      try {
        if (!decodedList) {
          if (isMounted) {
            setPlaylist(null)
            setChannel(DEFAULT_CHANNEL)
            setVideos([])
            setOwnersById({})
            setSubscriberCount(0)
          }
          return
        }

        if (isLikedRoute) {
          let currentUser = authUserData

          if (!currentUser?._id) {
            const currentUserResponse = await axios.get(
              '/api/v1/users/current-user',
              requestConfig
            )
            currentUser = getResponseData(currentUserResponse)
          }

          if (!currentUser?._id) {
            if (isMounted) {
              setPlaylist(null)
              setChannel(DEFAULT_CHANNEL)
              setVideos([])
              setOwnersById({})
              setSubscriberCount(0)
            }
            return
          }

          const likedVideosResponse = await axios.get(
            '/api/v1/likes/videos',
            requestConfig
          )
          const likedVideosData = getResponseData(likedVideosResponse)
          const likedVideos = Array.isArray(likedVideosData) ? likedVideosData : []

          const ownerIds = likedVideos.map((video) => video?.owner)
          const ownerMap = await fetchOwnersById(ownerIds)

          const subscriberCountResponse = await axios.get(
            `/api/v1/subscriptions/count/${encodeURIComponent(currentUser._id)}`,
            requestConfig
          )
          const resolvedSubscriberCount = Number(getResponseData(subscriberCountResponse)) || 0

          if (isMounted) {
            setPlaylist({
              _id: 'LL',
              name: 'Liked videos',
              description: '',
              createdAt: null,
              owner: currentUser._id,
            })
            setChannel({
              ...DEFAULT_CHANNEL,
              _id: currentUser._id || '',
              avatar: currentUser.avatar || '',
              fullName: currentUser.fullName || '',
              username: currentUser.username || '',
            })
            setVideos(likedVideos)
            setOwnersById(ownerMap)
            setSubscriberCount(resolvedSubscriberCount)
          }

          return
        }

        const playlistResponse = await axios.get(
          `/api/v1/playlist/${encodeURIComponent(decodedList)}`,
          requestConfig
        )
        const playlistData = getResponseData(playlistResponse) || {}

        const playlistVideoIds = Array.isArray(playlistData.videos)
          ? playlistData.videos
          : []

        const videoResponses = await Promise.all(
          playlistVideoIds.map(async (videoId) => {
            try {
              const videoResponse = await axios.get(
                `/api/v1/videos/${encodeURIComponent(videoId)}`,
                requestConfig
              )
              return getResponseData(videoResponse)
            } catch (error) {
              return null
            }
          })
        )

        const playlistVideos = videoResponses.filter(Boolean)

        let channelData = DEFAULT_CHANNEL

        if (playlistData?.owner) {
          try {
            const channelResponse = await axios.get(
              `/api/v1/users/${encodeURIComponent(playlistData.owner)}`,
              requestConfig
            )
            channelData = {
              ...DEFAULT_CHANNEL,
              ...(getResponseData(channelResponse) || {}),
            }
          } catch (error) {
            channelData = DEFAULT_CHANNEL
          }
        }

        const ownerIds = [
          playlistData?.owner,
          ...playlistVideos.map((video) => video?.owner),
        ]
        const ownerMap = await fetchOwnersById(ownerIds)

        let resolvedSubscriberCount = 0
        if (channelData?._id) {
          const subscriberCountResponse = await axios.get(
            `/api/v1/subscriptions/count/${encodeURIComponent(channelData._id)}`,
            requestConfig
          )
          resolvedSubscriberCount = Number(getResponseData(subscriberCountResponse)) || 0
        }

        if (isMounted) {
          setPlaylist(playlistData)
          setChannel(channelData)
          setVideos(playlistVideos)
          setOwnersById(ownerMap)
          setSubscriberCount(resolvedSubscriberCount)
        }
      } catch (error) {
        if (error?.code === 'ERR_CANCELED') {
          return
        }

        if (isMounted) {
          setPlaylist(null)
          setChannel(DEFAULT_CHANNEL)
          setVideos([])
          setOwnersById({})
          setSubscriberCount(0)
          setErrorMessage('Failed to load playlist details.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlaylist(false)
        }
      }
    }

    fetchPlaylistData()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [
    decodedList,
    isLikedRoute,
    authUserData?._id,
    authUserData?.username,
    authUserData?.avatar,
    authUserData?.fullName,
  ])

  const headerTitle = isLikedRoute ? 'Liked videos' : (playlist?.name || '')
  const headerDescription = isLikedRoute ? '' : (playlist?.description || '')
  const createdAtText = !isLikedRoute && playlist?.createdAt
    ? timeAgo(playlist.createdAt)
    : ''

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          {
            isLoadingPlaylist
            ? <h1>Loading...</h1>
            : null
          }
          {
            errorMessage
            ? <p className="px-4 pb-2 text-sm text-red-400">{errorMessage}</p>
            : null
          }
          <div className="flex flex-wrap gap-x-4 gap-y-10 p-4 xl:flex-nowrap">
            <div className="w-full shrink-0 sm:max-w-md xl:max-w-sm">
              <div className="relative mb-2 w-full pt-[56%]">
                <div className="absolute inset-0">
                  {
                    videos[0]?.thumbnail
                    ? (
                      <img
                        src={videos[0].thumbnail}
                        alt={headerTitle || 'Playlist cover'}
                        className="h-full w-full" />
                    )
                    : null
                  }
                  <div className="absolute inset-x-0 bottom-0">
                    <div className="relative border-t bg-white/30 p-4 text-white backdrop-blur-sm before:absolute before:inset-0 before:bg-black/40">
                      <div className="relative z-1">
                        <p className="flex justify-between">
                          <span className="inline-block">Playlist</span>
                          <span className="inline-block">{videos.length} videos</span>
                        </p>
                        <p className="text-sm text-gray-200">{totalViews} Views · {createdAtText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h6 className="mb-1 font-semibold">{headerTitle}</h6>
              <p className="flex text-sm text-gray-200">{headerDescription}</p>
              <div className="mt-6 flex items-center gap-x-3">
                <div className="h-16 w-16 shrink-0">
                  <img
                    src={channel.avatar}
                    alt={channel.fullName}
                    className="h-full w-full rounded-full" />
                </div>
                <div className="w-full">
                  <h6 className="font-semibold">{channel.fullName}</h6>
                  <p className="text-sm text-gray-300">{subscriberCount} Subscribers</p>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col gap-y-4">
              {
                videos.map((video) => {
                  const ownerProfile = ownersById[video.owner] || channel

                  return (
                  <div key={video._id || video.videoFile || video.title} className="border">
                    <div className="w-full max-w-3xl gap-x-4 sm:flex">
                      <div className="relative mb-2 w-full sm:mb-0 sm:w-5/12">
                        <div className="w-full pt-[56%]">
                          <div className="absolute inset-0">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="h-full w-full" />
                          </div>
                          <span className="absolute bottom-1 right-1 inline-block rounded bg-black px-1.5 text-sm">{formatDuration(video.duration)}</span>
                        </div>
                      </div>
                      <div className="flex gap-x-2 px-2 sm:w-7/12 sm:px-0">
                        <div className="h-10 w-10 shrink-0 sm:hidden">
                          <img
                            src={ownerProfile?.avatar || ''}
                            alt={ownerProfile?.username || ''}
                            className="h-full w-full rounded-full" />
                        </div>
                        <div className="w-full">
                          <h6 className="mb-1 font-semibold sm:max-w-[75%]">{video.title}</h6>
                          <p className="flex text-sm text-gray-200 sm:mt-3">{video.views} Views · {timeAgo(video.createdAt)}</p>
                          <div className="flex items-center gap-x-4">
                            <div className="mt-2 hidden h-10 w-10 shrink-0 sm:block">
                              <img
                                src={ownerProfile?.avatar || ''}
                                alt={ownerProfile?.username || ''}
                                className="h-full w-full rounded-full" />
                            </div>
                              <p className="text-sm text-gray-200">{ownerProfile?.fullName || ''}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )})
              }
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Playlist