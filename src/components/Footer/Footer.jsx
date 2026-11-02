import './Footer.css'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p>© {YEAR} Menologaritmo. All rights reserved.</p>
      </div>
    </footer>
  )
}
