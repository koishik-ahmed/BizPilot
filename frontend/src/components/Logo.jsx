export default function Logo({ light=false }) {
  return <div className="logo-wrap">
    <div className="logo-mark">B</div>
    <div><strong className={light ? "logo-light" : ""}>BizPilot</strong><span>Business made simple</span></div>
  </div>;
}