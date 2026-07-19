import React from 'react'
import { CardViewListing as CardViewListingComponent, Header, Sidebar } from '../components/index.js'

function CardViewListingPage() {
  return (
    <>
      <Header />
      <Sidebar />
      <CardViewListingComponent />
    </>
  )
}

export default CardViewListingPage