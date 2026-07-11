import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

function Subscribed() {
  const authStatus = useSelector((state) => state.auth.status)
  const authUserData = useSelector((state) => state.auth.userData)
  const location = useLocation()

  const [subscribees, setSubscribees] = useState([])
  const [isSubscribed, setIsSubscribed] = useState({})
  const [isLoadingSubscribees, setIsLoadingSubscribees] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [toggleError, setToggleError] = useState('')

  const pathSegments = useMemo(
    () => location.pathname.split('/').filter(Boolean),
    [location.pathname]
  )

  const channelRouteSegment = pathSegments[0] || ''
  const isOwnChannelRoute = channelRouteSegment === 'channel'

  useEffect(() => {
    const controller = new AbortController()
    const requestConfig = {
      ...AUTH_REQUEST_CONFIG,
      signal: controller.signal,
    }
    let isMounted = true

    const fetchSubscribees = async () => {
      setIsLoadingSubscribees(true)
      setFetchError('')

      if (!authStatus) {
        if (isMounted) {
          setSubscribees([])
          setIsSubscribed({})
          setIsLoadingSubscribees(false)
        }
        return
      }

      try {
        let subscriberId = null

        if (isOwnChannelRoute) {
          if (authUserData?._id) {
            subscriberId = authUserData._id
          } else {
            const currentUserResponse = await axios.get(
              '/api/v1/users/current-user',
              requestConfig
            )
            subscriberId = currentUserResponse?.data?.data?._id || null
          }
        } else {
          subscriberId = channelRouteSegment
            ? decodeURIComponent(channelRouteSegment)
            : null
        }

        if (!subscriberId) {
          if (isMounted) {
            setSubscribees([])
            setIsSubscribed({})
          }
          return
        }

        const subscribeesResponse = await axios.get(
          `/api/v1/subscriptions/c/${encodeURIComponent(subscriberId)}`,
          requestConfig
        )

        const rawSubscribees = Array.isArray(subscribeesResponse?.data?.data)
          ? subscribeesResponse.data.data
          : []

        const subscriberCounts = await Promise.all(
          rawSubscribees.map(async (element) => {
            try {
              const subscriberCountResponse = await axios.get(
                `/api/v1/subscriptions/count/${encodeURIComponent(element._id)}`,
                requestConfig
              )
              return Number(subscriberCountResponse?.data?.data) || 0
            } catch (error) {
              return 0
            }
          })
        )

        const subscribeesWithCounts = rawSubscribees.map((element, index) => ({
          ...element,
          subscribers: subscriberCounts[index],
        }))

        let subscribedMap = {}

        if (authStatus) {
          const subscribedFlags = await Promise.all(
            subscribeesWithCounts.map(async (element) => {
              try {
                const isSubscribedResponse = await axios.get(
                  `/api/v1/subscriptions/${encodeURIComponent(element._id)}`,
                  requestConfig
                )
                return Boolean(isSubscribedResponse?.data?.data)
              } catch (error) {
                return false
              }
            })
          )

          subscribedMap = subscribeesWithCounts.reduce((acc, element, index) => {
            acc[element._id] = subscribedFlags[index]
            return acc
          }, {})
        }

        if (isMounted) {
          setSubscribees(subscribeesWithCounts)
          setIsSubscribed(subscribedMap)
        }
      } catch (error) {
        if (isMounted) {
          setSubscribees([])
          setIsSubscribed({})
          setFetchError('Failed to load subscriptions.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingSubscribees(false)
        }
      }
    }

    fetchSubscribees()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [
    authStatus,
    authUserData?._id,
    isOwnChannelRoute,
    channelRouteSegment,
  ])

  const handleToggleSubscription = async (subscribeeId) => {
    setToggleError('')
    try {
      await axios.post(
        `/api/v1/subscriptions/c/${encodeURIComponent(subscribeeId)}`,
        {},
        AUTH_REQUEST_CONFIG
      )

      setIsSubscribed((prev) => {
        const wasSubscribed = Boolean(prev[subscribeeId])

        return {
          ...prev,
          [subscribeeId]: !wasSubscribed,
        }
      })
    } catch (error) {
      setToggleError('Unable to update subscription. Please try again.')
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          <div className="px-4 pb-4">
            {
              isLoadingSubscribees
              ? <h1>Loading...</h1>
              : null
            }
            {
              fetchError
              ? <p className="mb-4 text-sm text-red-400">{fetchError}</p>
              : null
            }
            {
              toggleError
              ? <p className="mb-4 text-sm text-red-400">{toggleError}</p>
              : null
            }
            {
              !isLoadingSubscribees && (subscribees.length > 0)
              ? (
                <div className="flex flex-col gap-y-4 py-4">
                  {
                    subscribees.map((subscribee) => (
                      <div key={subscribee._id} className="flex w-full justify-between">
                        <div className="flex items-center gap-x-2">
                          <div className="h-14 w-14 shrink-0">
                            <img
                              src={subscribee.avatar}
                              alt={subscribee.fullName}
                              className="h-full w-full rounded-full" />
                          </div>
                          <div className="block">
                            <h6 className="font-semibold">{subscribee.fullName}</h6>
                            <p className="text-sm text-gray-300">
                              {`${(Number(subscribee.subscribers) || 0) + (authStatus && isSubscribed[subscribee._id] ? 1 : 0)}`} Subscribers
                            </p>
                          </div>
                        </div>
                        {
                          authStatus && !isOwnChannelRoute
                          && (
                            <div className="block">
                              <button
                              onClick={() => handleToggleSubscription(subscribee._id)}
                              className={`px-3 py-2 ${isSubscribed[subscribee._id] ? 'bg-[#ae7aff] text-black' : 'bg-white text-black'}`}>
                                { isSubscribed[subscribee._id] ? 'Subscribed' : 'Subscribe' }
                              </button>
                            </div>
                          )
                        }
                      </div>
                    ))
                  }
                </div>
              )
              : (!isLoadingSubscribees && !fetchError && (
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
                    <h5 className="mb-2 font-semibold">No channels subscribed to</h5>
                    <p>
                      This channel is yet to
                      <strong>subscribe</strong>
                      to a new channel.
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

export default Subscribed
