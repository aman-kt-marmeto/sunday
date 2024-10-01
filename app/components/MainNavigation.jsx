import { NavLink } from "@remix-run/react"
import navbarStyle from "../styles/navbar.css?url"

export const links = () => [{ rel: "stylesheet", href: navbarStyle }];

function MainNavigation() {
  return (
    <navbar className="navbar-container">
      <div className="logo">
        <h1>SUNDAY</h1>
      </div>
      <div>
        <NavLink className="nav-item" to="/app" rel="home">Home</NavLink>
        <NavLink className="nav-item" to="/ProductList">Product List</NavLink>
      </div>
    </navbar>
  )
}

export default MainNavigation