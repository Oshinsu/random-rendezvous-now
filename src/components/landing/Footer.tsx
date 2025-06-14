
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-8 bg-secondary border-t border-border">
      <div className="container mx-auto px-6 text-center text-muted-foreground">
        <p className="mb-2 text-xl font-heading font-bold text-primary">Random</p>
        <p className="text-sm">&copy; {currentYear} Random App. Tous droits réservés. Osez l'imprévu.</p>
        <p className="text-xs mt-2 opacity-75">
          Conçu avec audace à Paris pour les aventuriers du quotidien.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
