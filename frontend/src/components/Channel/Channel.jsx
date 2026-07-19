import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

const AUTH_REQUEST_CONFIG = {
    withCredentials: true,
}

const DEFAULT_CHANNEL = {
    _id: '',
    avatar: '',
    coverImage: '',
    fullName: '',
    username: '',
}

function Channel() {
    const authStatus = useSelector((state) => state.auth.status)
    const authUserData = useSelector((state) => state.auth.userData)
    const navigate = useNavigate()
    const location = useLocation()

    const [channel, setChannel] = useState(DEFAULT_CHANNEL)
    const [channelId, setChannelId] = useState('')
    const [subscriberCount, setSubscriberCount] = useState(0)
    const [subscribeeCount, setSubscribeeCount] = useState(0)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoadingChannel, setIsLoadingChannel] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [toggleError, setToggleError] = useState('')
    const [isTogglingSubscription, setIsTogglingSubscription] = useState(false)

    const pathSegments = useMemo(
        () => location.pathname.split('/').filter(Boolean),
        [location.pathname]
    )

    const channelRouteSegment = pathSegments[0] || ''
    const activeTab = pathSegments[1] || 'videos'
    const isOwnChannelRoute = channelRouteSegment === 'channel'

    useEffect(() => {
        const controller = new AbortController()
        const requestConfig = {
            ...AUTH_REQUEST_CONFIG,
            signal: controller.signal,
        }
        let isMounted = true

        const fetchChannelData = async () => {
            setIsLoadingChannel(true)
            setFetchError('')
            setToggleError('')

            try {
                let resolvedChannel = DEFAULT_CHANNEL
                let resolvedChannelId = ''

                if (isOwnChannelRoute) {
                    let currentUser = authUserData

                    if (!currentUser?._id) {
                        const currentUserResponse = await axios.get(
                            '/api/v1/users/current-user',
                            requestConfig
                        )
                        currentUser = currentUserResponse?.data?.data || null
                    }

                    resolvedChannel = {
                        ...DEFAULT_CHANNEL,
                        ...(currentUser || {}),
                    }
                    resolvedChannelId = currentUser?._id || ''
                } else if (channelRouteSegment) {
                    const channelProfileResponse = await axios.get(
                        `/api/v1/users/c/${encodeURIComponent(channelRouteSegment)}`,
                        requestConfig
                    )
                    const profile = channelProfileResponse?.data?.data || null

                    resolvedChannel = {
                        ...DEFAULT_CHANNEL,
                        ...(profile || {}),
                    }
                    resolvedChannelId = profile?._id || ''
                }

                if (!resolvedChannelId) {
                    if (isMounted) {
                        setChannel(DEFAULT_CHANNEL)
                        setChannelId('')
                        setSubscriberCount(0)
                        setSubscribeeCount(0)
                        setIsSubscribed(false)
                    }
                    return
                }

                const subscriberCountPromise = axios.get(
                    `/api/v1/subscriptions/count/${encodeURIComponent(resolvedChannelId)}`,
                    requestConfig
                )

                const subscribeeListPromise = axios.get(
                    `/api/v1/subscriptions/u/${encodeURIComponent(resolvedChannelId)}`,
                    requestConfig
                )

                const isSubscribedPromise = (!isOwnChannelRoute && authStatus)
                    ? axios.get(
                        `/api/v1/subscriptions/${encodeURIComponent(resolvedChannelId)}`,
                        requestConfig
                    )
                    : Promise.resolve({ data: { data: false } })

                const [subscriberCountResponse, subscribeeListResponse, isSubscribedResponse] = await Promise.all([
                    subscriberCountPromise,
                    subscribeeListPromise,
                    isSubscribedPromise,
                ])

                const resolvedSubscriberCount = Number(subscriberCountResponse?.data?.data) || 0
                const subscribees = Array.isArray(subscribeeListResponse?.data?.data)
                    ? subscribeeListResponse.data.data
                    : []
                const resolvedIsSubscribed = Boolean(isSubscribedResponse?.data?.data)

                if (isMounted) {
                    setChannel(resolvedChannel)
                    setChannelId(resolvedChannelId)
                    setSubscriberCount(resolvedSubscriberCount)
                    setSubscribeeCount(subscribees.length)
                    setIsSubscribed(resolvedIsSubscribed)
                }
            } catch (error) {
                if (isMounted) {
                    setChannel(DEFAULT_CHANNEL)
                    setChannelId('')
                    setSubscriberCount(0)
                    setSubscribeeCount(0)
                    setIsSubscribed(false)
                    setFetchError('Failed to load channel details.')
                }
            } finally {
                if (isMounted) {
                    setIsLoadingChannel(false)
                }
            }
        }

        fetchChannelData()

        return () => {
            isMounted = false
            controller.abort()
        }
    }, [
        authStatus,
        authUserData?._id,
        authUserData?.username,
        authUserData?.fullName,
        authUserData?.avatar,
        authUserData?.coverImage,
        isOwnChannelRoute,
        channelRouteSegment,
    ])

    const handleToggleSubscription = async () => {
        if (!authStatus || isOwnChannelRoute || !channelId || isTogglingSubscription) {
            return
        }

        setToggleError('')
        setIsTogglingSubscription(true)

        try {
            await axios.post(
                `/api/v1/subscriptions/c/${encodeURIComponent(channelId)}`,
                {},
                AUTH_REQUEST_CONFIG
            )

            setIsSubscribed((prev) => !prev)
        } catch (error) {
            setToggleError('Unable to update subscription. Please try again.')
        } finally {
            setIsTogglingSubscription(false)
        }
    }

    const displayedSubscriberCount = (Number(subscriberCount) || 0)
        + (authStatus && !isOwnChannelRoute && isSubscribed ? 1 : 0)

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
        <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
            <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
                                {
                                    isLoadingChannel
                                    ? <h1>Loading...</h1>
                                    : null
                                }
                <div className="relative min-h-37.5 w-full pt-[16.28%]">
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={channel.coverImage}
                            alt="cover-photo" />
                    </div>
                </div>
                <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-4 pb-4 pt-6">
                        <span className="relative -mt-12 inline-block h-28 w-28 shrink-0 overflow-hidden rounded-full border-2">
                            <img
                            src={channel.avatar}
                            alt="Channel"
                            className="h-full w-full" />
                        </span>
                        <div className="mr-auto inline-block">
                            <h1 className="font-bold text-xl">{channel.fullName}</h1>
                            <p className="text-sm text-gray-400">@{channel.username}</p>
                                                        <p className="text-sm text-gray-400">{`${displayedSubscriberCount}`} Subscribers · {`${subscribeeCount}`} Subscribed</p>
                                                        {
                                                            fetchError
                                                            ? <p className="mt-2 text-sm text-red-400">{fetchError}</p>
                                                            : null
                                                        }
                                                        {
                                                            toggleError
                                                            ? <p className="mt-2 text-sm text-red-400">{toggleError}</p>
                                                            : null
                                                        }
                        </div>
                        <div className="inline-block">
                            {
                                                                isOwnChannelRoute
                                ? (
                                    <button
                                                                                onClick={() => navigate(channelId ? `/channel/${encodeURIComponent(channelId)}/editing/contact-info` : '/channel/editing/contact-info')}
                                        className="group/btn mr-1 flex w-full items-center gap-x-2 bg-[#ae7aff] px-3 py-2 text-center font-bold text-black shadow-[5px_5px_0px_0px_#4f4e4e] transition-all duration-150 ease-in-out active:translate-x-1.25 active:translate-y-1.25 active:shadow-[0px_0px_0px_0px_#4f4e4e] sm:w-auto">
                                        <span className="inline-block w-5">
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
                                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"></path>
                                            </svg>
                                        </span>
                                        Edit
                                    </button>
                                )
                                : (
                                    authStatus
                                    && (
                                        <div className="inline-flex min-w-36.25 justify-end">
                                            <button
                                                onClick={handleToggleSubscription}
                                                disabled={isTogglingSubscription}
                                                className="mr-1 flex w-full items-center gap-x-2 bg-[#ae7aff] px-3 py-2 text-center font-bold text-black shadow-[5px_5px_0px_0px_#4f4e4e] transition-all duration-150 ease-in-out active:translate-x-1.25 active:translate-y-1.25 active:shadow-[0px_0px_0px_0px_#4f4e4e] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                                                <span className="inline-block w-5">
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
                                                        d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"></path>
                                                    </svg>
                                                </span>
                                                <span>{ isSubscribed ? "Subscribed" : "Subscribe" }</span>
                                            </button>
                                        </div>
                                    )
                                )
                            }
                        </div>
                    </div>
                    <ul className="no-scrollbar sticky top-16.5 z-2 flex flex-row gap-x-2 overflow-auto border-b-2 border-gray-400 bg-[#121212] py-2 sm:top-20.5">
                        <li className="w-full"><button onClick={() => navigate("../videos")} className={`w-full border-b-2 ${activeTab === "videos" ? "border-[#ae7aff] bg-white" : "border-transparent"} px-3 py-1.5 ${activeTab === "videos" ? "text-[#ae7aff]" : "text-gray-400"}`}>Videos</button></li>
                        <li className="w-full"><button onClick={() => navigate("../playlist")} className={`w-full border-b-2 ${activeTab === "playlist" ? "border-[#ae7aff] bg-white" : "border-transparent"} px-3 py-1.5 ${activeTab === "playlist" ? "text-[#ae7aff]" : "text-gray-400"}`}>Playlist</button></li>
                        <li className="w-full"><button onClick={() => navigate("../tweets")} className={`w-full border-b-2 ${activeTab === "tweets" ? "border-[#ae7aff] bg-white" : "border-transparent"} px-3 py-1.5 ${activeTab === "tweets" ? "text-[#ae7aff]" : "text-gray-400"}`}>Tweets</button></li>
                        <li className="w-full"><button onClick={() => navigate("../subscribed")} className={`w-full border-b-2 ${activeTab === "subscribed" ? "border-[#ae7aff] bg-white" : "border-transparent"} px-3 py-1.5 ${activeTab === "subscribed" ? "text-[#ae7aff]" : "text-gray-400"}`}>Subscribed</button></li>
                    </ul>
                </div>
            </section>
        </div>
    </div>
  )
}

export default Channel