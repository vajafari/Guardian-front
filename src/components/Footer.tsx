import './Footer.css';

export function Footer() {
  return (
    <footer className="app-footer">
      <span>© {new Date().getFullYear()} Guardian — تمامی حقوق محفوظ است.</span>
    </footer>
  );
}
