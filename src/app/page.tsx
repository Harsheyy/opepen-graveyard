import OpepenList from '../components/opepenlist';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <OpepenList />
      </div>
      <Footer />
    </main>
  );
}