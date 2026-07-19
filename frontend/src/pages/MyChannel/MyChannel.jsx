import React from 'react'
import { Channel as ChannelComponent, Header, Sidebar } from '../../components/index.js'
import { Outlet } from 'react-router-dom'

function MyChannelPage() {
  return (
    <>
      <Header />
      <Sidebar />
      <ChannelComponent />
      <Outlet />
    </>
  )
}

export default MyChannelPage