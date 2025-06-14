
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-8 bg-secondary border-t border-border">
      <div className="container mx-auto px-6 text-center text-muted-foreground">
        <p className="mb-2 text-2xl font-heading font-bold text-primary">Random</p>
        <p className="text-sm">&copy; {currentYear} Random App. Tous droits réservés. Osez l'imprévu.</p>
        <p className="text-xs mt-2">
          Conçu avec audace à Paris.
        </p>
        {/* Placeholder for social media icons or other links */}
        {/* <div className="mt-4 flex justify-center space-x-4">
          <a href="#" className="hover:text-primary">Twitter</a>
          <a href="#" className="hover:text-primary">Instagram</a>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
