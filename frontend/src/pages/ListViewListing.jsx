import React from 'react'
import { Header, ListViewListing as ListViewListingComponent, Sidebar } from '../components/index.js'

function ListViewListingPage() {
  return (
    <>
      <Header />
      <Sidebar />
      <ListViewListingComponent />
    </>
  )
}

export default ListViewListingPage