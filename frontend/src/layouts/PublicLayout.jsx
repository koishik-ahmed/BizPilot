import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
export default function PublicLayout(){return <><PublicNavbar/><Outlet/><PublicFooter/></>}