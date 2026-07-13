import axios from 'axios'
import React, { useState } from 'react'

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
}

function ChgPassword() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleCancel = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setErrorMessage("")
    setSuccessMessage("")
  }

  const handleUpdatePassword = async () => {
    if (isUpdatingPassword) {
      return
    }

    const trimmedCurrentPassword = currentPassword.trim()
    const trimmedNewPassword = newPassword.trim()
    const trimmedConfirmPassword = confirmPassword.trim()

    setErrorMessage("")
    setSuccessMessage("")

    if (!trimmedCurrentPassword || !trimmedNewPassword || !trimmedConfirmPassword) {
      setErrorMessage("Please fill in all password fields.")
      return
    }

    if (trimmedNewPassword.length <= 8) {
      setErrorMessage("New password must be more than 8 characters.")
      return
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setErrorMessage("New password and confirm password do not match.")
      return
    }

    setIsUpdatingPassword(true)

    try {
      await axios.post(
        "/api/v1/users/change-password",
        {
          oldPassword: trimmedCurrentPassword,
          newPassword: trimmedNewPassword,
        },
        AUTH_REQUEST_CONFIG
      )

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setSuccessMessage("Password updated successfully.")
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      setErrorMessage(apiMessage || "Failed to update password. Please try again.")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#121212] text-white">
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <section className="w-full pb-17.5 sm:ml-17.5 sm:pb-0 lg:ml-0">
          <div className="px-4 pb-4">
            {
              isUpdatingPassword
              ? <h1>Loading...</h1>
              : null
            }
            <div className="flex flex-wrap justify-center gap-y-4 py-4">
              <div className="w-full sm:w-1/2 lg:w-1/3">
                <h5 className="font-semibold">Password</h5>
                <p className="text-gray-300">Please enter your current password to change your password.</p>
                {
                  errorMessage
                  ? <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
                  : null
                }
                {
                  successMessage
                  ? <p className="mt-2 text-sm text-green-400">{successMessage}</p>
                  : null
                }
              </div>
              <div className="w-full sm:w-1/2 lg:w-2/3">
                <div className="rounded-lg border">
                  <div className="flex flex-wrap gap-y-4 p-4">
                    <div className="w-full">
                      <label
                        className="mb-1 inline-block"
                        htmlFor="old-pwd">
                        Current password
                      </label>
                      <input
                        type="password"
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        value={currentPassword}
                        className="w-full rounded-lg border bg-transparent px-2 py-1.5"
                        id="old-pwd"
                        placeholder="Current password" />
                    </div>
                    <div className="w-full">
                      <label
                        className="mb-1 inline-block"
                        htmlFor="new-pwd">
                        New password
                      </label>
                      <input
                        type="password"
                        onChange={(e) => setNewPassword(e.target.value)}
                        value={newPassword}
                        className="w-full rounded-lg border bg-transparent px-2 py-1.5"
                        id="new-pwd"
                        placeholder="New password" />
                      <p className="mt-0.5 text-sm text-gray-300">Your new password must be more than 8 characters.</p>
                    </div>
                    <div className="w-full">
                      <label
                        className="mb-1 inline-block"
                        htmlFor="cnfrm-pwd">
                        Confirm password
                      </label>
                      <input
                        type="password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        value={confirmPassword}
                        className="w-full rounded-lg border bg-transparent px-2 py-1.5"
                        id="cnfrm-pwd"
                        placeholder="Confirm password" />
                    </div>
                  </div>
                  <hr className="border border-gray-300" />
                  <div className="flex items-center justify-end gap-4 p-4">
                    <button
                    onClick={handleCancel}
                    disabled={isUpdatingPassword}
                    className="inline-block rounded-lg border px-3 py-1.5 hover:bg-white/10">Cancel</button>
                    <button
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword}
                    className="inline-block bg-[#ae7aff] px-3 py-1.5 text-black disabled:cursor-not-allowed disabled:opacity-60">Update Password</button>
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

export default ChgPassword