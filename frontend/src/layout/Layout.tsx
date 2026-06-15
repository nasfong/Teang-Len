import { Outlet } from "react-router-dom";


const Layout = () => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundImage: "url('/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    ><Outlet /></div>
  )
}

export default Layout;