import { useState } from "react";
import { FiInstagram, FiYoutube, FiPhone, FiMapPin } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

function Footer() {
  const [feedbackEmail, setFeedbackEmail] = useState("");

  const sendWhatsApp = () => {
    const message = `Feedback from ${localStorage.getItem("userEmail") || feedbackEmail || "a user"}: ${feedbackEmail}`;
    const whatsappUrl = `https://wa.me/918428256334?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    setFeedbackEmail("");
  };

  const joinWhatsappGroup = () => {
    const message = `Hi, I would like to join the RK Sarees WhatsApp group!`;
    const whatsappUrl = `https://wa.me/918428256334?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <footer className="bg-[#111111] text-gray-300 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Brand Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-widest text-pink-500 mb-1">RK Sarees</h2>
          <p className="text-xs font-semibold text-[#f3e5ab] tracking-wide uppercase italic">
            "Dressing a Better World for Girls"
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            Discover elegance with our exclusive handcrafted saree collections. Crafted for every special occasion.
          </p>
        </div>

        {/* Shop Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-pink-500 cursor-pointer transition-colors">Silk Sarees</li>
            <li className="hover:text-pink-500 cursor-pointer transition-colors">Designer Sarees</li>
            <li className="hover:text-pink-500 cursor-pointer transition-colors">Wedding Collection</li>
            <li className="hover:text-pink-500 cursor-pointer transition-colors">New Arrivals</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-start gap-3">
              <FiMapPin className="text-pink-500 mt-1 shrink-0" size={18} />
              <span>
                291 A, Puthumariamman Koil Veeranam Main Road, Salem - 636003.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <FiPhone className="text-pink-500 shrink-0" size={16} />
              <div className="flex flex-col">
                <a href="tel:+918428256334" className="hover:text-pink-400 transition-colors">+91 8428256334</a>
                <a href="tel:+916380308150" className="hover:text-pink-400 transition-colors">+91 6380308150</a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FaWhatsapp className="text-[#25D366] shrink-0" size={17} />
              <a
                href="https://wa.me/918428256334"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-400 transition-colors"
              >
                +91 8428256334 / 6380308150
              </a>
            </div>
          </div>
        </div>

        {/* Feedback & Social */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2">Feedback & Connect</h3>
          <p className="text-sm text-gray-400">We'd love to hear your thoughts!</p>
          <div className="flex">
            <input 
              type="text" 
              placeholder="Enter your feedback" 
              className="px-4 py-2 w-full text-black outline-none text-sm rounded-l"
              value={feedbackEmail}
              onChange={(e) => setFeedbackEmail(e.target.value)} 
            />
            <button 
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 font-medium transition-colors text-sm rounded-r"
              onClick={sendWhatsApp}
            >
              Send
            </button>
          </div>
          <button 
            className="flex items-center gap-2 text-white hover:text-green-400 text-sm font-medium transition-colors" 
            onClick={joinWhatsappGroup}
          >
            <FaWhatsapp size={16} className="text-[#25D366]" /> Join Our WhatsApp Group
          </button>
          
          <div className="flex space-x-4 pt-3">
            <a
              href="https://www.instagram.com/rk_sarees_18"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram @rk_sarees_18"
              className="text-gray-400 hover:text-pink-500 transition-colors flex items-center gap-1.5"
            >
              <FiInstagram size={22} />
              <span className="text-xs">@rk_sarees_18</span>
            </a>
            <a
              href="https://www.youtube.com/@rksarees4930"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube @rksarees4930"
              className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
            >
              <FiYoutube size={22} />
              <span className="text-xs">@rksarees4930</span>
            </a>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
        <p>© 2026 RK Sarees. All Rights Reserved. Dressing a Better World for Girls.</p>
      </div>
    </footer>
  );
}

export default Footer;
