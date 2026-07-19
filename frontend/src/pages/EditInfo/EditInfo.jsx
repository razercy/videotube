import React from 'react'
import { EditInfo as EditInfoComponent, EditInfoProvider, Header, Sidebar } from '../../components/index.js'
import { Outlet } from 'react-router-dom'

function EditInfoPage() {
  return (
    <>
      <Header />
      <Sidebar />
      <EditInfoProvider>
        <EditInfoComponent />
        <Outlet />
      </EditInfoProvider>
    </>
  )
}

export default EditInfoPage