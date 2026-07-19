import React from 'react'
import { Header, Playlist as PlaylistComponent, Sidebar } from '../components/index.js'

function PlaylistPage() {
  return (
    <>
      <Header />
      <Sidebar />
      <PlaylistComponent />
    </>
  )
}

export default PlaylistPage