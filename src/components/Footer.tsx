import { Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white shadow-md py-4 px-6">
      <div className="w-full flex justify-between items-center">
        <p className="text-sm font-medium">🪦 Opepens</p>
        <div className="flex items-center">
          <a href="https://twitter.com/0xharsheth" className="text-sm mr-2 text-blue-400">Made by 0xHarsh</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;