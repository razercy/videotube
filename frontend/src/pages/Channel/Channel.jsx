import React from 'react'
import { Channel as ChannelComponent, Header, Sidebar } from '../../components/index.js'
import { Outlet } from 'react-router-dom'

function ChannelPage() {
  return (
    <>
      <Header />
      <Sidebar />
      <ChannelComponent />
      <Outlet />
    </>
  )
}

export default ChannelPage