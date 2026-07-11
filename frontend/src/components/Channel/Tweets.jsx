import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { timeAgo } from '../../helpers/timeAgo'

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

const DEFAULT_CHANNEL_PROFILE = {
  avatar: "https://images.pexels.com/photos/1115816/pexels-photo-1115816.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  fullName: "React Patterns",
  username: "reactpatterns",
}

function Tweets() {
  const authStatus = useSelector((state) => state.auth.status)
  const authUserData = useSelector((state) => state.auth.userData)
  const location = useLocation()
  const [content, setContent] = useState("")
  const [isLiked, setIsLiked] = useState({})
  const [tweets, setTweets] = useState([])
  const [channelProfile, setChannelProfile] = useState(DEFAULT_CHANNEL_PROFILE)
  const [isLoadingTweets, setIsLoadingTweets] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const pathSegments = useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const channelRouteSegment = pathSegments[0] || ""
  const isOwnChannelRoute = channelRouteSegment === "channel"

  useEffect(() => {
    let isMounted = true

    const fetchTweets = async () => {
      setIsLoadingTweets(true)
      try {
        let channelId = null
        let resolvedChannelProfile = DEFAULT_CHANNEL_PROFILE

        if (isOwnChannelRoute) {
          let currentUser = authUserData

          if (!currentUser?._id || !currentUser?.username) {
            const currentUserResponse = await axios.get(
              "/api/v1/users/current-user",
              AUTH_REQUEST_CONFIG
            )
            currentUser = currentUserResponse?.data?.data
          }

          channelId = currentUser?._id || null
          resolvedChannelProfile = {
            ...DEFAULT_CHANNEL_PROFILE,
            avatar: currentUser?.avatar || DEFAULT_CHANNEL_PROFILE.avatar,
            fullName: currentUser?.fullName || DEFAULT_CHANNEL_PROFILE.fullName,
            username: currentUser?.username || DEFAULT_CHANNEL_PROFILE.username,
          }
        } else {
          channelId = channelRouteSegment ? decodeURIComponent(channelRouteSegment) : null

          if (channelRouteSegment) {
            try {
              const channelProfileResponse = await axios.get(
                `/api/v1/users/c/${encodeURIComponent(channelRouteSegment)}`,
                AUTH_REQUEST_CONFIG
              )

              const profileData = channelProfileResponse?.data?.data
              resolvedChannelProfile = {
                ...DEFAULT_CHANNEL_PROFILE,
                avatar: profileData?.avatar || DEFAULT_CHANNEL_PROFILE.avatar,
                fullName: profileData?.fullName || DEFAULT_CHANNEL_PROFILE.fullName,
                username: profileData?.username || DEFAULT_CHANNEL_PROFILE.username,
              }
            } catch (error) {
              resolvedChannelProfile = DEFAULT_CHANNEL_PROFILE
            }
          }
        }

        if (!channelId) {
          if (isMounted) {
            setTweets([])
            setIsLiked({})
            setChannelProfile(resolvedChannelProfile)
          }
          return
        }

        const channelTweetsResponse = await axios.get(
          `/api/v1/tweets/user/${encodeURIComponent(channelId)}`,
          AUTH_REQUEST_CONFIG
        )

        const channelTweets = Array.isArray(channelTweetsResponse?.data?.data)
          ? channelTweetsResponse.data.data
          : []

        const likeCounts = await Promise.all(
          channelTweets.map(async (tweet) => {
            try {
              const likeCountResponse = await axios.get(
                `/api/v1/likes/count/t/${encodeURIComponent(tweet._id)}`,
                AUTH_REQUEST_CONFIG
              )
              return Number(likeCountResponse?.data?.data) || 0
            } catch (error) {
              return 0
            }
          })
        )

        const tweetsWithLikes = channelTweets.map((tweet, index) => ({
          ...tweet,
          likes: likeCounts[index],
        }))

        let tweetLikesMap = {}

        if (authStatus) {
          const likedResponses = await Promise.all(
            tweetsWithLikes.map(async (tweet) => {
              try {
                const isLikedResponse = await axios.get(
                  `/api/v1/likes/t/${encodeURIComponent(tweet._id)}`,
                  AUTH_REQUEST_CONFIG
                )
                return Boolean(isLikedResponse?.data?.data)
              } catch (error) {
                return false
              }
            })
          )

          tweetLikesMap = tweetsWithLikes.reduce((acc, tweet, index) => {
            acc[tweet._id] = likedResponses[index]
            return acc
          }, {})
        }

        if (isMounted) {
          setChannelProfile(resolvedChannelProfile)
          setTweets(tweetsWithLikes)
          setIsLiked(tweetLikesMap)
        }
      } catch (error) {
        if (isMounted) {
          setTweets([])
          setIsLiked({})
          setChannelProfile(DEFAULT_CHANNEL_PROFILE)
        }
      } finally {
        if (isMounted) {
          setIsLoadingTweets(false)
        }
      }
    }

    fetchTweets()

    return () => {
      isMounted = false
    }
  }, [
    authStatus,
    authUserData?._id,
    authUserData?.username,
    authUserData?.fullName,
    authUserData?.avatar,
    isOwnChannelRoute,
    channelRouteSegment,
  ])

  const handleSendTweet = async () => {
    const trimmedContent = content.trim()

    if (!trimmedContent || isSending) {
      return
    }

    setIsSending(true)
    try {
      const createTweetResponse = await axios.post(
        "/api/v1/tweets",
        { content: trimmedContent },
        AUTH_REQUEST_CONFIG
      )

      const createdTweet = createTweetResponse?.data?.data

      if (createdTweet?._id) {
        setTweets((prevTweets) => [
          {
            ...createdTweet,
            likes: 0,
          },
          ...prevTweets,
        ])
        setIsLiked((prevLikes) => ({
          ...prevLikes,
          [createdTweet._id]: false,
        }))
      }

      setContent("")
    } catch (error) {
      console.error(error)
    } finally {
      setIsSending(false)
    }
  }

  const handleToggleTweetLike = async (tweetId) => {
    if (!authStatus) {
      return
    }

    try {
      await axios.post(
        `/api/v1/likes/toggle/t/${encodeURIComponent(tweetId)}`,
        {},
        AUTH_REQUEST_CONFIG
      )

      setIsLiked((prevLikes) => ({
        ...prevLikes,
        [tweetId]: !prevLikes[tweetId],
      }))
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          <div className="px-4 pb-4">
            {
              isOwnChannelRoute
              && (
                <div className="mt-2 border pb-2">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="mb-2 h-10 w-full resize-none border-none bg-transparent px-3 pt-2 outline-none"
                    placeholder="Write a tweet"></textarea>
                  <div className="flex items-center justify-end gap-x-3 px-3">
                    <button className="inline-block h-5 w-5 hover:text-[#ae7aff]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"></path>
                      </svg>
                    </button>
                    <button className="inline-block h-5 w-5 hover:text-[#ae7aff]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"></path>
                      </svg>
                    </button>
                    <button
                    onClick={handleSendTweet}
                    disabled={isSending || content.trim() === ""}
                    className="bg-[#ae7aff] px-3 py-2 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60">Send</button>
                  </div>
                </div>
              )
            }
            {
              isLoadingTweets
              ? <h1>Loading...</h1>
              : tweets.length > 0
              ? (
                <div className="py-4">
                  {
                    tweets.map((tweet) => (
                      <div key={tweet._id} className="flex gap-3 border-b border-gray-700 py-4 last:border-b-transparent">
                        <div className="h-14 w-14 shrink-0">
                          <img
                            src={channelProfile.avatar}
                            alt={channelProfile.fullName}
                            className="h-full w-full rounded-full" />
                        </div>
                        <div className="w-full">
                          <h4 className="mb-1 flex items-center gap-x-2">
                            <span className="font-semibold">{channelProfile.fullName}</span>
                             
                            <span className="inline-block text-sm text-gray-400">{timeAgo(tweet.createdAt)}</span>
                          </h4>
                          <p className="mb-2">{tweet.content}</p>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleToggleTweetLike(tweet._id)}
                              className="inline-flex items-center gap-x-1 outline-none focus-visible:ring-2 focus-visible:ring-[#ae7aff] rounded">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                aria-hidden="true"
                                className={`h-5 w-5 ${authStatus ? (isLiked[tweet._id] ? "text-[#ae7aff]" : "text-inherit") : "text-inherit"}`}>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"></path>
                              </svg>
                              <span>{authStatus ? (isLiked[tweet._id] ? `${tweet.likes + 1}` : `${tweet.likes}`) : `${tweet.likes}`}</span>
                            </button>
                          </div>
                        </div>
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
                              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"></path>
                          </svg>
                        </span>
                      </span>
                    </p>
                    <h5 className="mb-2 font-semibold">No Tweets</h5>
                    <p>
                      This channel is yet to make a
                      <strong>Tweet</strong>
                      .
                    </p>
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

export default Tweets
