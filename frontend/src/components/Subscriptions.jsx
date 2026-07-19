import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

function Subscriptions() {
  const authStatus = useSelector((state) => state.auth.status)
  const authUserData = useSelector((state) => state.auth.userData)

  const [channels, setChannels] = useState([])
  const [isSubscribed, setIsSubscribed] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const requestConfig = {
      ...AUTH_REQUEST_CONFIG,
      signal: controller.signal,
    }
    let isMounted = true

    const fetchSubscriptions = async () => {
      setLoading(true)
      setError('')

      if (!authStatus) {
        if (isMounted) {
          setChannels([])
          setIsSubscribed({})
          setLoading(false)
        }
        return
      }

      try {
        let subscriberId = authUserData?._id || null

        if (!subscriberId) {
          const currentUserResponse = await axios.get(
            '/api/v1/users/current-user',
            requestConfig
          )
          subscriberId = currentUserResponse?.data?.data?._id || null
        }

        if (!subscriberId) {
          if (isMounted) {
            setChannels([])
            setIsSubscribed({})
            setLoading(false)
          }
          return
        }

        const subscriptionsResponse = await axios.get(
          `/api/v1/subscriptions/u/${encodeURIComponent(subscriberId)}`,
          requestConfig
        )

        const rawChannels = Array.isArray(subscriptionsResponse?.data?.data)
          ? subscriptionsResponse.data.data
          : []

        const subscriberCounts = await Promise.all(
          rawChannels.map(async (channel) => {
            try {
              const subscriberCountResponse = await axios.get(
                `/api/v1/subscriptions/count/${encodeURIComponent(channel._id)}`,
                requestConfig
              )
              return Number(subscriberCountResponse?.data?.data) || 0
            } catch (countError) {
              return 0
            }
          })
        )

        const channelsWithCounts = rawChannels.map((channel, index) => ({
          ...channel,
          subscribers: subscriberCounts[index],
        }))

        const subscribedMap = channelsWithCounts.reduce((acc, channel) => {
          acc[channel._id] = true
          return acc
        }, {})

        if (isMounted) {
          setChannels(channelsWithCounts)
          setIsSubscribed(subscribedMap)
        }
      } catch (requestError) {
        if (isMounted) {
          setChannels([])
          setIsSubscribed({})
          setError('Failed to load subscriptions.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSubscriptions()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [authStatus, authUserData?._id])

  const handleToggleSubscription = async (channelId) => {
    try {
      await axios.post(
        `/api/v1/subscriptions/c/${encodeURIComponent(channelId)}`,
        {},
        AUTH_REQUEST_CONFIG
      )

      setChannels((prev) => prev.filter((channel) => channel._id !== channelId))
      setIsSubscribed((prev) => ({
        ...prev,
        [channelId]: false,
      }))
    } catch (requestError) {
      setError('Unable to update subscription. Please try again.')
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          <div className="px-4 pb-4">
            {
              loading
              ? <h1>Loading...</h1>
              : null
            }
            {
              error
              ? <p className="mb-4 text-sm text-red-400">{error}</p>
              : null
            }
            {
              !loading && (channels.length > 0)
              ? (
                <div className="flex flex-col gap-y-4 py-4">
                  {
                    channels.map((channel) => (
                      <div key={channel._id} className="flex w-full justify-between">
                        <div className="flex items-center gap-x-2">
                          <div className="h-14 w-14 shrink-0">
                            <img
                              src={channel.avatar}
                              alt={channel.fullName}
                              className="h-full w-full rounded-full" />
                          </div>
                          <div className="block">
                            <h6 className="font-semibold">{channel.fullName}</h6>
                            <p className="text-sm text-gray-300">
                              {`${Number(channel.subscribers) || 0}`} Subscribers
                            </p>
                          </div>
                        </div>
                        {
                          isSubscribed[channel._id]
                          ? (
                            <div className="block">
                              <button
                              onClick={() => handleToggleSubscription(channel._id)}
                              className="bg-[#ae7aff] px-3 py-2 text-black">
                                Subscribed
                              </button>
                            </div>
                          )
                          : null
                        }
                      </div>
                    ))
                  }
                </div>
              )
              : (!loading && !error && (
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
                    <h5 className="mb-2 font-semibold">No subscriptions yet</h5>
                    <p>
                      You have not
                      <strong> subscribed </strong>
                      to any channels yet.
                    </p>
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

export default Subscriptions