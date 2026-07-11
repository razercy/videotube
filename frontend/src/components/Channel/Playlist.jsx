import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { timeAgo } from '../../helpers/timeAgo';

const DEFAULT_PLAYLIST_THUMBNAIL = "https://static.thenounproject.com/png/375319-200.png";

function Playlist() {
  const authUserData = useSelector((state) => state.auth.userData)
  const navigate = useNavigate()
  const location = useLocation()
  const [playlists, setPlaylists] = useState([])
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true)

  const pathSegments = useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const isOwnChannelRoute = pathSegments[0] === "channel"

  useEffect(() => {
    let isMounted = true

    const fetchPlaylists = async () => {
      setIsLoadingPlaylists(true)
      try {
        let channelId = null

        if (isOwnChannelRoute) {
          if (authUserData?._id) {
            channelId = authUserData._id
          } else {
            const currentUserResponse = await axios.get("/api/v1/users/current-user")
            channelId = currentUserResponse?.data?.data?._id || null
          }
        } else {
          channelId = pathSegments[0] ? decodeURIComponent(pathSegments[0]) : null
        }

        if (!channelId) {
          if (isMounted) {
            setPlaylists([])
          }
          return
        }

        const channelPlaylistsResponse = await axios.get(
          `/api/v1/playlist/user/${encodeURIComponent(channelId)}`
        )

        const channelPlaylists = channelPlaylistsResponse?.data?.data
        const basePlaylists = Array.isArray(channelPlaylists) ? channelPlaylists : []

        const enrichedPlaylists = await Promise.all(
          basePlaylists.map(async (playlist) => {
            const videoIds = Array.isArray(playlist.videos) ? playlist.videos : []

            if (!videoIds.length) {
              return {
                ...playlist,
                thumbnail: DEFAULT_PLAYLIST_THUMBNAIL,
                views: 0,
              }
            }

            const videoResponses = await Promise.all(
              videoIds.map((videoId) => axios.get(`/api/v1/videos/${encodeURIComponent(videoId)}`))
            )

            const videoDetails = videoResponses
              .map((response) => response?.data?.data)
              .filter(Boolean)

            const thumbnail = videoDetails[0]?.thumbnail || DEFAULT_PLAYLIST_THUMBNAIL
            const views = videoDetails.reduce(
              (sum, video) => sum + (Number(video?.views) || 0),
              0
            )

            return {
              ...playlist,
              thumbnail,
              views,
            }
          })
        )

        if (isMounted) {
          setPlaylists(enrichedPlaylists)
        }
      } catch (error) {
        if (isMounted) {
          setPlaylists([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlaylists(false)
        }
      }
    }

    fetchPlaylists()

    return () => {
      isMounted = false
    }
  }, [authUserData?._id, isOwnChannelRoute, pathSegments])

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          <div className="px-4 pb-4">
            {
              isLoadingPlaylists ? (
                <h1>Loading...</h1>
              ) : playlists.length > 0 ? (
                <div className="grid gap-4 pt-2 sm:grid-cols-[repeat(auto-fit,minmax(400px,1fr))]">
                  {
                    playlists.map((playlist) => (
                      <div
                      key={playlist._id || playlist.name}
                      onClick={() => navigate(`/playlist/${encodeURIComponent(playlist._id)}`)}
                      className="w-full">
                        <div className="relative mb-2 w-full pt-[56%]">
                          <div className="absolute inset-0">
                            <img
                              src={playlist.thumbnail}
                              alt={playlist.name}
                              className="h-full w-full" />
                            <div className="absolute inset-x-0 bottom-0">
                              <div className="relative border-t bg-white/30 p-4 text-white backdrop-blur-sm before:absolute before:inset-0 before:bg-black/40">
                                <div className="relative z-1">
                                  <p className="flex justify-between">
                                    <span className="inline-block">Playlist</span>
                                    <span className="inline-block">{playlist.videos.length} videos</span>
                                  </p>
                                  <p className="text-sm text-gray-200">{playlist.views} Views · {timeAgo(playlist.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <h6 className="mb-1 font-semibold">{playlist.name}</h6>
                        <p className="flex text-sm text-gray-200">{playlist.description}</p>
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
                        <span className="inline-block w-6">
                          <svg
                            style={{ width: "100%" }}
                            viewBox="0 0 22 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M12 5L10.8845 2.76892C10.5634 2.1268 10.4029 1.80573 10.1634 1.57116C9.95158 1.36373 9.69632 1.20597 9.41607 1.10931C9.09916 1 8.74021 1 8.02229 1H4.2C3.0799 1 2.51984 1 2.09202 1.21799C1.71569 1.40973 1.40973 1.71569 1.21799 2.09202C1 2.51984 1 3.0799 1 4.2V5M1 5H16.2C17.8802 5 18.7202 5 19.362 5.32698C19.9265 5.6146 20.3854 6.07354 20.673 6.63803C21 7.27976 21 8.11984 21 9.8V14.2C21 15.8802 21 16.7202 20.673 17.362C20.3854 17.9265 19.9265 18.3854 19.362 18.673C18.7202 19 17.8802 19 16.2 19H5.8C4.11984 19 3.27976 19 2.63803 18.673C2.07354 18.3854 1.6146 17.9265 1.32698 17.362C1 16.7202 1 15.8802 1 14.2V5Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"></path>
                          </svg>
                        </span>
                      </span>
                    </p>
                    <h5 className="mb-2 font-semibold">No playlist created</h5>
                    <p>There are no playlists created on this channel.</p>
                  </div>
                </div>
              )
            }
          </div>
        </section>
      </div>
    </div>
  )
}

export default Playlist