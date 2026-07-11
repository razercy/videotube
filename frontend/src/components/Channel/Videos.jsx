import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux';
import { formatDuration } from '../../helpers/formatDuration.js';
import { timeAgo } from '../../helpers/timeAgo';
import { useLocation, useNavigate } from 'react-router-dom';
import UploadVideo from '../index.js';

function Videos() {
  const authUserData = useSelector((state) => state.auth.userData)
  const navigate = useNavigate()
  const location = useLocation()
  const [uploadVideoModalPopup, setUploadVideoModalPopup] = useState(false)
  const [videos, setVideos] = useState([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)

  const pathSegments = useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const isOwnChannelRoute = pathSegments[0] === "channel"

  useEffect(() => {
    let isMounted = true

    const fetchVideos = async () => {
      setIsLoadingVideos(true)
      try {
        let channelId = null

        if (isOwnChannelRoute) {
          const currentUserResponse = await axios.get("/api/v1/users/current-user")
          channelId = currentUserResponse?.data?.data?._id || null
        } else {
          channelId = pathSegments[0] ? decodeURIComponent(pathSegments[0]) : null
        }

        if (!channelId) {
          if (isMounted) {
            setVideos([])
          }
          return
        }

        const channelVideosResponse = await axios.get(
          `/api/v1/videos/user/${encodeURIComponent(channelId)}`
        )

        const fetchedVideos = channelVideosResponse?.data?.data

        if (isMounted) {
          setVideos(Array.isArray(fetchedVideos) ? fetchedVideos : [])
        }
      } catch (error) {
        if (isMounted) {
          setVideos([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingVideos(false)
        }
      }
    }

    fetchVideos()

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
              isLoadingVideos ? (
                <h1>Loading...</h1>
              ) : (
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
                      isOwnChannelRoute
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
              )
            }
          </div>
          {
            uploadVideoModalPopup && <UploadVideo />
          }
        </section>
      </div>
    </div>
  )
}

export default Videos