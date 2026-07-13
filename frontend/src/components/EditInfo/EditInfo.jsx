import axios from 'axios'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

const FullNameContext = createContext(undefined)

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

export function EditInfoProvider({ infoEditors, children }) {
  const authUserData = useSelector((state) => state.auth.userData)
  const [fullName, setFullName] = useState(authUserData?.fullName || '')

  useEffect(() => {
    if (authUserData?.fullName && !fullName) {
      setFullName(authUserData.fullName)
    }
  }, [authUserData?.fullName, fullName])

  return (
    <FullNameContext.Provider value={{ fullName, setFullName }}>
      {infoEditors || children}
    </FullNameContext.Provider>
  )
}

export function useFullName() {
  const context = useContext(FullNameContext)

  if (!context) {
    throw new Error('useFullName must be used within EditInfoProvider')
  }

  return context
}

function EditInfo() {
  const { fullName, setFullName } = useFullName()
  const authUserData = useSelector((state) => state.auth.userData)
  const navigate = useNavigate()
  const location = useLocation()

  const [coverImage, setCoverImage] = useState('')
  const [avatar, setAvatar] = useState('')
  const [username, setUsername] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const pathSegments = useMemo(
    () => location.pathname.split('/').filter(Boolean),
    [location.pathname]
  )

  const activeTab = pathSegments[pathSegments.length - 1] || 'contact-info'

  useEffect(() => {
    const controller = new AbortController()
    const requestConfig = {
      ...AUTH_REQUEST_CONFIG,
      signal: controller.signal,
    }
    let isMounted = true

    const fetchProfile = async () => {
      setIsLoadingProfile(true)
      setErrorMessage('')

      try {
        let currentUser = authUserData

        if (!currentUser?._id || !currentUser?.username) {
          const currentUserResponse = await axios.get(
            '/api/v1/users/current-user',
            requestConfig
          )
          currentUser = currentUserResponse?.data?.data || null
        }

        if (!currentUser?.username) {
          if (isMounted) {
            setUsername('')
            setCoverImage('')
            setAvatar('')
          }
          return
        }

        const profileResponse = await axios.get(
          `/api/v1/users/c/${encodeURIComponent(currentUser.username)}`,
          requestConfig
        )

        const profile = profileResponse?.data?.data || {}

        if (isMounted) {
          setUsername(profile.username || currentUser.username || '')
          setCoverImage(profile.coverImage || currentUser.coverImage || '')
          setAvatar(profile.avatar || currentUser.avatar || '')
          setFullName(profile.fullName || currentUser.fullName || '')
        }
      } catch (error) {
        if (isMounted) {
          setUsername(authUserData?.username || '')
          setCoverImage(authUserData?.coverImage || '')
          setAvatar(authUserData?.avatar || '')
          setErrorMessage('Failed to load profile details.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [
    authUserData?._id,
    authUserData?.username,
    authUserData?.fullName,
    authUserData?.avatar,
    authUserData?.coverImage,
    setFullName,
  ])

  const refreshFromCurrentProfile = async (fallbackUser) => {
    if (!fallbackUser?.username) {
      return
    }

    try {
      const profileResponse = await axios.get(
        `/api/v1/users/c/${encodeURIComponent(fallbackUser.username)}`,
        AUTH_REQUEST_CONFIG
      )

      const profile = profileResponse?.data?.data || {}

      setUsername(profile.username || fallbackUser.username || '')
      setCoverImage(profile.coverImage || fallbackUser.coverImage || '')
      setAvatar(profile.avatar || fallbackUser.avatar || '')
      setFullName(profile.fullName || fallbackUser.fullName || '')
    } catch (error) {
      setErrorMessage('Profile updated, but refreshing details failed.')
    }
  }

  const handleCoverImageChange = async (event) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile || isUploadingCover) {
      return
    }

    setErrorMessage('')
    setIsUploadingCover(true)

    try {
      const formData = new FormData()
      formData.append('coverImage', selectedFile)

      const updatedUserResponse = await axios.patch(
        '/api/v1/users/cover-image',
        formData,
        {
          ...AUTH_REQUEST_CONFIG,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      const updatedUser = updatedUserResponse?.data?.data || {}
      await refreshFromCurrentProfile(updatedUser)
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      setErrorMessage(apiMessage || 'Failed to update cover image.')
    } finally {
      setIsUploadingCover(false)
      event.target.value = ''
    }
  }

  const handleAvatarChange = async (event) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile || isUploadingAvatar) {
      return
    }

    setErrorMessage('')
    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('avatar', selectedFile)

      const updatedUserResponse = await axios.patch(
        '/api/v1/users/avatar',
        formData,
        {
          ...AUTH_REQUEST_CONFIG,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      const updatedUser = updatedUserResponse?.data?.data || {}
      await refreshFromCurrentProfile(updatedUser)
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      setErrorMessage(apiMessage || 'Failed to update avatar.')
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ''
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          {
            isLoadingProfile
            ? <h1>Loading...</h1>
            : null
          }
          {
            errorMessage
            ? <p className="px-4 pt-2 text-sm text-red-400">{errorMessage}</p>
            : null
          }
          <div className="relative min-h-37.5 w-full pt-[16.28%]">
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={coverImage}
                alt="cover-photo" />
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <input
                type="file"
                id="cover-image"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="hidden" />
              <label
                htmlFor="cover-image"
                className={`inline-block h-10 w-10 rounded-lg bg-white/60 p-1 text-[#ae7aff] hover:bg-white ${isUploadingCover ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
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
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"></path>
                </svg>
              </label>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-4 pb-4 pt-6">
              <div className="relative -mt-12 inline-block h-28 w-28 shrink-0 overflow-hidden rounded-full border-2">
                <img
                  src={avatar}
                  alt="Channel"
                  className="h-full w-full" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <input
                    type="file"
                    id="profile-image"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden" />
                  <label
                    htmlFor="profile-image"
                    className={`inline-block h-8 w-8 rounded-lg bg-white/60 p-1 text-[#ae7aff] hover:bg-white ${isUploadingAvatar ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
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
                        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"></path>
                    </svg>
                  </label>
                </div>
              </div>
              <div className="mr-auto inline-block">
                <h1 className="font-bold text-xl">{fullName}</h1>
                <p className="text-sm text-gray-400">@{username}</p>
              </div>
              <div className="inline-block">
                <button
                  onClick={() => navigate('/channel/videos')}
                  className="group/btn mr-1 flex w-full items-center gap-x-2 bg-[#ae7aff] px-3 py-2 text-center font-bold text-black shadow-[5px_5px_0px_0px_#4f4e4e] transition-all duration-150 ease-in-out active:translate-x-1.25 active:translate-y-1.25 active:shadow-[0px_0px_0px_0px_#4f4e4e] sm:w-auto">
                  View channel
                </button>
              </div>
            </div>
            <ul className="no-scrollbar sticky top-16.5 z-2 flex flex-row gap-x-2 overflow-auto border-b-2 border-gray-400 bg-[#121212] py-2 sm:top-20.5">
              <li className="w-full"><button onClick={() => navigate('../contact-info')} className={`w-full border-b-2 ${activeTab === 'contact-info' ? 'border-[#ae7aff] bg-white' : 'border-transparent'} px-3 py-1.5 ${activeTab === 'contact-info' ? 'text-[#ae7aff]' : 'text-gray-400'}`}>Personal Information</button></li>
              <li className="w-full"><button onClick={() => navigate('../password')} className={`w-full border-b-2 ${activeTab === 'password' ? 'border-[#ae7aff] bg-white' : 'border-transparent'} px-3 py-1.5 ${activeTab === 'password' ? 'text-[#ae7aff]' : 'text-gray-400'}`}>Change Password</button></li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

export default EditInfo
