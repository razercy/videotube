import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useFullName } from '../index.js'

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

const splitFullName = (value = '') => {
  const safeValue = typeof value === 'string' ? value.trim() : ''

  if (!safeValue) {
    return {
      first: '',
      last: '',
    }
  }

  const parts = safeValue.split(/\s+/)

  return {
    first: parts.slice(0, -1).join(' ') || parts[0] || '',
    last: parts.length > 1 ? parts[parts.length - 1] : '',
  }
}

function PersonalInfo() {
  const authUserData = useSelector((state) => state.auth.userData)
  const { fullName, setFullName } = useFullName()
  const initialNames = splitFullName(fullName)
  const [firstName, setFirstName] = useState(initialNames.first)
  const [lastName, setLastName] = useState(initialNames.last)
  const [email, setEmail] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const syncedNames = splitFullName(fullName)
    setFirstName(syncedNames.first)
    setLastName(syncedNames.last)
  }, [fullName])

  useEffect(() => {
    const controller = new AbortController()
    const requestConfig = {
      ...AUTH_REQUEST_CONFIG,
      signal: controller.signal,
    }
    let isMounted = true

    const fetchEmail = async () => {
      setIsLoadingProfile(true)
      setErrorMessage('')

      try {
        let currentUser = authUserData

        if (!currentUser?._id) {
          const userResponse = await axios.get(
            '/api/v1/users/current-user',
            requestConfig
          )
          currentUser = userResponse?.data?.data || null
        }

        const resolvedEmail = currentUser?.email || ''

        if (isMounted) {
          setEmail(resolvedEmail)
          setOriginalEmail(resolvedEmail)
        }
      } catch (error) {
        if (isMounted) {
          setEmail('')
          setOriginalEmail('')
          setErrorMessage('Failed to load profile details.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
      }
    }

    fetchEmail()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [authUserData?._id, authUserData?.email])

  const handleCancel = () => {
    const syncedNames = splitFullName(fullName)
    setFirstName(syncedNames.first)
    setLastName(syncedNames.last)
    setEmail(originalEmail)
    setErrorMessage('')
  }

  const handleSave = async () => {
    if (isSaving) {
      return
    }

    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const trimmedEmail = email.trim()

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
      setErrorMessage('Please fill in first name, last name, and email.')
      return
    }

    const nextFullName = `${trimmedFirstName} ${trimmedLastName}`

    setErrorMessage('')
    setIsSaving(true)

    try {
      await axios.patch(
        '/api/v1/users/update-account',
        {
          fullName: nextFullName,
          email: trimmedEmail,
        },
        AUTH_REQUEST_CONFIG
      )

      setFullName(nextFullName)
      setFirstName(trimmedFirstName)
      setLastName(trimmedLastName)
      setEmail(trimmedEmail)
      setOriginalEmail(trimmedEmail)
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      setErrorMessage(apiMessage || 'Failed to update account details. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          <div className="px-4 pb-4">
            {
              isLoadingProfile
              ? <h1>Loading...</h1>
              : null
            }
            <div className="flex flex-wrap justify-center gap-y-4 py-4">
              <div className="w-full sm:w-1/2 lg:w-1/3">
                <h5 className="font-semibold">Personal Info</h5>
                <p className="text-gray-300">Update your photo and personal details.</p>
                {
                  errorMessage
                  ? <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
                  : null
                }
              </div>
              <div className="w-full sm:w-1/2 lg:w-2/3">
                <div className="rounded-lg border">
                  <div className="flex flex-wrap gap-y-4 p-4">
                    <div className="w-full lg:w-1/2 lg:pr-2">
                      <label
                        htmlFor="firstname"
                        className="mb-1 inline-block">
                        First name
                      </label>
                      <input
                        type="text"
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-lg border bg-transparent px-2 py-1.5"
                        id="firstname"
                        placeholder="Enter first name"
                        value={firstName} />
                    </div>
                    <div className="w-full lg:w-1/2 lg:pl-2">
                      <label
                        htmlFor="lastname"
                        className="mb-1 inline-block">
                        Last name
                      </label>
                      <input
                        type="text"
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-lg border bg-transparent px-2 py-1.5"
                        id="lastname"
                        placeholder="Enter last name"
                        value={lastName} />
                    </div>
                    <div className="w-full">
                      <label
                        htmlFor="email"
                        className="mb-1 inline-block">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-300">
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
                              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"></path>
                          </svg>
                        </div>
                        <input
                          type="email"
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-lg border bg-transparent py-1.5 pl-10 pr-2"
                          id="email"
                          placeholder="Enter email address"
                          value={email} />
                      </div>
                    </div>
                  </div>
                  <hr className="border border-gray-300" />
                  <div className="flex items-center justify-end gap-4 p-4">
                    <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="inline-block rounded-lg border px-3 py-1.5 hover:bg-white/10">Cancel</button>
                    <button
                    onClick={handleSave}
                    disabled={isSaving || isLoadingProfile}
                    className="inline-block bg-[#ae7aff] px-3 py-1.5 text-black disabled:cursor-not-allowed disabled:opacity-60">Save changes</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PersonalInfo