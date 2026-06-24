import { Outlet } from "react-router-dom";


const Layout = ({ image }: { image: string }) => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundImage: `url('${image}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    ><Outlet /></div>
  )
}

export default Layout;