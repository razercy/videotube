import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import { UploadVideo } from './index.js'

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

const getResponseData = (response) => response?.data?.data ?? response?.data ?? null

const formatDate = (dateValue) => {
  const dateObj = new Date(dateValue)

  if (Number.isNaN(dateObj.getTime())) {
    return ''
  }

  const day = String(dateObj.getDate()).padStart(2, '0')
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const year = dateObj.getFullYear()
  return `${day}/${month}/${year}`
}

function Dashboard() {
  const [uploadVideoModalPopup, setUploadVideoModalPopup] = useState(false)
  const [user, setUser] = useState(null)
  const [userStats, setUserStats] = useState({})
  const [videos, setVideos] = useState([])
  const [likesByVideoId, setLikesByVideoId] = useState({})
  const [publishStatus, setPublishStatus] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteVideoModalPopup, setDeleteVideoModalPopup] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [editVideoModalPopup, setEditVideoModalPopup] = useState(false)
  const [editId, setEditId] = useState(null)
  const [thumbnail, setThumbnail] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const isMountedRef = useRef(true)

  useEffect(() => {
    const controller = new AbortController()
    const requestConfig = {
      ...AUTH_REQUEST_CONFIG,
      signal: controller.signal,
    }

    const fetchDashboardData = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [userResponse, userStatsResponse, userVideosResponse] = await Promise.all([
          axios.get('/api/v1/users/current-user', requestConfig),
          axios.get('/api/v1/dashboard/stats', requestConfig),
          axios.get('/api/v1/dashboard/videos', requestConfig),
        ])

        const resolvedUser = getResponseData(userResponse)
        const resolvedUserStats = getResponseData(userStatsResponse) || {}
        const resolvedVideos = getResponseData(userVideosResponse)
        const fetchedVideos = Array.isArray(resolvedVideos) ? resolvedVideos : []

        const initialPublishStatus = fetchedVideos.reduce((acc, video) => {
          acc[`${video._id}`] = !!video?.isPublished
          return acc
        }, {})

        const likeCountResponses = await Promise.all(
          fetchedVideos.map(async (video) => {
            try {
              const likeCountResponse = await axios.get(
                `/api/v1/likes/count/u/v/${encodeURIComponent(video._id)}`,
                requestConfig
              )
              return [video._id, Number(getResponseData(likeCountResponse)) || 0]
            } catch {
              return [video._id, 0]
            }
          })
        )

        const resolvedLikeCounts = likeCountResponses.reduce((acc, [videoId, count]) => {
          acc[videoId] = count
          return acc
        }, {})

        if (!isMountedRef.current) {
          return
        }

        setUser(resolvedUser)
        setUserStats(resolvedUserStats)
        setVideos(fetchedVideos)
        setPublishStatus(initialPublishStatus)
        setLikesByVideoId(resolvedLikeCounts)
      } catch (error) {
        if (error?.code === 'ERR_CANCELED') {
          return
        }

        if (!isMountedRef.current) {
          return
        }

        setUser(null)
        setUserStats({})
        setVideos([])
        setPublishStatus({})
        setLikesByVideoId({})
        setErrorMessage('Failed to load dashboard data.')
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      isMountedRef.current = false
      controller.abort()
    }
  }, [])

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-y-6 px-4 py-8">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="block">
              <h1 className="text-2xl font-bold">Welcome Back, {user?.fullName || ''}</h1>
              <p className="text-sm text-gray-300">Seamless Video Management, Elevated Results.</p>
            </div>
            <div className="block">
              <button
              onClick={() => setUploadVideoModalPopup(true)}
              className="inline-flex items-center gap-x-2 bg-[#ae7aff] px-3 py-2 font-semibold text-black">
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
                Upload video
              </button>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
            <div className="border p-4">
              <div className="mb-4 block">
                <span className="inline-block h-7 w-7 rounded-full bg-[#E4D3FF] p-1 text-[#ae7aff]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </span>
              </div>
              <h6 className="text-gray-300">Total views</h6>
              <p className="text-3xl font-semibold">{userStats?.videoViewCount ?? 0}</p>
            </div>
            <div className="border p-4">
              <div className="mb-4 block">
                <span className="inline-block h-7 w-7 rounded-full bg-[#E4D3FF] p-1 text-[#ae7aff]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                  </svg>
                </span>
              </div>
              <h6 className="text-gray-300">Total subscribers</h6>
              <p className="text-3xl font-semibold">{userStats?.subscriberCount ?? 0}</p>
            </div>
            <div className="border p-4">
              <div className="mb-4 block">
                <span className="inline-block h-7 w-7 rounded-full bg-[#E4D3FF] p-1 text-[#ae7aff]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
                  </svg>
                </span>
              </div>
              <h6 className="text-gray-300">Total likes</h6>
              <p className="text-3xl font-semibold">{userStats?.likeCount ?? 0}</p>
            </div>
          </div>
          <div className="w-full overflow-auto">
            {
              isLoading
              ? <h1>Loading...</h1>
              : null
            }
            {
              errorMessage
              ? <p className="pb-3 text-sm text-red-400">{errorMessage}</p>
              : null
            }
            <table className="w-full min-w-300 border-collapse border text-white">
              <thead>
                <tr>
                  <th className="border-collapse border-b p-4">Status</th>
                  <th className="border-collapse border-b p-4">Status</th>
                  <th className="border-collapse border-b p-4">Uploaded</th>
                  <th className="border-collapse border-b p-4">Rating</th>
                  <th className="border-collapse border-b p-4">Date uploaded</th>
                  <th className="border-collapse border-b p-4"></th>
                </tr>
              </thead>
              <tbody>
                {
                  videos.map((video) => (
                    <tr className="group border">
                      <td className="border-collapse border-b border-gray-600 px-4 py-3 group-last:border-none">
                        <div className="flex justify-center">
                          <label
                            htmlFor={video._id}
                            className="relative inline-block w-12 cursor-pointer overflow-hidden">
                            <input
                              type="checkbox"
                              id={video._id}
                              onChange={async() => {
                                await axios.patch(
                                  `/api/v1/videos/toggle/publish/${encodeURIComponent(video._id)}`,
                                  {},
                                  AUTH_REQUEST_CONFIG
                                )
                                setPublishStatus(prev => ({
                                  ...prev,
                                  [`${video._id}`]: !prev[`${video._id}`]
                                }))
                              }}
                              className="peer sr-only"
                              checked={!!publishStatus[`${video._id}`]} />
                            <span
                              className="inline-block h-6 w-full rounded-2xl bg-gray-200 duration-200 after:absolute after:bottom-1 after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-black after:duration-200 peer-checked:bg-[#ae7aff] peer-checked:after:left-7"></span>
                          </label>
                        </div>
                      </td>
                      <td className="border-collapse border-b border-gray-600 px-4 py-3 group-last:border-none">
                        <div className="flex justify-center"><span className={`inline-block rounded-2xl border px-1.5 py-0.5 ${publishStatus[`${video._id}`] ? "border-green-600 text-green-600" : "border-orange-600 text-orange-600"}`}>{ publishStatus[`${video._id}`] ? "Published" : "Unpublished" }</span></div>
                      </td>
                      <td className="border-collapse border-b border-gray-600 px-4 py-3 group-last:border-none">
                        <div className="flex items-center gap-4">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={video.thumbnail}
                            alt={video.title || 'Video thumbnail'} />
                          <h3 className="font-semibold">{video.title}</h3>
                        </div>
                      </td>
                      <td className="border-collapse border-b border-gray-600 px-4 py-3 group-last:border-none">
                        <div className="flex justify-center gap-4">
                          <span className="inline-block rounded-xl bg-green-200 px-1.5 py-0.5 text-green-700">{likesByVideoId[video._id] ?? 0} likes</span>
                          {/* <span className="inline-block rounded-xl bg-red-200 px-1.5 py-0.5 text-red-700">49 dislikes</span> */}
                        </div>
                      </td>
                      <td className="border-collapse border-b border-gray-600 px-4 py-3 group-last:border-none">{formatDate(video.createdAt)}</td>
                      <td className="border-collapse border-b border-gray-600 px-4 py-3 group-last:border-none">
                        <div className="flex gap-4">
                          <button
                          onClick={() => {
                            setDeleteId(video._id)
                            setDeleteVideoModalPopup(true)
                          }}
                          className="h-5 w-5 hover:text-[#ae7aff]">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              aria-hidden="true">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"></path>
                            </svg>
                          </button>
                          <button
                          onClick={() => {
                            setEditId(video._id)
                            setThumbnail(video.thumbnail)
                            setThumbnailFile(null)
                            setTitle(video.title)
                            setDescription(video.description)
                            setEditVideoModalPopup(true)
                          }}
                          className="h-5 w-5 hover:text-[#ae7aff]">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              aria-hidden="true">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
        {
          uploadVideoModalPopup
          && (
            <section className="relative w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
              <UploadVideo videos={videos} setVideos={setVideos} />
            </section>
          )
        }
        {
          deleteVideoModalPopup
          && (
            <div className="fixed inset-0 top-[calc(66px)] z-10 flex flex-col bg-black/50 px-4 pb-21.5 pt-4 sm:top-[calc(82px)] sm:px-14 sm:py-8">
              <div className="mx-auto w-full max-w-lg overflow-auto rounded-lg border border-gray-700 bg-[#121212] p-4">
                <div className="mb-6 flex items-start gap-4">
                  <span className="inline-block h-8 w-8 shrink-0 rounded-full bg-red-200 p-1 text-red-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"></path>
                    </svg>
                  </span>
                  <h2 className="text-xl font-semibold">
                    Delete Video
                    <span className="block text-sm text-gray-300">Are you sure you want to delete this video? Once it's deleted, you will not be able to recover it.</span>
                  </h2>
                  <button
                  onClick={() => {
                    setDeleteId(null)
                    setDeleteVideoModalPopup(false)
                  }}
                  className="ml-auto h-6 w-6 shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                  onClick={() => {
                    setDeleteId(null)
                    setDeleteVideoModalPopup(false)
                  }}
                  className="col-span-2 border px-4 py-3 sm:col-span-1">Cancel</button>
                  <button
                  onClick={async() => {
                    await axios.delete(
                      `/api/v1/videos/${encodeURIComponent(deleteId)}`,
                      AUTH_REQUEST_CONFIG
                    )
                    setVideos(prevVideos => prevVideos.filter(video => (video._id !== deleteId)))
                    setPublishStatus(prevPublishStatus => {
                      const { [`${deleteId}`]: _, ...remainingStatuses } = prevPublishStatus;
                      return remainingStatuses;
                    })
                    setDeleteId(null)
                    setDeleteVideoModalPopup(false)
                  }}
                  className="col-span-2 bg-red-700 px-4 py-3 disabled:bg-[#E4D3FF] sm:col-span-1">Delete</button>
                </div>
              </div>
            </div>
          )
        }
        {
          editVideoModalPopup
          && (
            <div className="fixed inset-0 top-[calc(66px)] z-10 flex flex-col bg-black/50 px-4 pb-21.5 pt-4 sm:top-[calc(82px)] sm:px-14 sm:py-8">
              <div className="mx-auto w-full max-w-lg overflow-auto rounded-lg border border-gray-700 bg-[#121212] p-4">
                <div className="mb-4 flex items-start justify-between">
                  <h2 className="text-xl font-semibold">
                    Edit Video
                    <span className="block text-sm text-gray-300">Share where you&#x27;ve worked on your profile.</span>
                  </h2>
                  <button
                  onClick={() => {
                    setEditId(null)
                    setThumbnail("")
                    setThumbnailFile(null)
                    setTitle("")
                    setDescription("")
                    setEditVideoModalPopup(false)
                  }}
                  className="h-6 w-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <label
                  htmlFor="thumbnail"
                  className="mb-1 inline-block">
                  Thumbnail
                  <sup>*</sup>
                </label>
                <label
                  className="relative mb-4 block cursor-pointer border border-dashed p-2 after:absolute after:inset-0 after:bg-transparent hover:after:bg-black/10"
                  htmlFor="thumbnail">
                  <input
                    type="file"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null
                      setThumbnailFile(selectedFile)

                      if (selectedFile) {
                        setThumbnail(URL.createObjectURL(selectedFile))
                      }
                    }}
                    className="sr-only"
                    id="thumbnail" />
                  <img
                    src={thumbnail}
                    alt={title} />
                </label>
                <div className="mb-6 flex flex-col gap-y-4">
                  <div className="w-full">
                    <label
                      htmlFor="title"
                      className="mb-1 inline-block">
                      Title
                      <sup>*</sup>
                    </label>
                    <input
                      id="title"
                      type="text"
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border bg-transparent px-2 py-1 outline-none"
                      value={title} />
                  </div>
                  <div className="w-full">
                    <label
                      htmlFor="desc"
                      className="mb-1 inline-block">
                      Description
                      <sup>*</sup>
                    </label>
                    <textarea
                      id="desc"
                      onChange={(e) => setDescription(e.target.value)}
                      className="h-40 w-full resize-none border bg-transparent px-2 py-1 outline-none">
        {description}</textarea>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                  onClick={() => {
                    setEditId(null)
                    setThumbnail("")
                    setThumbnailFile(null)
                    setTitle("")
                    setDescription("")
                    setEditVideoModalPopup(false)
                  }}
                  className="border px-4 py-3">Cancel</button>
                  <button
                  onClick={async() => {
                    let updatedVideo = null

                    if (thumbnailFile) {
                      const formData = new FormData()
                      formData.append('thumbnail', thumbnailFile)

                      const updateResponse = await axios.patch(
                        `/api/v1/videos/${encodeURIComponent(editId)}`,
                        formData,
                        {
                          ...AUTH_REQUEST_CONFIG,
                          headers: {
                            'Content-Type': 'multipart/form-data',
                          },
                        }
                      )

                      updatedVideo = getResponseData(updateResponse)
                    }

                    setVideos(prevVideos => prevVideos.map(video => ((video._id === editId) ? {
                      ...video,
                      thumbnail: updatedVideo?.thumbnail || thumbnail,
                      title,
                      description
                    } : video)))
                    setEditId(null)
                    setThumbnail("")
                    setThumbnailFile(null)
                    setTitle("")
                    setDescription("")
                    setEditVideoModalPopup(false)
                  }}
                  className="bg-[#ae7aff] px-4 py-3 text-black disabled:bg-[#E4D3FF]">Update</button>
                </div>
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default Dashboard
