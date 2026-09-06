import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";

export default function PublicNavbar(){
  const [open,setOpen]=useState(false);
  const nav=[['About Us','/about'],['Services','/services'],['Contact','/contact']];
  return <header className="public-nav">
    <div className="public-nav-inner"><Link to="/" onClick={()=>setOpen(false)}><Logo/></Link>
      <nav className={open?'mobile-open':''}>{nav.map(([label,path])=><NavLink key={path} to={path} onClick={()=>setOpen(false)}>{label}</NavLink>)}<Link className="nav-login" to="/login" onClick={()=>setOpen(false)}>Log in</Link><Link className="nav-cta" to="/signup" onClick={()=>setOpen(false)}>Get started</Link></nav>
      <button className="mobile-menu" onClick={()=>setOpen(!open)} aria-label="Menu">{open?<X/>:<Menu/>}</button>
    </div>
  </header>
}